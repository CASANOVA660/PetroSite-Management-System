const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const globalActionController = require('../controllers/globalAction.controller');
const { validateRequest } = require('../../../middleware/validateRequest');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const createGlobalActionValidation = [
    body('title').notEmpty().withMessage('Le titre est requis'),
    body('content').notEmpty().withMessage('Le contenu est requis'),
    body('responsibleForRealization').notEmpty().withMessage('Le responsable pour la réalisation est requis'),
    body('responsibleForFollowUp').notEmpty().withMessage('Le responsable pour le suivi est requis'),
    body('category').notEmpty().withMessage('La catégorie est requise'),
    body('startDate').notEmpty().withMessage('La date de début est requise'),
    body('endDate').notEmpty().withMessage('La date de fin est requise'),
    validateRequest
];

const updateStatusValidation = [
    body('status')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Statut invalide'),
    validateRequest
];

// Apply authentication to all routes
router.use(authMiddleware);

// Routes
router.get('/', globalActionController.getAllGlobalActions);
router.get('/search', globalActionController.searchGlobalActions);
router.post('/', createGlobalActionValidation, globalActionController.createGlobalAction);
router.patch('/:actionId/status', updateStatusValidation, globalActionController.updateGlobalActionStatus);
router.put('/:actionId', createGlobalActionValidation, globalActionController.updateGlobalAction);
router.delete('/:actionId', globalActionController.deleteGlobalAction);

module.exports = router;