const actionService = require('../services/action.service');
const { validationResult } = require('express-validator');
const { createNotification } = require('../../notifications/controllers/notificationController');
const Action = require('../models/action.model');


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

            const actionData = {
                ...req.body
            };

            const action = await actionService.createAction(actionData);
            console.log('Action created:', action); // Debug log

            // Create notification for the responsible user
            const notification = await createNotification({
                type: 'ACTION_ASSIGNED',
                message: `Une nouvelle action "${action.content}" vous a été assignée`,
                userId: action.responsible._id,
                isRead: false
            });
            console.log('Notification created:', notification); // Debug log

            // Emit socket notification
            global.io.emit('notification', {
                type: 'NEW_NOTIFICATION',
                payload: {
                    type: 'ACTION_ASSIGNED',
                    message: `Une nouvelle action "${action.content}" vous a été assignée`,
                    userId: action.responsible._id
                }
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

            // Create notification with correct type
            await createNotification({
                type: 'ACTION_STATUS_CHANGED',
                message: `Le statut de l'action "${action.content}" a été changé en ${status}`,
                userId: action.responsible,
                isRead: false
            });

            // Emit socket notification
            global.io.emit('notification', {
                type: 'NEW_NOTIFICATION',
                payload: {
                    type: 'ACTION_STATUS_CHANGED',
                    message: `Le statut de l'action "${action.content}" a été changé en ${status}`,
                    userId: action.responsible
                }
            });

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
            const action = await Action.findById(actionId);
            if (!action) {
                return res.status(404).json({
                    success: false,
                    message: 'Action non trouvée'
                });
            }

            // Create notification before deleting
            await createNotification({
                type: 'ACTION_DELETED',
                message: `L'action "${action.content}" a été supprimée`,
                userId: action.responsible,
                isRead: false
            });

            // Emit socket notification
            global.io.emit('notification', {
                type: 'NEW_NOTIFICATION',
                payload: {
                    type: 'ACTION_DELETED',
                    message: `L'action "${action.content}" a été supprimée`,
                    userId: action.responsible
                }
            });

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