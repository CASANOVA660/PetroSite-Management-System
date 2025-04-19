const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { body } = require('express-validator');
const authMiddleware = require('../../../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all tasks for the current user
router.get('/user', taskController.getUserTasks);

// Get only project action tasks for the current user
router.get('/project-actions', taskController.getProjectActionTasks);

// Get only global action tasks for the current user
router.get('/global-actions', taskController.getGlobalActionTasks);

// Get tasks by global action ID
router.get('/by-global-action/:globalActionId', taskController.getTasksByGlobalActionId);

// Get tasks by project action ID
router.get('/by-action/:actionId', taskController.getTasksByActionId);

// Force create tasks from a project action (manual trigger)
router.post('/project-action/:actionId', taskController.createTasksFromProjectAction);

// Get task history
router.get('/history', taskController.getTaskHistory);

// Create a personal task
router.post(
    '/personal',
    [
        body('title').notEmpty().withMessage('Le titre est requis'),
        body('dueDate').isISO8601().toDate().withMessage('La date d\'échéance doit être une date valide'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('La priorité doit être low, medium ou high'),
        body('subtasks').optional().isArray().withMessage('Les sous-tâches doivent être un tableau')
    ],
    taskController.createPersonalTask
);

// Update task status
router.patch(
    '/:taskId/status',
    [
        body('status').isIn(['todo', 'inProgress', 'inReview', 'done']).withMessage('Statut invalide')
    ],
    taskController.updateTaskStatus
);

// Update task progress
router.patch(
    '/:taskId/progress',
    [
        body('progress').isNumeric().withMessage('La progression doit être un nombre')
            .custom(value => value >= 0 && value <= 100).withMessage('La progression doit être entre 0 et 100')
    ],
    taskController.updateTaskProgress
);

// Add comment to task
router.post(
    '/:taskId/comments',
    [
        body('text').notEmpty().withMessage('Le texte du commentaire est requis')
    ],
    taskController.addComment
);

// Upload file to task
router.post(
    '/:taskId/files',
    taskController.uploadFile,
    taskController.uploadTaskFile
);

// Approve file
router.patch(
    '/:taskId/files/:fileId/approve',
    taskController.approveFile
);

// Toggle subtask completion
router.patch(
    '/:taskId/subtasks/:subtaskId/toggle',
    taskController.toggleSubtask
);

// Add subtask
router.post(
    '/:taskId/subtasks',
    [
        body('text').notEmpty().withMessage('Le texte de la sous-tâche est requis')
    ],
    taskController.addSubtask
);

// Review task (accept, decline, or return with feedback)
router.post(
    '/:taskId/review',
    [
        body('decision').isIn(['accept', 'decline', 'return']).withMessage('Décision invalide'),
        body('feedback').custom((value, { req }) => {
            if ((req.body.decision === 'decline' || req.body.decision === 'return') && (!value || !value.trim())) {
                throw new Error('Un commentaire est requis pour refuser ou retourner une tâche');
            }
            return true;
        })
    ],
    taskController.reviewTask
);

// Archive old tasks (admin/cron job endpoint)
// Note: This would typically be protected with an admin middleware
router.post('/archive', taskController.archiveOldTasks);

// Get task with linked data
router.get('/:taskId/with-linked-data', taskController.getTaskWithLinkedData);

module.exports = router; 