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

// Define file types for message attachments
const fileFilter = (req, file, cb) => {
    // For group picture uploads, only allow images
    if (req.path === '/' && !req.path.includes('messages')) {
        // Allow only images for group pictures
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed for group pictures!'), false);
        }
    } else {
        // For chat attachments, allow various file types
        const allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
            // Videos
            'video/mp4', 'video/webm', 'video/quicktime',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/ogg'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('File type not allowed'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
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

// Message attachment route
router.post('/:chatId/messages/attachment', upload.single('file'), messageController.sendMessageWithAttachment);

router.route('/:chatId/read')
    .put(messageController.markChatAsRead);

// Unread message count
router.route('/messages/unread')
    .get(messageController.getUnreadCount);

module.exports = router; 