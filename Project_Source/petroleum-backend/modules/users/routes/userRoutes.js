const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../../../middleware/auth');
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
            authMiddleware(req, res, next);
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Protected routes - require authentication
router.use(authMiddleware);

// List users - only accessible by Manager
router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id', userController.getUser);

// Public route for account activation
router.post('/activate', userController.activateAccount);

router.get('/activate/:token', userController.activateAccount);
router.post('/complete-profile/:token', userController.completeProfile);

module.exports = router;