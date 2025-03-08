const Notification = require('../models/Notification');
const User = require('../../users/models/User');

const createNotification = async ({ type, message, userId, isRead = false, targetRole = null }) => {
  try {
    // If it's an ACCOUNT_ACTIVATION notification, only create it for managers
    if (type === 'ACCOUNT_ACTIVATION') {
      const managers = await User.find({ role: 'Manager' });

      // Create notifications for all managers
      const notifications = await Promise.all(
        managers.map(manager =>
          Notification.create({
            type,
            message,
            userId: manager._id,
            isRead
          })
        )
      );

      // Emit socket events for each manager
      notifications.forEach(notification => {
        global.io.emit('notification', {
          type: 'NEW_NOTIFICATION',
          payload: notification,
          targetRole: 'Manager'
        });
      });

      console.log('Manager notifications created:', notifications);
      return notifications;
    } else {
      // For other notification types, create as normal
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
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getNotifications = async (req, res) => {
  try {
    // Get the requesting user's role
    const requestingUser = req.user;

    if (!requestingUser) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Veuillez vous connecter pour accéder aux notifications'
      });
    }

    let notifications;

    // If user is Manager, they can see all notifications
    if (requestingUser.role === 'Manager') {
      notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'nom email');
    } else {
      // For other roles, only show notifications where they are the userId
      // and exclude ACCOUNT_ACTIVATION type notifications
      notifications = await Notification.find({
        $and: [
          { userId: requestingUser._id },
          { type: { $ne: 'ACCOUNT_ACTIVATION' } } // Exclude account activation notifications
        ]
      })
        .sort({ createdAt: -1 })
        .populate('userId', 'nom email');
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des notifications',
      message: error.message
    });
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