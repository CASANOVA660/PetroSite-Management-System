const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const budgetValidation = [
    body('type')
        .trim()
        .notEmpty().withMessage('Le type de budget est requis')
        .isIn(['Opérationnel', 'Investissement', 'Marketing', 'RH', 'Technique', 'HSE', 'Autre'])
        .withMessage('Type de budget invalide'),
    body('description')
        .trim()
        .notEmpty().withMessage('La description du budget est requise'),
    body('amount')
        .isNumeric().withMessage('Le montant doit être un nombre')
        .custom(value => value >= 0).withMessage('Le montant doit être positif'),
    body('currency')
        .trim()
        .notEmpty().withMessage('La devise est requise')
        .isIn(['EUR', 'USD', 'GBP', 'MAD', 'DZD', 'TND'])
        .withMessage('Devise invalide')
];

// Create validation for project budgets
const createBudgetValidation = [
    ...budgetValidation,
    body('projectId')
        .trim()
        .notEmpty().withMessage('L\'ID du projet est requis')
        .isMongoId().withMessage('ID de projet invalide')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Budget routes
router.get('/project/:projectId', budgetController.getProjectBudgets);
router.get('/project/:projectId/totals', budgetController.getProjectBudgetTotals);
router.get('/project/:projectId/stats', budgetController.getProjectBudgetStats);
router.get('/:id', budgetController.getBudgetById);
router.post('/', createBudgetValidation, budgetController.createBudget);
router.put('/:id', budgetValidation, budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;