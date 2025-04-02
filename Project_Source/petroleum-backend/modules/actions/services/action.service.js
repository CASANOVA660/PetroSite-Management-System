const Action = require('../models/action.model');
const { createNotification } = require('../../../modules/notifications/controllers/notificationController');

class ActionService {
    async createAction(actionData) {
        const action = await new Action(actionData).save();
        return Action.findById(action._id)
            .populate('responsible', 'nom prenom');
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
                userId: action.responsible._id,
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
            const action = await Action.findById(actionId).populate('responsible', '_id');
            if (!action) {
                throw new Error('Action non trouvée');
            }

            // Create notification for action deletion
            await createNotification({
                userId: action.responsible._id,
                type: 'ACTION_DELETED',
                message: `L'action "${action.content}" a été supprimée`,
                isRead: false,
                createdAt: new Date()
            });

            // Delete the action
            await Action.findByIdAndDelete(actionId);

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ActionService(); 