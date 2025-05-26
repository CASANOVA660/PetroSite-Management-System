const Budget = require('../models/Budget');
const Project = require('../../projects/models/Project');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

/**
 * Service layer for budget operations
 */
class BudgetService {
    /**
     * Get all budgets for a specific project
     * @param {string} projectId - The ID of the project
     * @returns {Promise<Array>} List of budget items
     */
    async getProjectBudgets(projectId) {
        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error('ID de projet invalide');
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Projet non trouvé');
        }

        // Get budgets for the project
        return await Budget.find({
            projectId,
            isDeleted: false
        }).sort({ createdAt: -1 });
    }

    /**
     * Get a budget by ID
     * @param {string} id - The ID of the budget
     * @returns {Promise<Object>} Budget item
     */
    async getBudgetById(id) {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de budget invalide');
        }

        const budget = await Budget.findOne({
            _id: id,
            isDeleted: false
        });

        if (!budget) {
            throw new Error('Budget non trouvé');
        }

        return budget;
    }

    /**
     * Create a new budget
     * @param {Object} budgetData - The budget data
     * @param {string} userId - The ID of the user creating the budget
     * @returns {Promise<Object>} Newly created budget
     */
    async createBudget(budgetData, userId) {
        const { projectId, type, description, amount, currency } = budgetData;

        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error('ID de projet invalide');
        }

        // Validate amount
        if (isNaN(amount) || amount < 0) {
            throw new Error('Le montant doit être un nombre positif');
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Projet non trouvé');
        }

        // Create and save the budget
        const budget = new Budget({
            projectId,
            type,
            description,
            amount: parseFloat(amount),
            currency,
            createdBy: userId,
            updatedBy: userId
        });

        await budget.save();
        return budget;
    }

    /**
     * Update an existing budget
     * @param {string} id - The ID of the budget to update
     * @param {Object} updateData - The data to update
     * @param {string} userId - The ID of the user updating the budget
     * @returns {Promise<Object>} Updated budget
     */
    async updateBudget(id, updateData, userId) {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de budget invalide');
        }

        // Validate amount if provided
        if (updateData.amount !== undefined && (isNaN(updateData.amount) || updateData.amount < 0)) {
            throw new Error('Le montant doit être un nombre positif');
        }

        // Find the budget
        const budget = await Budget.findOne({
            _id: id,
            isDeleted: false
        });

        if (!budget) {
            throw new Error('Budget non trouvé');
        }

        // Update budget fields
        const { type, description, amount, currency } = updateData;

        if (type !== undefined) budget.type = type;
        if (description !== undefined) budget.description = description;
        if (amount !== undefined) budget.amount = parseFloat(amount);
        if (currency !== undefined) budget.currency = currency;

        budget.updatedBy = userId;

        await budget.save();
        return budget;
    }

    /**
     * Delete a budget (soft delete)
     * @param {string} id - The ID of the budget to delete
     * @param {string} userId - The ID of the user deleting the budget
     * @returns {Promise<Object>} The deleted budget
     */
    async deleteBudget(id, userId) {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID de budget invalide');
        }

        // Find the budget
        const budget = await Budget.findOne({
            _id: id,
            isDeleted: false
        });

        if (!budget) {
            throw new Error('Budget non trouvé');
        }

        // Soft delete the budget
        budget.isDeleted = true;
        budget.updatedBy = userId;
        await budget.save();

        return budget;
    }

    /**
     * Get total budget amounts by currency for a project
     * @param {string} projectId - The ID of the project
     * @returns {Promise<Array>} List of totals by currency
     */
    async getProjectBudgetTotals(projectId) {
        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error('ID de projet invalide');
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error('Projet non trouvé');
        }

        // Aggregate budget totals by currency
        return await Budget.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), isDeleted: false } },
            {
                $group: {
                    _id: '$currency',
                    total: { $sum: '$amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    currency: '$_id',
                    total: 1
                }
            }
        ]);
    }

    /**
     * Get budget statistics for a project
     * @param {string} projectId - The ID of the project
     * @returns {Promise<Object>} Budget statistics
     */
    async getProjectBudgetStats(projectId) {
        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error('ID de projet invalide');
        }

        // Get all budgets for the project
        const budgets = await Budget.find({
            projectId,
            isDeleted: false
        });

        // Initialize stats object
        const stats = {
            totalCount: budgets.length,
            byType: {},
            totalByCurrency: {}
        };

        // Calculate stats
        budgets.forEach(budget => {
            // Count by type
            if (!stats.byType[budget.type]) {
                stats.byType[budget.type] = 0;
            }
            stats.byType[budget.type]++;

            // Sum by currency
            if (!stats.totalByCurrency[budget.currency]) {
                stats.totalByCurrency[budget.currency] = 0;
            }
            stats.totalByCurrency[budget.currency] += budget.amount;
        });

        return stats;
    }
}

module.exports = new BudgetService(); 