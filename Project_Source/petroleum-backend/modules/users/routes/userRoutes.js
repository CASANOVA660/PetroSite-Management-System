const express = require('express');
const router = express.Router();
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

// Public routes - no authentication needed
router.post('/activate', userController.activateAccount);

// Protected routes - require authentication
router.use(authenticateToken);

// List users - only accessible by Manager
router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id', userController.getUser);

// Public route for account activation
router.get('/activate/:token', userController.activateAccount);
router.post('/complete-profile/:token', userController.completeProfile);

module.exports = router;