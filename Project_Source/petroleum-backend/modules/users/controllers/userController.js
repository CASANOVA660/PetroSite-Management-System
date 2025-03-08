const User = require('../models/User');
const Account = require('../models/Account');
const { hashPassword } = require('../../../utils/bcrypt');
const crypto = require('crypto');
const { sendActivationEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const { createNotification } = require('../../../modules/notifications/controllers/notificationController');


const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, role } = req.body;

    // Check if any users exist
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // If not first user, check if requester is Manager
    if (!isFirstUser && (!req.user || req.user.role !== 'Manager')) {
      return res.status(403).json({ error: 'Seul le Manager peut créer des utilisateurs' });
    }

    // For first user, force role to be Manager
    const userRole = isFirstUser ? 'Manager' : role;

    // Check if email exists with a more specific error message
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({
        error: 'Cet email est déjà utilisé par un autre utilisateur',
        field: 'email'
      });
    }

    // Validate required fields
    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({
        error: 'Le nom, prénom, email et rôle sont requis',
      });
    }

    // Generate activation token and temporary password
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tempPassword = crypto.randomBytes(10).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Hash the temporary password
    const encryptedPassword = await hashPassword(tempPassword);

    // Create user with only required fields
    const user = await User.create({
      nom,
      prenom,
      email,
      role,
      estActif: false
    });

    // Create account
    const account = await Account.create({
      email,
      motDePasse: encryptedPassword,
      utilisateurAssocie: user._id,
      activationToken,
      activationTokenExpiry,
      mustChangePassword: true
    });

    try {
      // Send activation email
      await sendActivationEmail(email, activationToken, tempPassword);
      console.log('Activation email sent successfully');

      res.status(201).json({
        message: 'Utilisateur créé avec succès. Email d\'activation envoyé.',
        userId: user._id,
        isFirstUser
      });
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
      // Still create the user but inform about email failure
      res.status(201).json({
        message: 'Utilisateur créé mais l\'envoi de l\'email a échoué',
        userId: user._id,
        isFirstUser,
        emailError: true
      });
    }

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'utilisateur',
      details: error.message
    });
  }
};

const activateAccount = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find account with valid token
    const account = await Account.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: new Date() }
    }).populate('utilisateurAssocie');

    if (!account) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Hash and encrypt new password
    const encryptedPassword = await hashPassword(newPassword);

    // Update account
    account.motDePasse = encryptedPassword;
    account.activationToken = undefined;
    account.activationTokenExpiry = undefined;
    account.mustChangePassword = false;
    await account.save();

    // Activate user
    const user = await User.findByIdAndUpdate(
      account.utilisateurAssocie._id,
      { estActif: true },
      { new: true }
    );

    // Find manager and create notification
    const manager = await User.findOne({ role: 'Manager' });
    if (manager) {
      await createNotification({
        type: 'ACCOUNT_ACTIVATION',
        message: `L'utilisateur ${user.nom} (${user.email}) a activé son compte.`,
        userId: manager._id,
        isRead: false
      });

      // Emit socket event for real-time table update
      global.io.emit('userStatusUpdate', {
        userId: user._id,
        estActif: true
      });
    }

    res.json({ message: 'Compte activé avec succès' });

  } catch (error) {
    console.error('Account activation error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'activation du compte' });
  }
};

const completeProfile = async (req, res) => {
  const { token } = req.params;
  const { nom, motDePasse } = req.body;
  const compte = await Account.findOne({ activationToken: token });
  if (!compte) return res.status(400).json({ error: 'Token invalide' });

  const utilisateur = await User.findById(compte.utilisateurAssocie);
  utilisateur.nom = nom;
  await utilisateur.save();

  compte.motDePasse = await hashPassword(motDePasse);
  compte.activationToken = null;
  compte.activationTokenExpiry = null;
  await compte.save();

  // Notifier le Manager
  const manager = await User.findOne({ rôle: 'Manager' });
  await envoyerNotificationFCM(manager.email, `L'utilisateur ${utilisateur.email} a complété son profil et est actif.`);

  res.status(200).json({ message: 'Profil complété' });
};

const listUsers = async (req, res) => {
  try {
    let users;

    // If user is Manager, return all users
    if (req.user.role === 'Manager') {
      users = await User.find().sort({ createdAt: -1 });
    } else {
      // For non-managers, only return their own data
      users = await User.find({ _id: req.user._id });
    }

    console.log('Sending users:', users); // Debug log
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Allow users to only see their own profile unless they are Manager
    if (req.user.role !== 'Manager' && req.user._id !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

const updateUser = async (req, res) => {
  if (req.user.role !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  const { email, rôle, niveauAcces, motDePasse } = req.body;
  const utilisateur = await User.findById(req.params.id);
  if (email) utilisateur.email = email;
  if (rôle) utilisateur.role = rôle;
  if (niveauAcces) utilisateur.niveauAcces = niveauAcces;
  utilisateur.updatedAt = Date.now();
  await utilisateur.save();

  if (motDePasse) {
    const compte = await Account.findOne({ utilisateurAssocie: req.params.id });
    compte.motDePasse = await hashPassword(motDePasse);
    await compte.save();
  }

  res.status(200).json({ message: 'Utilisateur mis à jour' });
};

const deleteUser = async (req, res) => {
  if (req.user.role !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  await User.findByIdAndDelete(req.params.id);
  await Account.deleteOne({ utilisateurAssocie: req.params.id });
  res.status(200).json({ message: 'Utilisateur supprimé' });
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user
    const { telephone, country, city, state } = req.body;

    // Only allow updating specific fields
    const updateData = {
      telephone,
      country,
      city,
      state,
      updatedAt: new Date()
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        telephone: user.telephone,
        country: user.country,
        city: user.city,
        state: user.state
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
};

module.exports = { createUser, activateAccount, completeProfile, listUsers, getUser, updateUser, deleteUser, updateProfile };