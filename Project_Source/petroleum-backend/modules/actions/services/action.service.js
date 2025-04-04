const Action = require('../models/action.model');
const Task = require('../../tasks/models/task.model');
const { createNotification } = require('../../../modules/notifications/controllers/notificationController');
const taskService = require('../../tasks/services/task.service');

class ActionService {
    async getAllActions() {
        return await Action.find()
            .populate('responsible', 'nom prenom')
            .populate('manager', 'nom prenom')
            .sort({ createdAt: -1 });
    }

    async getProjectActions(projectId) {
        return await Action.find({ projectId })
            .populate('responsible', 'nom prenom')
            .populate('manager', 'nom prenom')
            .sort({ createdAt: -1 });
    }

    async getCategoryActions(projectId, category) {
        return await Action.find({ projectId, category })
            .populate('responsible', 'nom prenom')
            .populate('manager', 'nom prenom')
            .sort({ createdAt: -1 });
    }

    async createAction(actionData) {
        try {
            const action = await new Action(actionData).save();
            const populatedAction = await action.populate(['responsible', 'manager']);

            // Create corresponding task
            const task = await taskService.createTask({
                title: action.title,
                description: action.content,
                assignee: action.responsible,
                creator: action.manager,
                startDate: action.startDate,
                endDate: action.endDate,
                status: 'todo',
                actionId: action._id,
                tags: ['Action']
            });

            // Create notification for the responsible user if they are different from the manager
            if (action.responsible && action.responsible._id &&
                action.responsible._id.toString() !== action.manager.toString()) {

                // Create notification in database
                await createNotification({
                    type: 'ACTION_ASSIGNED',
                    message: `Une nouvelle action "${action.title}" vous a été assignée`,
                    userId: action.responsible._id,
                    isRead: false
                });

                // Emit socket event for new task
                global.io.to(String(action.responsible._id)).emit('newTask', task);
            }

            return populatedAction;
        } catch (error) {
            throw error;
        }
    }

    async updateActionStatus(actionId, status) {
        const action = await Action.findByIdAndUpdate(
            actionId,
            { status },
            { new: true }
        ).populate('responsible', 'nom prenom')
            .populate('manager', 'nom prenom');

        if (!action) {
            throw new Error('Action not found');
        }

        // Update associated task if action is completed
        if (status === 'completed') {
            await Task.findOneAndUpdate(
                { actionId: action._id },
                { status: 'completed' }
            );
        }

        return action;
    }

    async deleteAction(actionId) {
        const action = await Action.findById(actionId)
            .populate('responsible', 'nom prenom')
            .populate('manager', 'nom prenom');

        if (!action) {
            throw new Error('Action not found');
        }

        // Delete associated task
        await Task.deleteOne({ actionId: action._id });

        // Delete the action
        await Action.deleteOne({ _id: actionId });

        return action;
    }
}

module.exports = new ActionService(); 