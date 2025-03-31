const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const actionController = require('../controllers/action.controller');
const { validateRequest } = require('../../../middleware/validateRequest');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const createActionValidation = [
    body('content').notEmpty().withMessage('Le contenu est requis'),
    body('responsible').isMongoId().withMessage('ID de responsable invalide'),
    body('startDate').isISO8601().withMessage('Date de début invalide'),
    body('endDate').isISO8601().withMessage('Date de fin invalide'),
    body('projectId').isMongoId().withMessage('ID de projet invalide'),
    body('category').isIn(['Documents globale', 'Dossier Administratif', 'Dossier Technique', 'Dossier RH', 'Dossier HSE'])
        .withMessage('Catégorie invalide'),
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
router.delete('/:actionId', actionController.deleteAction);

module.exports = router;