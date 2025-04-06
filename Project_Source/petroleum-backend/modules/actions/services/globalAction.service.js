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
        const { searchTerm, responsible, category, projectId, page = 1, limit = 10 } = searchParams;
        const cacheKey = this.constructor.generateCacheKey('search', JSON.stringify(searchParams));

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // Build search query
        const query = {};

        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (responsible) {
            query.$or = [
                { responsibleForRealization: responsible },
                { responsibleForFollowUp: responsible }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (projectId) {
            query.projectId = projectId;
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

            // Validate project category if provided
            if (actionData.projectCategory &&
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

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

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

        // Clear relevant caches
        await this.constructor.clearCache('all');
        await this.constructor.clearCache('search');

        return action;
    }
}

module.exports = new GlobalActionService();