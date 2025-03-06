const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticateToken } = require('../../middleware/auth');

// Apply authentication middleware
router.use(authenticateToken);

// Get all notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

module.exports = router;