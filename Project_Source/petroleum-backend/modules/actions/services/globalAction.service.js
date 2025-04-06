const GlobalAction = require('../models/globalAction.model');
const { createNotification } = require('../../notifications/controllers/notificationController');
const taskService = require('../../tasks/services/task.service');
const Project = require('../../projects/models/Project');

class GlobalActionService {
    async getAllGlobalActions(filters = {}) {
        return GlobalAction.find(filters)
            .populate('responsibleForRealization', 'nom prenom')
            .populate('responsibleForFollowUp', 'nom prenom')
            .populate('manager', 'nom prenom')
            .populate('projectId', 'name')
            .sort({ createdAt: -1 });
    }

    async createGlobalAction(actionData) {
        // If projectId is provided, verify project exists and get its details
        let projectDetails = null;
        if (actionData.projectId) {
            projectDetails = await Project.findById(actionData.projectId);
            if (!projectDetails) {
                throw new Error('Project not found');
            }

            // Validate project category if provided
            if (actionData.projectCategory &&
                !projectDetails.categories.includes(actionData.projectCategory)) {
                throw new Error('Invalid project category');
            }
        }

        const globalAction = new GlobalAction({
            ...actionData,
            // If project is selected, add project-specific details
            source: projectDetails ? projectDetails.name : 'Global'
        });

        const savedAction = await globalAction.save();

        // Create notifications for both responsible users
        const notificationMessages = [
            {
                type: 'ACTION_ASSIGNED',
                message: `Une nouvelle action "${savedAction.title}" vous a été assignée pour réalisation${projectDetails ? ` dans le projet ${projectDetails.name}` : ''
                    }`,
                userId: savedAction.responsibleForRealization
            },
            {
                type: 'ACTION_ASSIGNED_FOLLOWUP',
                message: `Une nouvelle action "${savedAction.title}" vous a été assignée pour suivi${projectDetails ? ` dans le projet ${projectDetails.name}` : ''
                    }`,
                userId: savedAction.responsibleForFollowUp
            }
        ];

        await Promise.all(
            notificationMessages.map(msg =>
                createNotification({
                    type: msg.type,
                    message: msg.message,
                    userId: msg.userId,
                    isRead: false
                })
            )
        );

        // Create tasks for both users
        const taskData = [
            {
                title: `Réalisation: ${savedAction.title}`,
                description: savedAction.content,
                assignee: savedAction.responsibleForRealization,
                creator: savedAction.manager,
                startDate: savedAction.startDate,
                endDate: savedAction.endDate,
                status: 'todo',
                actionId: savedAction._id,
                type: 'realization',
                projectId: actionData.projectId || null
            },
            {
                title: `Suivi: ${savedAction.title}`,
                description: savedAction.content,
                assignee: savedAction.responsibleForFollowUp,
                creator: savedAction.manager,
                startDate: savedAction.startDate,
                endDate: savedAction.endDate,
                status: 'todo',
                actionId: savedAction._id,
                type: 'followup',
                projectId: actionData.projectId || null
            }
        ];

        await Promise.all(taskData.map(task => taskService.createTask(task)));

        // Return populated action
        return GlobalAction.findById(savedAction._id)
            .populate('responsibleForRealization', 'nom prenom')
            .populate('responsibleForFollowUp', 'nom prenom')
            .populate('manager', 'nom prenom')
            .populate('projectId', 'name');
    }

    async updateGlobalActionStatus(actionId, status) {
        const action = await GlobalAction.findByIdAndUpdate(
            actionId,
            { status },
            { new: true }
        ).populate(['responsibleForRealization', 'responsibleForFollowUp', 'manager']);

        if (!action) {
            throw new Error('Action not found');
        }

        // Notify both responsible users about status change
        await Promise.all([
            createNotification({
                type: 'ACTION_STATUS_CHANGED',
                message: `Le statut de l'action "${action.title}" a été mis à jour: ${status}`,
                userId: action.responsibleForRealization._id,
                isRead: false
            }),
            createNotification({
                type: 'ACTION_STATUS_CHANGED',
                message: `Le statut de l'action "${action.title}" a été mis à jour: ${status}`,
                userId: action.responsibleForFollowUp._id,
                isRead: false
            })
        ]);

        return action;
    }

    async deleteGlobalAction(actionId) {
        const action = await GlobalAction.findById(actionId)
            .populate(['responsibleForRealization', 'responsibleForFollowUp']);

        if (!action) {
            throw new Error('Action not found');
        }

        // Notify both users about deletion
        await Promise.all([
            createNotification({
                type: 'ACTION_DELETED',
                message: `L'action "${action.title}" a été supprimée`,
                userId: action.responsibleForRealization._id,
                isRead: false
            }),
            createNotification({
                type: 'ACTION_DELETED',
                message: `L'action "${action.title}" a été supprimée`,
                userId: action.responsibleForFollowUp._id,
                isRead: false
            })
        ]);

        await GlobalAction.deleteOne({ _id: actionId });
        return action;
    }
}

module.exports = new GlobalActionService();