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

            // Return successful response immediately
            const response = {
                success: true,
                data: action
            };
            res.status(201).json(response);

            // Create tasks asynchronously after sending the response
            setTimeout(async () => {
                try {
                    // Import the task service
                    const taskService = require('../../tasks/services/task.service');
                    console.log('ActionController - Creating tasks for action:', action._id);
                    await taskService.createTasksFromProjectAction(action._id);

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
                } catch (taskError) {
                    console.error('ActionController - Error creating tasks for action:', taskError);
                }
            }, 0);

            return;
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

    async updateAction(req, res) {
        console.log('ActionController - updateAction called with body:', req.body);
        console.log('ActionController - updateAction params:', req.params);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('ActionController - Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }

        try {
            const { actionId } = req.params;
            const actionData = req.body;

            // Find the existing action first
            const existingAction = await Action.findById(actionId)
                .populate('responsible', 'nom prenom')
                .populate('manager', 'nom prenom');

            if (!existingAction) {
                console.error(`ActionController - Action with ID ${actionId} not found`);
                return res.status(404).json({
                    success: false,
                    message: 'Action not found'
                });
            }

            console.log('ActionController - Found existing action:', existingAction);

            // Check if responsible has changed
            const responsibleChanged = existingAction.responsible._id.toString() !== actionData.responsible;
            const statusChanged = existingAction.status !== actionData.status;
            const contentChanged = existingAction.content !== actionData.content;

            console.log('ActionController - Field changes detected:', {
                responsibleChanged,
                statusChanged,
                contentChanged
            });

            // Update action
            console.log(`ActionController - Calling actionService.updateAction for ID ${actionId} with data:`, actionData);
            const action = await actionService.updateAction(actionId, actionData);
            console.log('ActionController - Action updated successfully:', action);

            // Always get the updated action with populated fields for notifications
            const updatedAction = await Action.findById(actionId)
                .populate('responsible', 'nom prenom')
                .populate('manager', 'nom prenom');

            console.log('ActionController - Populated updated action for notifications:', updatedAction);

            if (responsibleChanged) {
                // Notification is always sent to the new responsible
                try {
                    await createNotification({
                        type: 'ACTION_ASSIGNED',
                        message: `L'action "${updatedAction.title}" vous a été assignée`,
                        userId: updatedAction.responsible._id,
                        isRead: false
                    });
                    console.log('ActionController - Responsible notification sent to:', updatedAction.responsible._id);

                    // Send a real-time notification via socket if available
                    if (global.io && updatedAction.responsible) {
                        global.io.to(String(updatedAction.responsible._id)).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'ACTION_ASSIGNED',
                                message: `L'action "${updatedAction.title}" vous a été assignée`,
                                userId: updatedAction.responsible._id
                            }
                        });
                        console.log('ActionController - Socket notification sent to responsible');
                    }
                } catch (notifError) {
                    console.error('Error sending notification to responsible:', notifError);
                }
            }

            if (statusChanged) {
                try {
                    await createNotification({
                        type: 'ACTION_STATUS_CHANGED',
                        message: `Le statut de l'action "${updatedAction.title}" a été mis à jour: ${updatedAction.status}`,
                        userId: updatedAction.responsible._id,
                        isRead: false
                    });
                    console.log('ActionController - Status change notification sent to:', updatedAction.responsible._id);

                    // Send a real-time notification via socket if available
                    if (global.io && updatedAction.responsible) {
                        global.io.to(String(updatedAction.responsible._id)).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'ACTION_STATUS_CHANGED',
                                message: `Le statut de l'action "${updatedAction.title}" a été mis à jour: ${updatedAction.status}`,
                                userId: updatedAction.responsible._id
                            }
                        });
                        console.log('ActionController - Socket notification sent for status change');
                    }
                } catch (notifError) {
                    console.error('Error sending status change notification:', notifError);
                }
            }

            if (contentChanged) {
                try {
                    await createNotification({
                        type: 'ACTION_CONTENT_CHANGED',
                        message: `Le contenu de l'action "${updatedAction.title}" a été modifié`,
                        userId: updatedAction.responsible._id,
                        isRead: false
                    });
                    console.log('ActionController - Content change notification sent to:', updatedAction.responsible._id);

                    // Send a real-time notification via socket if available
                    if (global.io && updatedAction.responsible) {
                        global.io.to(String(updatedAction.responsible._id)).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'ACTION_CONTENT_CHANGED',
                                message: `Le contenu de l'action "${updatedAction.title}" a été modifié`,
                                userId: updatedAction.responsible._id
                            }
                        });
                        console.log('ActionController - Socket notification sent for content change');
                    }
                } catch (notifError) {
                    console.error('Error sending content change notification:', notifError);
                }
            }

            res.json({
                success: true,
                data: action
            });
        } catch (error) {
            console.error('Error updating action:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Erreur lors de la mise à jour de l\'action'
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