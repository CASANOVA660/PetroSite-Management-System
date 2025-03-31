const Action = require('../models/action.model');
const { createNotification } = require('../../../modules/notifications/controllers/notificationController');

class ActionService {
    async createAction(actionData) {
        try {

            const action = new Action(actionData);
            await action.save();

            // Create notification for the responsible user
            await createNotification({
                recipient: actionData.responsible,
                type: 'action_assigned',
                content: `Une nouvelle action vous a été assignée: ${actionData.content}`,
                relatedId: action._id
            });

            return action;
        } catch (error) {
            console.error('Error in createAction service:', error);
            throw error;
        }
    }

    async getProjectActions(projectId) {
        try {
            return await Action.find({ projectId })
                .populate('responsible', 'nom prenom')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw error;
        }
    }

    async getCategoryActions(projectId, category) {
        try {
            return await Action.find({ projectId, category })
                .populate('responsible', 'nom prenom')

                .sort({ createdAt: -1 });
        } catch (error) {
            throw error;
        }
    }

    async updateActionStatus(actionId, status) {
        try {
            const action = await Action.findById(actionId);
            if (!action) {
                throw new Error('Action non trouvée');
            }

            action.status = status;
            await action.save();

            // Create notification for status change
            await createNotification({
                userId: action.responsible,
                type: 'action_status_changed',
                title: 'Statut de l\'action mis à jour',
                message: `Le statut de l'action "${action.content}" a été mis à jour: ${status}`,
                data: {
                    actionId: action._id,
                    projectId: action.projectId
                }
            });

            return action;
        } catch (error) {
            throw error;
        }
    }

    async deleteAction(actionId) {
        try {
            const action = await Action.findById(actionId);
            if (!action) {
                throw new Error('Action non trouvée');
            }

            await action.remove();

            // Create notification for action deletion
            await createNotification({
                userId: action.responsible,
                type: 'action_deleted',
                title: 'Action supprimée',
                message: `L'action "${action.content}" a été supprimée`,
                data: {
                    projectId: action.projectId
                }
            });

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ActionService(); 