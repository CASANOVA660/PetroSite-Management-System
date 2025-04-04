const actionService = require('../services/action.service');
const { validationResult } = require('express-validator');
const { createNotification } = require('../../notifications/controllers/notificationController');
const Action = require('../models/action.model');

class ActionController {
    async getAllActions(req, res) {
        try {
            const actions = await actionService.getAllActions();
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

    async getProjectActions(req, res) {
        try {
            const { projectId } = req.params;
            const actions = await actionService.getProjectActions(projectId);
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

    async createAction(req, res) {
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

        try {
            const actionData = {
                ...req.body,
                manager: req.user.id // Auto-set the manager to the current user
            };

            // Validate required fields
            if (!actionData.title || !actionData.content || !actionData.responsible ||
                !actionData.startDate || !actionData.endDate || !actionData.category ||
                !actionData.source) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs requis doivent être remplis'
                });
            }

            const action = await actionService.createAction(actionData);
            console.log('Action created:', action); // Debug log

            // Emit socket notification ONLY to responsible user if they are different from the manager
            if (action.responsible && action.responsible._id &&
                action.responsible._id.toString() !== action.manager.toString()) {

                // Emit socket notification
                global.io.to(String(action.responsible._id)).emit('notification', {
                    type: 'NEW_NOTIFICATION',
                    payload: {
                        type: 'ACTION_ASSIGNED',
                        message: `Une nouvelle action "${action.title}" vous a été assignée`,
                        userId: action.responsible._id
                    }
                });
            }

            return res.status(201).json({
                success: true,
                data: action
            });
        } catch (error) {
            console.error('Error in createAction:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la création de l\'action'
            });
        }
    }

    async updateActionStatus(req, res) {
        try {
            const { actionId } = req.params;
            const { status } = req.body;
            const action = await actionService.updateActionStatus(actionId, status);

            // Send notification only to the responsible user
            if (action.responsible?._id && action.responsible._id !== action.manager._id) {
                const socketId = global.userSockets.get(action.responsible._id);
                if (socketId) {
                    global.io.to(socketId).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'action_status_changed',
                            message: `Le statut de l'action "${action.title}" a été mis à jour: ${status}`,
                            userId: action.responsible._id
                        }
                    });
                }
            }

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

    async deleteAction(req, res) {
        try {
            const { actionId } = req.params;
            const action = await actionService.deleteAction(actionId);

            // Send notification only to the responsible user
            if (action.responsible?._id && action.responsible._id !== action.manager._id) {
                const socketId = global.userSockets.get(action.responsible._id);
                if (socketId) {
                    global.io.to(socketId).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'ACTION_DELETED',
                            message: `L'action "${action.title}" a été supprimée`,
                            userId: action.responsible._id
                        }
                    });
                }
            }

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

module.exports = new ActionController();