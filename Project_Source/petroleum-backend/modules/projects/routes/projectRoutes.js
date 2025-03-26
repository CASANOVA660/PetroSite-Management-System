const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../../../middleware/auth');

// Project routes
router.get('/', authMiddleware, projectController.listProjects);
router.get('/:id', authMiddleware, projectController.getProject);
router.post('/', authMiddleware, projectController.createProject);

module.exports = router; 