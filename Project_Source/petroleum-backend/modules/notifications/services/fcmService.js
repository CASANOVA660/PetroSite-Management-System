const { admin } = require('../../../config/firebase');

const envoyerNotificationFCM = async (email, message) => {
  const payload = {
    notification: {
      title: 'Nouvelle notification',
      body: message,
    },
  };
  // À configurer avec un token FCM spécifique (futur)
  // Pour l’instant, simulons une notification via email
  console.log(`Notification FCM à ${email}: ${message}`);
};

module.exports = { envoyerNotificationFCM };