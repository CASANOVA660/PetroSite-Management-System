// petroleum-backend/initManager.js
const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const User = require('./modules/users/models/User');
const Account = require('./modules/users/models/Account');
const { hashPassword } = require('./utils/bcrypt');
const dotenv = require('dotenv');


dotenv.config();

const initManager = async () => {
    try {
        // Connectez-vous à MongoDB Atlas
        await connectDB();

        // Créez l’utilisateur Manager
        const manager = new User({
            nom: "Fahmi sahli",
            email: "Fahmi.sahli@example.com",
            role: "Manager",
            niveauAcces: "admin",
            estActif: true,
        });
        await manager.save();
        console.log('Utilisateur Manager créé:', manager);

        // Créez le compte associé
        const compteManager = new Account({
            email: "Fahmi.sahli@example.com",
            motDePasse: JSON.stringify(await hashPassword("securePassword123")),
            utilisateurAssocie: manager._id,
        });
        await compteManager.save();
        console.log('Compte Manager créé:', compteManager);

        console.log('Initialisation terminée avec succès');
    } catch (error) {
        console.error('Erreur lors de l’initialisation:', error);
    } finally {
        mongoose.connection.close();
    }
};

initManager();