const GlobalAction = require('../models/globalAction.model');
const { createNotification } = require('../../notifications/controllers/notificationController');
const taskService = require('../../tasks/services/task.service');
const Project = require('../../projects/models/Project');
const redis = require('../../../config/redis');

class GlobalActionService {
    // Cache TTL in seconds
    static CACHE_TTL = 1800; // 30 minutes

    // Generate cache key
    static generateCacheKey(type, params = '') {
        return `global_actions:${type}:${params}`;
    }

    // Clear cache for a specific type
    static async clearCache(type) {
        const pattern = `global_actions:${type}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
        }
    }

    async getAllGlobalActions(filters = {}) {
        const cacheKey = this.constructor.generateCacheKey('all', JSON.stringify(filters));

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // If not in cache, get from database
        const actions = await GlobalAction.find(filters)
            .populate('responsibleForRealization', 'nom prenom')
            .populate('responsibleForFollowUp', 'nom prenom')
            .populate('manager', 'nom prenom')
            .populate('projectId', 'name')
            .sort({ createdAt: -1 });

        // Cache the results
        await redis.setex(cacheKey, this.constructor.CACHE_TTL, JSON.stringify(actions));

        return actions;
    }

    async searchGlobalActions(searchParams) {
        const {
            title,
            responsible,
            category,
            projectId,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = searchParams;

        const cacheKey = this.constructor.generateCacheKey('search', JSON.stringify(searchParams));

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // Build search query
        const query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (responsible) {
            // Search for responsible in both fields
            // Use $or to find in either responsibleForRealization or responsibleForFollowUp
            // Need to search by name within the populated fields
            const responsibleRegex = new RegExp(responsible, 'i');

            query.$or = [
                { 'responsibleForRealization.nom': responsibleRegex },
                { 'responsibleForRealization.prenom': responsibleRegex },
                { 'responsibleForFollowUp.nom': responsibleRegex },
                { 'responsibleForFollowUp.prenom': responsibleRegex }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (projectId) {
            query.projectId = projectId;
        }

        // Date range filtering
        if (startDate || endDate) {
            query.startDate = {};
            query.endDate = {};

            if (startDate) {
                query.startDate.$gte = new Date(startDate);
            }

            if (endDate) {
                query.endDate.$lte = new Date(endDate);
            }
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Execute search with pagination
        const [actions, total] = await Promise.all([
            GlobalAction.find(query)
                .populate('responsibleForRealization', 'nom prenom')
                .populate('responsibleForFollowUp', 'nom prenom')
                .populate('manager', 'nom prenom')
                .populate('projectId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            GlobalAction.countDocuments(query)
        ]);

        const result = {
            actions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };

        // Cache the results
        await redis.setex(cacheKey, this.constructor.CACHE_TTL, JSON.stringify(result));

        return result;
    }

    async createGlobalAction(actionData) {
        // If projectId is provided, verify project exists and get its details
        let projectDetails = null;
        if (actionData.projectId) {
            projectDetails = await Project.findById(actionData.projectId);
            if (!projectDetails) {
                throw new Error('Project not found');
            }

            // Validate project category if provided - ensuring categories exist
            if (actionData.projectCategory &&
                projectDetails.categories &&
                Array.isArray(projectDetails.categories) &&
                !projectDetails.categories.includes(actionData.projectCategory)) {
                throw new Error('Invalid project category');
            }
        }

        const globalAction = new GlobalAction({
            ...actionData,
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
        try {
            // Create realization task
            const realizationTask = await taskService.createTask({
                title: `Réalisation: ${savedAction.title}`,
                description: savedAction.content,
                assignee: savedAction.responsibleForRealization,
                creator: savedAction.manager,
                startDate: savedAction.startDate,
                endDate: savedAction.endDate,
                status: 'todo',
                globalActionId: savedAction._id,
                type: 'realization',
                projectId: actionData.projectId || null,
                category: actionData.category || null,
                projectCategory: actionData.projectCategory || null,
                needsValidation: false,
                tags: ['Global Action', 'Realization']
            });

            // Create follow-up task with link to realization task
            const followUpTask = await taskService.createTask({
                title: `Suivi: ${savedAction.title}`,
                description: savedAction.content,
                assignee: savedAction.responsibleForFollowUp,
                creator: savedAction.manager,
                startDate: savedAction.startDate,
                endDate: savedAction.endDate,
                status: 'todo',
                globalActionId: savedAction._id,
                type: 'followup',
                projectId: actionData.projectId || null,
                category: actionData.category || null,
                projectCategory: actionData.projectCategory || null,
                needsValidation: savedAction.needsValidation,
                tags: ['Global Action', 'Follow-up'],
                linkedTaskId: realizationTask._id
            });

            // Update realization task with link to follow-up task
            await taskService.updateTaskData(realizationTask._id, {
                linkedTaskId: followUpTask._id
            });
        } catch (error) {
            console.error('Error creating tasks for global action:', error);
            // Continue anyway to return the action
        }

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

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
                message: `l'action "${action.title}" a été mis à jour`,
                userId: action.responsibleForRealization._id,
                isRead: false
            }),
            createNotification({
                type: 'ACTION_STATUS_CHANGED',
                message: `l'action "${action.title}" a été mis à jour`,
                userId: action.responsibleForFollowUp._id,
                isRead: false
            })
        ]);

        // Update associated tasks if action is completed
        if (status === 'completed') {
            // Find associated tasks
            const tasks = await taskService.getTasksByGlobalActionId(actionId);

            // Update tasks status
            if (tasks && tasks.length > 0) {
                for (const task of tasks) {
                    await taskService.updateTaskStatus(task._id, 'done', action.manager);
                }
            }
        }

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

        return action;
    }

    async updateGlobalAction(actionId, actionData) {
        // Find the existing action first
        const existingAction = await GlobalAction.findById(actionId)
            .populate(['responsibleForRealization', 'responsibleForFollowUp', 'manager']);

        if (!existingAction) {
            throw new Error('Action not found');
        }

        // If projectId is provided, verify project exists and get its details
        let projectDetails = null;
        if (actionData.projectId) {
            projectDetails = await Project.findById(actionData.projectId);
            if (!projectDetails) {
                throw new Error('Project not found');
            }

            // Validate project category if provided - ensuring categories exist
            if (actionData.projectCategory &&
                projectDetails.categories &&
                Array.isArray(projectDetails.categories) &&
                !projectDetails.categories.includes(actionData.projectCategory)) {
                throw new Error('Invalid project category');
            }
        }

        // Check if responsible users have changed
        const realPersonChanged = existingAction.responsibleForRealization._id.toString() !== actionData.responsibleForRealization;
        const followUpPersonChanged = existingAction.responsibleForFollowUp._id.toString() !== actionData.responsibleForFollowUp;
        const statusChanged = existingAction.status !== actionData.status;
        const contentChanged = existingAction.content !== actionData.content;

        // Update the action
        const updatedAction = await GlobalAction.findByIdAndUpdate(
            actionId,
            { ...actionData, source: projectDetails ? projectDetails.name : 'Global' },
            { new: true }
        ).populate(['responsibleForRealization', 'responsibleForFollowUp', 'manager', 'projectId']);

        // Update associated tasks
        const tasks = await taskService.getTasksByGlobalActionId(actionId);

        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                // Determine which responsible person this task belongs to
                const isRealizationTask = task.tags.includes('Realization');
                const isFollowUpTask = task.tags.includes('Follow-up');

                // Update task data based on its type
                const taskUpdateData = {
                    title: isRealizationTask ? `Réalisation: ${actionData.title}` :
                        isFollowUpTask ? `Suivi: ${actionData.title}` : task.title,
                    description: actionData.content || task.description,
                    assignee: isRealizationTask ? actionData.responsibleForRealization || task.assignee :
                        isFollowUpTask ? actionData.responsibleForFollowUp || task.assignee : task.assignee,
                    startDate: actionData.startDate || task.startDate,
                    endDate: actionData.endDate || task.endDate,
                    projectId: actionData.projectId || task.projectId,
                    category: actionData.projectCategory || actionData.category || task.category
                };

                // Handle needsValidation based on task type
                if (isRealizationTask) {
                    taskUpdateData.needsValidation = false;
                } else if (isFollowUpTask && actionData.needsValidation !== undefined) {
                    taskUpdateData.needsValidation = actionData.needsValidation;
                }

                // If action status changed to completed, update task status too
                if (actionData.status === 'completed' && task.status !== 'done') {
                    await taskService.updateTaskStatus(task._id, 'done', existingAction.manager);
                }

                // Update task data
                await taskService.updateTaskData(task._id, taskUpdateData);
            }
        }

        // Send notifications based on what changed
        const notifications = [];

        // Notify about responsible person changes
        if (realPersonChanged) {
            notifications.push(
                createNotification({
                    type: 'ACTION_ASSIGNED',
                    message: `L'action "${updatedAction.title}" vous a été assignée pour réalisation`,
                    userId: updatedAction.responsibleForRealization._id,
                    isRead: false
                })
            );
        }

        if (followUpPersonChanged) {
            notifications.push(
                createNotification({
                    type: 'ACTION_ASSIGNED_FOLLOWUP',
                    message: `L'action "${updatedAction.title}" vous a été assignée pour suivi`,
                    userId: updatedAction.responsibleForFollowUp._id,
                    isRead: false
                })
            );
        }

        // Notify about content change
        if (contentChanged) {
            notifications.push(
                createNotification({
                    type: 'ACTION_CONTENT_CHANGED',
                    message: `Le contenu de l'action "${updatedAction.title}" a été modifié`,
                    userId: updatedAction.responsibleForRealization._id,
                    isRead: false
                }),
                createNotification({
                    type: 'ACTION_CONTENT_CHANGED',
                    message: `Le contenu de l'action "${updatedAction.title}" a été modifié`,
                    userId: updatedAction.responsibleForFollowUp._id,
                    isRead: false
                })
            );
        }

        // Notify about status change
        if (statusChanged) {
            notifications.push(
                createNotification({
                    type: 'ACTION_STATUS_CHANGED',
                    message: `Le statut de l'action "${updatedAction.title}" a été mis à jour: ${updatedAction.status}`,
                    userId: updatedAction.responsibleForRealization._id,
                    isRead: false
                }),
                createNotification({
                    type: 'ACTION_STATUS_CHANGED',
                    message: `Le statut de l'action "${updatedAction.title}" a été mis à jour: ${updatedAction.status}`,
                    userId: updatedAction.responsibleForFollowUp._id,
                    isRead: false
                })
            );
        }

        // Process all notifications
        if (notifications.length > 0) {
            await Promise.all(notifications);
        }

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

        return updatedAction;
    }

    async deleteGlobalAction(actionId) {
        const action = await GlobalAction.findById(actionId)
            .populate(['responsibleForRealization', 'responsibleForFollowUp']);

        if (!action) {
            throw new Error('Action not found');
        }

        // Delete associated tasks
        const tasks = await taskService.getTasksByGlobalActionId(actionId);
        if (tasks && tasks.length > 0) {
            for (const task of tasks) {
                await taskService.deleteTask(task._id);
            }
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

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

        return action;
    }
}

module.exports = new GlobalActionService();