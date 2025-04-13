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

    async updateAction(actionId, actionData) {
        console.log('ActionService - updateAction called with:', { actionId, actionData });

        const action = await Action.findById(actionId);

        if (!action) {
            console.error('ActionService - Action not found with ID:', actionId);
            throw new Error('Action not found');
        }

        console.log('ActionService - Found original action:', action);

        // Ensure we maintain the original source if not provided
        if (!actionData.source) {
            actionData.source = action.source;
        }

        // Ensure we keep the manager field from the original action
        if (!actionData.manager) {
            actionData.manager = action.manager;
        }

        console.log('ActionService - Updating action with data:', actionData);

        // Specifically log the responsible field to help debug notifications
        console.log('ActionService - Original responsible:', action.responsible);
        console.log('ActionService - New responsible:', actionData.responsible);

        try {
            // Update the action with new data
            const updatedAction = await Action.findByIdAndUpdate(
                actionId,
                actionData,
                { new: true, runValidators: true }
            ).populate('responsible', 'nom prenom')
                .populate('manager', 'nom prenom');

            console.log('ActionService - Updated action result:', updatedAction);

            // Update associated task
            const task = await Task.findOne({ actionId: action._id });
            if (task) {
                console.log('ActionService - Found associated task:', task);

                // Update task with the new information
                const updatedTask = await Task.findByIdAndUpdate(task._id, {
                    title: actionData.title || task.title,
                    description: actionData.content || task.description,
                    assignee: actionData.responsible || task.assignee,
                    startDate: actionData.startDate || task.startDate,
                    endDate: actionData.endDate || task.endDate,
                    status: actionData.status === 'completed' ? 'completed' : task.status
                }, { new: true });

                console.log('ActionService - Updated associated task:', updatedTask);
            }

            return updatedAction;
        } catch (error) {
            console.error('ActionService - Error updating action:', error);
            throw error;
        }
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