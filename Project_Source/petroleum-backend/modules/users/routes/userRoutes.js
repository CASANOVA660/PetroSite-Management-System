const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const authMiddleware = require('../../../middleware/auth');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../../middleware/auth');
const User = require('../models/User');

// Middleware to check if it's the first user
const firstUserMiddleware = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            // Skip auth for first user
            next();
        } else {
            // Apply auth middleware for subsequent users
            authenticateToken(req, res, next);
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Public routes - no authentication needed
router.post('/activate', userController.activateAccount);
router.get('/activate/:token', userController.activateAccount);
router.post('/complete-profile/:token', userController.completeProfile);

// Route to get user by account ID (used by chat)
// Protected routes - require authentication
router.use(authenticateToken);

// User management routes
router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Profile routes (protected)
router.put('/:id/profile', userController.updateProfile);

// Profile picture upload route
router.post('/profile-picture', upload.single('profilePicture'), userController.uploadProfilePicture);

module.exports = router;