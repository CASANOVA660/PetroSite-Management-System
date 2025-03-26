const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const actionController = require('../controllers/actionController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const actionValidation = [
    body('title').trim().notEmpty().withMessage('Le titre est requis'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('type').isIn(['document', 'administrative', 'technical', 'hr', 'hse', 'planning', 'requirement', 'traceability', 'status'])
        .withMessage('Type d\'action invalide'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priorité invalide'),
    body('dueDate').optional().isISO8601().withMessage('Date d\'échéance invalide'),
    body('startDate').optional().isISO8601().withMessage('Date de début invalide'),
    body('assignedTo').optional().isMongoId().withMessage('ID d\'assignation invalide'),
    body('attachments').optional().isArray().withMessage('Les pièces jointes doivent être un tableau'),
    body('relatedEquipment').optional().isArray().withMessage('L\'équipement lié doit être un tableau')
];

const commentValidation = [
    body('text').trim().notEmpty().withMessage('Le texte du commentaire est requis')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all actions for a project
router.get('/project/:projectId', actionController.getProjectActions);

// Create a new action
router.post('/project/:projectId', actionValidation, actionController.createAction);

// Update an action
router.put('/:actionId', actionValidation, actionController.updateAction);

// Delete an action
router.delete('/:actionId', actionController.deleteAction);

// Add a comment to an action
router.post('/:actionId/comments', commentValidation, actionController.addComment);

module.exports = router; 