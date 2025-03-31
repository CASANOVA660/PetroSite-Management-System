const actionService = require('../services/action.service');
const { validationResult } = require('express-validator');
const { createNotification } = require('../../notifications/controllers/notificationController');


class ActionController {
    async createAction(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().map(err => ({
                        field: err.param,
                        message: err.msg
                    }))
                });
            }

            // Get the user ID from the authenticated user


            const actionData = {
                ...req.body
            };

            const action = await actionService.createAction(actionData);

            // Create notification for the responsible user
            await createNotification({
                type: 'ACTION_ASSIGNED',
                message: `Une nouvelle action "${action.title}" vous a été assignée.`,
                userId: action.responsible,
                isRead: false
            });

            res.status(201).json({
                success: true,
                data: action
            });
        } catch (error) {
            console.error('Error in createAction:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'action',
                error: error.message
            });
        }
    }

    async getProjectActions(req, res) {
        try {
            const { projectId } = req.params;
            const actions = await actionService.getProjectActions(projectId);
            res.json({
                success: true,
                data: actions
            });
        } catch (error) {
            console.error('Error in getProjectActions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des actions',
                error: error.message
            });
        }
    }

    async getCategoryActions(req, res) {
        try {
            const { projectId, category } = req.params;
            const actions = await actionService.getCategoryActions(projectId, category);
            res.json({
                success: true,
                data: actions
            });
        } catch (error) {
            console.error('Error in getCategoryActions:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des actions',
                error: error.message
            });
        }
    }

    async updateActionStatus(req, res) {
        try {
            const { actionId } = req.params;
            const { status } = req.body;
            const action = await actionService.updateActionStatus(actionId, status);
            res.json({
                success: true,
                data: action
            });
        } catch (error) {
            console.error('Error in updateActionStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut',
                error: error.message
            });
        }
    }

    async deleteAction(req, res) {
        try {
            const { actionId } = req.params;
            await actionService.deleteAction(actionId);
            res.json({
                success: true,
                message: 'Action supprimée avec succès'
            });
        } catch (error) {
            console.error('Error in deleteAction:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'action',
                error: error.message
            });
        }
    }
}

module.exports = new ActionController();