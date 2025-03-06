const Notification = require('../models/Notification');
const User = require('../../users/models/User');

const createNotification = async ({ type, message, userId, isRead = false }) => {
  try {
    const notification = await Notification.create({
      type,
      message,
      userId,
      isRead
    });

    // Emit socket event for real-time updates
    global.io.emit('notification', {
      type: 'NEW_NOTIFICATION',
      payload: notification
    });

    console.log('Notification created:', notification);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'nom email');

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification
};