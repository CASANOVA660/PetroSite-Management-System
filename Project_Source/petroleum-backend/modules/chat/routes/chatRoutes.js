const express = require('express');
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../../../middleware/auth');

const router = express.Router();

// All routes use auth middleware
router.use(authMiddleware);

// Chat routes
router.route('/')
    .post(chatController.createChat)
    .get(chatController.getUserChats);

router.route('/:chatId')
    .get(chatController.getChatById)
    .put(chatController.updateChat);

router.route('/:chatId/participants')
    .post(chatController.addParticipant);

router.route('/:chatId/participants/:userId')
    .delete(chatController.removeParticipant);

// Message routes
router.route('/:chatId/messages')
    .post(messageController.sendMessage)
    .get(messageController.getMessages);

router.route('/:chatId/read')
    .put(messageController.markChatAsRead);

// Unread message count
router.route('/messages/unread')
    .get(messageController.getUnreadCount);

module.exports = router; 