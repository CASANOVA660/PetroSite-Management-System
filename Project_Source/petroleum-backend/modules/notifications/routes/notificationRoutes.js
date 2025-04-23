const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../../../middleware/auth');

// Route to get all notifications for current user
router.get('/', auth, notificationController.getNotifications);

// Route to mark a notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// Route to mark all notifications as read
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Route to create a notification from frontend
router.post('/', auth, notificationController.createNotificationFromFrontend);

module.exports = router;