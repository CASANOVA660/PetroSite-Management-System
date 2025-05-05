const express = require('express');
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory at:', uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const router = express.Router();

// All routes use auth middleware
router.use(authMiddleware);

// Chat routes
router.route('/')
    .post(upload.single('groupPicture'), chatController.createChat)
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