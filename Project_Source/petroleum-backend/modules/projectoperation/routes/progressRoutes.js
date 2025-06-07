const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../../../middleware/auth');

// Progress routes
router.get('/:projectId/progress', authMiddleware, progressController.getProjectProgress);
router.post('/:projectId/progress', authMiddleware, progressController.createProgress);
router.put('/progress/:progressId', authMiddleware, progressController.updateProgress);
router.delete('/progress/:progressId', authMiddleware, progressController.deleteProgress);

// Milestone routes
router.get('/:projectId/milestones', authMiddleware, progressController.getProjectMilestones);
router.get('/milestones/:milestoneId', authMiddleware, progressController.getMilestoneById);
router.post('/:projectId/milestones', authMiddleware, progressController.createMilestone);
router.put('/milestones/:milestoneId', authMiddleware, progressController.updateMilestone);
router.delete('/milestones/:milestoneId', authMiddleware, progressController.deleteMilestone);

// Task routes
router.post('/:projectId/milestones/:milestoneId/tasks', authMiddleware, progressController.createMilestoneTask);
router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', authMiddleware, progressController.updateMilestoneTask);
router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', authMiddleware, progressController.deleteMilestoneTask);

module.exports = router; 