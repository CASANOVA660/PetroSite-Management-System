const Notification = require('../models/Notification');
const User = require('../../users/models/User');
const mongoose = require('mongoose');

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
            isRead,
            createdAt: new Date()
          })
        )
      );

      // Emit socket events for each manager
      notifications.forEach(notification => {
        const socketId = global.userSockets.get(String(notification.userId));
        if (socketId) {
          global.io.to(socketId).emit('notification', {
            type: 'NEW_NOTIFICATION',
            payload: notification
          });
        }
      });

      console.log('Manager notifications created:', notifications);
      return notifications;
    } else {
      // For other notification types, create as normal
      const notification = await Notification.create({
        type,
        message,
        userId,
        isRead,
        createdAt: new Date()
      });

      // Get the socket ID for this user
      const socketId = global.userSockets.get(String(userId));

      // Emit socket event for real-time updates if user is connected
      if (socketId) {
        global.io.to(socketId).emit('notification', {
          type: 'NEW_NOTIFICATION',
          payload: notification
        });
      }

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
    const userId = req.user.userId;
    console.log('Fetching notifications for user:', userId); // Debug log
    console.log('User object from request:', req.user); // Debug log

    // Convert userId to ObjectId if it's a string
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log('Converted user ID to ObjectId:', userObjectId); // Debug log

    // Get notifications specific to this user
    const query = { userId: userObjectId };
    console.log('MongoDB query:', JSON.stringify(query)); // Debug log

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'nom email');

    console.log('Found notifications:', notifications); // Debug log
    console.log('Number of notifications found:', notifications.length); // Debug log

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
    const notificationId = new mongoose.Types.ObjectId(req.params.id);
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await Notification.updateMany(
      { userId: userObjectId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Error marking all notifications as read' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
  markAllAsRead
};