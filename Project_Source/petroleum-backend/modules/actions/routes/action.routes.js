const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const actionController = require('../controllers/action.controller');
const { validateRequest } = require('../../../middleware/validateRequest');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const createActionValidation = [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('content').notEmpty().withMessage('Le contenu est requis'),
    body('responsible').notEmpty().withMessage('Le responsable est requis'),
    body('responsibleFollowup').notEmpty().withMessage('Le responsable de suivi est requis'),
    body('startDate').notEmpty().withMessage('La date de début est requise'),
    body('endDate').notEmpty().withMessage('La date de fin est requise'),
    body('category').notEmpty().withMessage('La catégorie est requise'),
    body('source').notEmpty().withMessage('La source est requise'),
    validateRequest
];

// Less strict validation for updates
const updateActionValidation = [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('content').notEmpty().withMessage('Le contenu est requis'),
    body('responsible').notEmpty().withMessage('Le responsable est requis'),
    body('responsibleFollowup').notEmpty().withMessage('Le responsable de suivi est requis'),
    body('startDate').notEmpty().withMessage('La date de début est requise'),
    body('endDate').notEmpty().withMessage('La date de fin est requise'),
    validateRequest
];

const updateStatusValidation = [
    body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Statut invalide'),
    validateRequest
];

// Apply authentication to all routes
router.use(authMiddleware);

// Routes
router.post('/', createActionValidation, actionController.createAction);
router.get('/project/:projectId', actionController.getProjectActions);
router.get('/project/:projectId/category/:category', actionController.getCategoryActions);
router.patch('/:actionId/status', updateStatusValidation, actionController.updateActionStatus);
router.put('/:actionId', updateActionValidation, actionController.updateAction);
router.delete('/:actionId', actionController.deleteAction);

// Get all actions (global view)
router.get('/', actionController.getAllActions);

module.exports = router;