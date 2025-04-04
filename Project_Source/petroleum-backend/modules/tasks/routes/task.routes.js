const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const auth = require('../../../middleware/auth');

// Get user's tasks
router.get('/user', auth, taskController.getUserTasks);

// Update task status
router.patch('/:taskId/status', auth, taskController.updateTaskStatus);

// Delete task
router.delete('/:taskId', auth, taskController.deleteTask);

module.exports = router; 