const PlanService = require('../services/plan.service');
const logger = require('../../../utils/logger');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * Get all plans
 */
exports.getPlans = async (req, res) => {
    try {
        // Pass query parameters as filters
        const filters = req.query;
        console.log('Fetching plans with filters:', filters);

        const plans = await PlanService.getPlans(filters);
        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        logger.error('Error in getPlans:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get plan by ID
 */
exports.getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de plan invalide'
            });
        }

        const plan = await PlanService.getPlanById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan non trouvé'
            });
        }

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        logger.error(`Error in getPlanById: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new plan with status validation
 */
exports.createPlan = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const userId = req.user.id;
        const planData = {
            ...req.body,
            createdBy: userId
        };

        const plan = await PlanService.createPlan(planData, userId);
        res.status(201).json({
            success: true,
            data: plan,
            message: 'Plan créé avec succès'
        });
    } catch (error) {
        logger.error(`Error in createPlan: ${error.message}`);

        // Determine the appropriate status code based on the error
        let statusCode = 500;
        if (error.message.includes('trouvé')) {
            statusCode = 404;
        } else if (error.message.includes('valide') || error.message.includes('planifiée')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update a plan with status validation
 */
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de plan invalide'
            });
        }

        const plan = await PlanService.updatePlan(id, req.body, userId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: plan,
            message: 'Plan mis à jour avec succès'
        });
    } catch (error) {
        logger.error(`Error in updatePlan: ${error.message}`);

        // Determine the appropriate status code based on the error
        let statusCode = 500;
        if (error.message.includes('trouvé')) {
            statusCode = 404;
        } else if (error.message.includes('valide') || error.message.includes('planifiée')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete a plan and cancel the equipment activity
 */
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de plan invalide'
            });
        }

        const result = await PlanService.deletePlan(id, userId);

        res.status(200).json({
            success: true,
            message: 'Plan supprimé avec succès'
        });
    } catch (error) {
        logger.error(`Error in deletePlan: ${error.message}`);

        // Determine the appropriate status code based on the error
        let statusCode = 500;
        if (error.message.includes('trouvé')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get available equipment for planning
 */
exports.getAvailableEquipment = async (req, res) => {
    try {
        const { startDate, endDate, type, projectId } = req.query;

        console.log('getAvailableEquipment - Request params:', { startDate, endDate, type, projectId });

        if (!startDate || !endDate || !type) {
            return res.status(400).json({
                success: false,
                message: 'Les dates de début, de fin et le type sont requis'
            });
        }

        // Log parameters after formatting
        console.log('getAvailableEquipment - Parsed dates:', {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            projectId
        });

        const equipment = await PlanService.getAvailableEquipment(
            new Date(startDate),
            new Date(endDate),
            type,
            projectId
        );

        console.log(`getAvailableEquipment - Found ${equipment.length} available equipment`);

        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error(`Error in getAvailableEquipment: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 