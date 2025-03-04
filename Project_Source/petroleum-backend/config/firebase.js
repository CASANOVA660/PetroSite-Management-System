const admin = require('firebase-admin');

const initializeFirebase = () => {
  const serviceAccount = require('./serviceAccountKey.json'); // Remplacez par votre fichier
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase initialized');
};

module.exports = { initializeFirebase, admin };