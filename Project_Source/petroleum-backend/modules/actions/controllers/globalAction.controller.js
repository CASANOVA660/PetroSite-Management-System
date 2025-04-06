const globalActionService = require('../services/globalAction.service');
const { validationResult } = require('express-validator');

class GlobalActionController {
    async getAllGlobalActions(req, res) {
        try {
            const filters = {};

            // Add filters based on query parameters
            if (req.query.status) filters.status = req.query.status;
            if (req.query.category) filters.category = req.query.category;
            if (req.query.project) filters.projectId = req.query.project;

            const actions = await globalActionService.getAllGlobalActions(filters);

            res.json({
                success: true,
                data: actions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createGlobalAction(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const actionData = {
                ...req.body,
                manager: req.user.id // Auto-set current user as manager
            };

            const action = await globalActionService.createGlobalAction(actionData);

            res.status(201).json({
                success: true,
                data: action
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateGlobalActionStatus(req, res) {
        try {
            const { actionId } = req.params;
            const { status } = req.body;

            const action = await globalActionService.updateGlobalActionStatus(actionId, status);

            res.json({
                success: true,
                data: action
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteGlobalAction(req, res) {
        try {
            const { actionId } = req.params;
            await globalActionService.deleteGlobalAction(actionId);

            res.json({
                success: true,
                message: 'Action supprimée avec succès'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new GlobalActionController();