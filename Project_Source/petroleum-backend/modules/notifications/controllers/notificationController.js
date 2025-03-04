const { envoyerNotificationFCM } = require('../services/fcmService');

const notifyManager = async (req, res) => {
  const { managerEmail, userEmail } = req.body;
  const message = `L’utilisateur ${userEmail} a complété son profil et est actif.`;
  await envoyerNotificationFCM(managerEmail, message);
  res.status(200).json({ message: 'Notification envoyée' });
};

module.exports = { notifyManager };