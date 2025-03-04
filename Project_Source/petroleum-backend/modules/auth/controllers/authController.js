const jwt = require('jsonwebtoken');
const Account = require('../../users/models/Account');
const { comparePassword } = require('../../../utils/bcrypt');

const login = async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        console.log('Login attempt for:', email);

        // Find account and populate user details
        const account = await Account.findOne({ email })
            .populate('utilisateurAssocie', 'nom email role'); // Make sure to populate role

        if (!account) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        console.log('Found account:', account); // Debug log

        try {
            // Compare passwords
            const isValidPassword = await comparePassword(motDePasse, account.motDePasse);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Generate token with role information
            const token = jwt.sign(
                {
                    userId: account.utilisateurAssocie._id,
                    email: account.utilisateurAssocie.email,
                    role: account.utilisateurAssocie.role, // Include role in token
                    nom: account.utilisateurAssocie.nom
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Generated token payload:', {
                userId: account.utilisateurAssocie._id,
                email: account.utilisateurAssocie.email,
                role: account.utilisateurAssocie.role,
                nom: account.utilisateurAssocie.nom
            }); // Debug log

            res.json({
                token,
                user: {
                    id: account.utilisateurAssocie._id,
                    email: account.utilisateurAssocie.email,
                    role: account.utilisateurAssocie.role,
                    nom: account.utilisateurAssocie.nom
                }
            });

        } catch (error) {
            console.error('Password validation error:', error);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
};

module.exports = { login }; 