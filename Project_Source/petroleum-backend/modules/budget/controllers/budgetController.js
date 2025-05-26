const { validationResult } = require('express-validator');
const budgetService = require('../services/budgetService');
const logger = require('../../../utils/logger');

/**
 * Get all budgets for a specific project
 */
exports.getProjectBudgets = async (req, res) => {
    try {
        const { projectId } = req.params;
        const budgets = await budgetService.getProjectBudgets(projectId);

        res.status(200).json({
            success: true,
            data: budgets
        });
    } catch (error) {
        logger.error('Error in getProjectBudgets:', error);
        res.status(error.message.includes('ID de projet invalide') ? 400 :
            error.message.includes('Projet non trouvé') ? 404 : 500)
            .json({
                success: false,
                message: error.message || 'Erreur lors de la récupération des budgets'
            });
    }
};

/**
 * Get a specific budget by ID
 */
exports.getBudgetById = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await budgetService.getBudgetById(id);

        res.status(200).json({
            success: true,
            data: budget
        });
    } catch (error) {
        logger.error('Error in getBudgetById:', error);
        res.status(error.message.includes('ID de budget invalide') ? 400 :
            error.message.includes('Budget non trouvé') ? 404 : 500)
            .json({
                success: false,
                message: error.message || 'Erreur lors de la récupération du budget'
            });
    }
};

/**
 * Create a new budget for a project
 */
exports.createBudget = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const budgetData = req.body;
        const userId = req.user.id;

        const budget = await budgetService.createBudget(budgetData, userId);

        // Notify about new budget (optional)
        if (global.io) {
            global.io.to(budgetData.projectId.toString()).emit('budget-update', {
                action: 'created',
                budget: budget
            });
        }

        res.status(201).json({
            success: true,
            data: budget,
            message: 'Budget créé avec succès'
        });
    } catch (error) {
        logger.error('Error in createBudget:', error);
        const status = error.message.includes('ID de projet invalide') ||
            error.message.includes('Le montant doit être') ? 400 :
            error.message.includes('Projet non trouvé') ? 404 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Erreur lors de la création du budget'
        });
    }
};

/**
 * Update an existing budget
 */
exports.updateBudget = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;

        const budget = await budgetService.updateBudget(id, updateData, userId);

        // Notify about updated budget (optional)
        if (global.io) {
            global.io.to(budget.projectId.toString()).emit('budget-update', {
                action: 'updated',
                budget: budget
            });
        }

        res.status(200).json({
            success: true,
            data: budget,
            message: 'Budget mis à jour avec succès'
        });
    } catch (error) {
        logger.error('Error in updateBudget:', error);
        const status = error.message.includes('ID de budget invalide') ||
            error.message.includes('Le montant doit être') ? 400 :
            error.message.includes('Budget non trouvé') ? 404 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour du budget'
        });
    }
};

/**
 * Delete a budget (soft delete)
 */
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const budget = await budgetService.deleteBudget(id, userId);

        // Notify about deleted budget (optional)
        if (global.io) {
            global.io.to(budget.projectId.toString()).emit('budget-update', {
                action: 'deleted',
                budgetId: id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Budget supprimé avec succès'
        });
    } catch (error) {
        logger.error('Error in deleteBudget:', error);
        const status = error.message.includes('ID de budget invalide') ? 400 :
            error.message.includes('Budget non trouvé') ? 404 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression du budget'
        });
    }
};

/**
 * Get total budget amounts by currency for a project
 */
exports.getProjectBudgetTotals = async (req, res) => {
    try {
        const { projectId } = req.params;
        const totals = await budgetService.getProjectBudgetTotals(projectId);

        res.status(200).json({
            success: true,
            data: totals
        });
    } catch (error) {
        logger.error('Error in getProjectBudgetTotals:', error);
        const status = error.message.includes('ID de projet invalide') ? 400 :
            error.message.includes('Projet non trouvé') ? 404 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Erreur lors de la récupération des totaux budgétaires'
        });
    }
};

/**
 * Get budget statistics for a project
 */
exports.getProjectBudgetStats = async (req, res) => {
    try {
        const { projectId } = req.params;
        const stats = await budgetService.getProjectBudgetStats(projectId);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in getProjectBudgetStats:', error);
        const status = error.message.includes('ID de projet invalide') ? 400 : 500;

        res.status(status).json({
            success: false,
            message: error.message || 'Erreur lors de la récupération des statistiques budgétaires'
        });
    }
}; 