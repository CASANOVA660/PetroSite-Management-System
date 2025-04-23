const Notification = require('../models/Notification');
const User = require('../../users/models/User');
const mongoose = require('mongoose');

// Debug wrapper to track notification delivery status
const trackNotificationDelivery = (userId, notification, socketId) => {
  try {
    if (global.io && socketId) {
      console.log(`Tracking notification delivery for user ${userId} via socket ${socketId}`);

      // Log important notification properties
      const notificationType = notification.type;
      const notificationRole = notification.metadata?.role || 'unspecified';
      console.log(`Notification type: ${notificationType}, Role: ${notificationRole}`);

      // Track socket event delivery
      const ackTimeout = setTimeout(() => {
        console.log(`⚠️ Socket notification may not have been delivered to user ${userId} (no acknowledgement)`);
        console.log(`Notification details: type=${notificationType}, role=${notificationRole}`);
      }, 2000);

      global.io.to(socketId).emit('notification', {
        type: 'NEW_NOTIFICATION',
        payload: notification
      }, () => {
        clearTimeout(ackTimeout);
        console.log(`✅ Socket notification delivered successfully to user ${userId}`);
        console.log(`Delivered notification: type=${notificationType}, role=${notificationRole}`);
      });

      return true;
    } else {
      console.log(`❌ Could not deliver notification to user ${userId}. Socket connection issue.`);
      console.log(`Socket ID: ${socketId ? socketId : 'Not connected'}`);
      console.log(`global.io available: ${global.io ? 'Yes' : 'No'}`);
      console.log(`global.userSockets has user: ${global.userSockets?.has(String(userId)) ? 'Yes' : 'No'}`);

      // Try to find the user's name to help with debugging
      User.findById(userId).select('nom prenom').then(user => {
        if (user) {
          console.log(`User ${userId} is ${user.prenom} ${user.nom}`);

          // Check if this user has any other notifications of this type
          Notification.find({ userId, type: notification.type }).then(existingNotifications => {
            console.log(`User has ${existingNotifications.length} existing notifications of type ${notification.type}`);
          });
        } else {
          console.log(`User ${userId} not found in database`);
        }
      }).catch(err => {
        console.error(`Error looking up user ${userId}:`, err);
      });

      return false;
    }
  } catch (error) {
    console.error(`Failed to deliver notification to user ${userId}:`, error);
    return false;
  }
};

const createNotification = async ({ type, message, userId, isRead = false, targetRole = null, metadata = null }) => {
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
            metadata,
            createdAt: new Date()
          })
        )
      );

      // Emit socket events for each manager
      notifications.forEach(notification => {
        const socketId = global.userSockets.get(String(notification.userId));
        trackNotificationDelivery(notification.userId, notification, socketId);
      });

      console.log('Manager notifications created:', notifications);
      return notifications;
    } else {
      // Ensure userId is a valid ObjectId
      let formattedUserId;
      try {
        if (typeof userId === 'string') {
          formattedUserId = new mongoose.Types.ObjectId(userId);
        } else if (userId && userId.toString) {
          formattedUserId = userId;
        } else {
          throw new Error('Invalid userId format');
        }
      } catch (err) {
        console.error('Error formatting userId:', err);
        formattedUserId = userId; // Use original as fallback
      }

      console.log(`Creating notification for user with ID: ${formattedUserId}`);

      // For other notification types, create as normal
      const notification = await Notification.create({
        type,
        message,
        userId: formattedUserId,
        isRead,
        metadata,
        createdAt: new Date()
      });

      // Get the socket ID for this user
      const socketId = global.userSockets?.get(String(formattedUserId));
      console.log(`Creating notification for user ${formattedUserId}, socketId: ${socketId}`);

      // Emit socket event for real-time updates if user is connected
      trackNotificationDelivery(formattedUserId, notification, socketId);

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

    if (!userId) {
      console.error('No userId found in request');
      return res.status(400).json({
        error: 'User ID is required',
        message: 'No user ID found in request'
      });
    }

    // Convert userId to ObjectId if it's a string
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
      console.log('Converted user ID to ObjectId:', userObjectId); // Debug log
    } catch (err) {
      console.error('Error converting userId to ObjectId:', err);
      return res.status(400).json({
        error: 'Invalid user ID format',
        message: err.message
      });
    }

    // Get notifications specific to this user
    const query = { userId: userObjectId };
    console.log('MongoDB query:', JSON.stringify(query)); // Debug log

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'nom email');

    console.log('Found notifications:', notifications.length > 0 ? 'Yes' : 'No'); // Debug log
    console.log('Number of notifications found:', notifications.length); // Debug log

    if (notifications.length > 0) {
      console.log('Sample notification:', {
        id: notifications[0]._id,
        type: notifications[0].type,
        message: notifications[0].message,
        timestamp: notifications[0].createdAt
      });
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

// Create notification directly from frontend
const createNotificationFromFrontend = async (req, res) => {
  try {
    const { type, message, userId, isRead = false, metadata = null } = req.body;

    // Validate required fields
    if (!type || !message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Type, message, and userId are required'
      });
    }

    // Format userId to handle both string and ObjectId formats
    let formattedUserId;
    try {
      formattedUserId = new mongoose.Types.ObjectId(userId);
      console.log('Converted userId to ObjectId:', formattedUserId);
    } catch (err) {
      console.error('Error converting userId to ObjectId:', err, 'Using original userId:', userId);
      formattedUserId = userId;
    }

    console.log(`Notification creation request from frontend - type: ${type}, userId: ${formattedUserId}`);

    // First check if the user exists
    const userExists = await User.findById(formattedUserId).select('_id');
    if (!userExists) {
      console.error(`User with ID ${formattedUserId} not found`);
      return res.status(404).json({
        success: false,
        message: `User with ID ${formattedUserId} not found`
      });
    }

    console.log(`User found: ${userExists._id}, proceeding with notification creation`);

    // Create notification using our existing function
    const notification = await createNotification({
      type,
      message,
      userId: formattedUserId,
      isRead,
      metadata: {
        ...metadata,
        createdFromFrontend: true,
        requestUser: req.user.id
      }
    });

    // Track notification creation for debugging
    console.log(`Frontend notification created successfully, ID: ${notification._id}`);

    return res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification from frontend:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
  markAllAsRead,
  createNotificationFromFrontend
};