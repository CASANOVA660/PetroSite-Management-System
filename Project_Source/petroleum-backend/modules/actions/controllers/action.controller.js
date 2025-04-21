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
                !actionData.responsibleFollowup || !actionData.startDate || !actionData.endDate ||
                !actionData.category || !actionData.source) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs requis doivent être remplis'
                });
            }

            const action = await actionService.createAction(actionData);
            console.log('Action created:', action); // Debug log

            // Import the task service
            const taskService = require('../../tasks/services/task.service');

            // Create tasks for the action
            console.log('ActionController - Creating tasks for action:', action._id);
            await taskService.createTasksFromProjectAction(action._id);

            // Return response including action data
            const response = {
                success: true,
                data: action
            };
            res.status(201).json(response);

            // Send notifications asynchronously after sending the response
            setTimeout(async () => {
                try {
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

                    // Emit socket notification to responsibleFollowup user if different from manager and responsible
                    if (action.responsibleFollowup && action.responsibleFollowup._id &&
                        action.responsibleFollowup._id.toString() !== action.manager.toString() &&
                        action.responsibleFollowup._id.toString() !== action.responsible._id.toString()) {

                        // Emit socket notification
                        global.io.to(String(action.responsibleFollowup._id)).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'ACTION_ASSIGNED_FOLLOWUP',
                                message: `Une nouvelle action "${action.title}" vous a été assignée pour suivi`,
                                userId: action.responsibleFollowup._id
                            }
                        });
                    }
                } catch (error) {
                    console.error('ActionController - Error sending notifications for action:', error);
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

            // Send notification to the responsible user
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

            // Send notification to the responsibleFollowup user if different from manager and responsible
            if (action.responsibleFollowup?._id &&
                action.responsibleFollowup._id.toString() !== action.manager._id.toString() &&
                action.responsibleFollowup._id.toString() !== action.responsible._id.toString()) {
                const socketId = global.userSockets.get(action.responsibleFollowup._id);
                if (socketId) {
                    global.io.to(socketId).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'action_status_changed',
                            message: `Le statut de l'action "${action.title}" a été mis à jour: ${status}`,
                            userId: action.responsibleFollowup._id
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
                .populate('responsibleFollowup', 'nom prenom')
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
            const responsibleFollowupChanged = existingAction.responsibleFollowup &&
                existingAction.responsibleFollowup._id.toString() !== actionData.responsibleFollowup;
            const statusChanged = existingAction.status !== actionData.status;
            const contentChanged = existingAction.content !== actionData.content;

            console.log('ActionController - Field changes detected:', {
                responsibleChanged,
                responsibleFollowupChanged,
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
                .populate('responsibleFollowup', 'nom prenom')
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

            if (responsibleFollowupChanged) {
                // Notification is always sent to the new responsible followup
                try {
                    await createNotification({
                        type: 'ACTION_ASSIGNED_FOLLOWUP',
                        message: `L'action "${updatedAction.title}" vous a été assignée pour suivi`,
                        userId: updatedAction.responsibleFollowup._id,
                        isRead: false
                    });
                    console.log('ActionController - Followup notification sent to:', updatedAction.responsibleFollowup._id);

                    // Send a real-time notification via socket if available
                    if (global.io && updatedAction.responsibleFollowup) {
                        global.io.to(String(updatedAction.responsibleFollowup._id)).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'ACTION_ASSIGNED_FOLLOWUP',
                                message: `L'action "${updatedAction.title}" vous a été assignée pour suivi`,
                                userId: updatedAction.responsibleFollowup._id
                            }
                        });
                        console.log('ActionController - Socket notification sent to followup responsible');
                    }
                } catch (notifError) {
                    console.error('Error sending notification to followup responsible:', notifError);
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

            // Send notification to the responsible user if different from manager
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

            // Send notification to the responsibleFollowup user if different from manager and responsible
            if (action.responsibleFollowup?._id &&
                action.responsibleFollowup._id.toString() !== action.manager._id.toString() &&
                action.responsibleFollowup._id.toString() !== action.responsible._id.toString()) {
                const socketId = global.userSockets.get(action.responsibleFollowup._id);
                if (socketId) {
                    global.io.to(socketId).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'ACTION_DELETED',
                            message: `L'action "${action.title}" a été supprimée`,
                            userId: action.responsibleFollowup._id
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