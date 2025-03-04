const User = require('../models/User');
const Account = require('../models/Account');
const { hashPassword } = require('../../../utils/bcrypt');
const crypto = require('crypto');
const { sendActivationEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');


const createUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body;

    // Check if any users exist
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // If not first user, check if requester is Manager
    if (!isFirstUser && (!req.user || req.user.role !== 'Manager')) {
      return res.status(403).json({ error: 'Seul le Manager peut créer des utilisateurs' });
    }

    // For first user, force role to be Manager
    const userRole = isFirstUser ? 'Manager' : role;

    // Check if email exists
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Generate activation token and temporary password
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tempPassword = crypto.randomBytes(10).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Hash the temporary password
    const encryptedPassword = await hashPassword(tempPassword);

    // Create user
    const user = await User.create({
      nom,
      email,
      role: userRole,
      niveauAcces: userRole === 'Manager' ? 'admin' : 'user',
      estActif: false // User starts as inactive
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
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
};

const activateAccount = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find account with valid token
    const account = await Account.findOne({
      activationToken: token,
      activationTokenExpiry: { $gt: new Date() }
    });

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
    await User.findByIdAndUpdate(account.utilisateurAssocie, {
      estActif: true
    });

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
  if (req.user.rôle !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  const utilisateurs = await User.find();
  res.status(200).json(utilisateurs);
};

const getUser = async (req, res) => {
  if (req.user.rôle !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  const utilisateur = await User.findById(req.params.id);
  const compte = await Account.findOne({ utilisateurAssocie: req.params.id });
  res.status(200).json({ utilisateur, compte });
};

const updateUser = async (req, res) => {
  if (req.user.rôle !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  const { email, rôle, niveauAcces, motDePasse } = req.body;
  const utilisateur = await User.findById(req.params.id);
  if (email) utilisateur.email = email;
  if (rôle) utilisateur.rôle = rôle;
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
  if (req.user.rôle !== 'Manager') return res.status(403).json({ error: 'Accès interdit' });
  await User.findByIdAndDelete(req.params.id);
  await Account.deleteOne({ utilisateurAssocie: req.params.id });
  res.status(200).json({ message: 'Utilisateur supprimé' });
};

module.exports = { createUser, activateAccount, completeProfile, listUsers, getUser, updateUser, deleteUser };