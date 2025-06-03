const mongoose = require('mongoose');
const Task = require('../../tasks/models/task.model');
const User = require('../../users/models/User');
const Project = require('../../projects/models/Project');
const Action = require('../../actions/models/action.model');
const GlobalAction = require('../../actions/models/globalAction.model');
const logger = require('../../../utils/logger');

/**
 * Service to handle database queries for the RAG system
 * This allows the chatbot to access project information directly
 */

/**
 * Get tasks for a user by their ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of tasks
 */
async function getUserTasks(userId) {
    try {
        const tasks = await Task.find({
            assignee: userId,
            isArchived: { $ne: true }
        })
            .populate('assignee', 'nom prenom email role')
            .populate('creator', 'nom prenom email role')
            .populate('projectId', 'projectName projectNumber status')
            .sort({ createdAt: -1 });

        return tasks;
    } catch (error) {
        logger.error(`Error getting tasks for user ${userId}: ${error.message}`);
        throw new Error(`Failed to get user tasks: ${error.message}`);
    }
}

/**
 * Get tasks for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of tasks
 */
async function getProjectTasks(projectId) {
    try {
        const tasks = await Task.find({
            projectId,
            isArchived: { $ne: true }
        })
            .populate('assignee', 'nom prenom email role')
            .populate('creator', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return tasks;
    } catch (error) {
        logger.error(`Error getting tasks for project ${projectId}: ${error.message}`);
        throw new Error(`Failed to get project tasks: ${error.message}`);
    }
}

/**
 * Get project details by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Project details
 */
async function getProjectDetails(projectId) {
    try {
        const project = await Project.findById(projectId)
            .populate({
                path: 'employees.employeeId',
                select: 'nom prenom email role'
            })
            .populate('createdBy', 'nom prenom email role');

        if (!project) {
            throw new Error('Project not found');
        }

        return project;
    } catch (error) {
        logger.error(`Error getting project details for ${projectId}: ${error.message}`);
        throw new Error(`Failed to get project details: ${error.message}`);
    }
}

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
async function getUserProfile(userId) {
    try {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        logger.error(`Error getting user profile for ${userId}: ${error.message}`);
        throw new Error(`Failed to get user profile: ${error.message}`);
    }
}

/**
 * Get all users with specific role
 * @param {string} role - Role to filter by
 * @returns {Promise<Array>} - Array of users
 */
async function getUsersByRole(role) {
    try {
        const users = await User.find({ role }).select('-password');
        return users;
    } catch (error) {
        logger.error(`Error getting users with role ${role}: ${error.message}`);
        throw new Error(`Failed to get users by role: ${error.message}`);
    }
}

/**
 * Get actions for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of actions
 */
async function getProjectActions(projectId) {
    try {
        const actions = await Action.find({ projectId })
            .populate('responsible', 'nom prenom email role')
            .populate('responsibleFollowup', 'nom prenom email role')
            .populate('manager', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return actions;
    } catch (error) {
        logger.error(`Error getting actions for project ${projectId}: ${error.message}`);
        throw new Error(`Failed to get project actions: ${error.message}`);
    }
}

/**
 * Search for projects by name or number
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching projects
 */
async function searchProjects(query) {
    try {
        const projects = await Project.find({
            $or: [
                { projectName: { $regex: query, $options: 'i' } },
                { projectNumber: { $regex: query, $options: 'i' } }
            ],
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return projects;
    } catch (error) {
        logger.error(`Error searching projects with query ${query}: ${error.message}`);
        throw new Error(`Failed to search projects: ${error.message}`);
    }
}

/**
 * Get task statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Task statistics
 */
async function getUserTaskStats(userId) {
    try {
        const stats = {
            total: 0,
            todo: 0,
            inProgress: 0,
            inReview: 0,
            done: 0
        };

        const tasks = await Task.find({
            assignee: userId,
            isArchived: { $ne: true }
        });

        stats.total = tasks.length;
        stats.todo = tasks.filter(task => task.status === 'todo').length;
        stats.inProgress = tasks.filter(task => task.status === 'inProgress').length;
        stats.inReview = tasks.filter(task => task.status === 'inReview').length;
        stats.done = tasks.filter(task => task.status === 'done').length;

        return stats;
    } catch (error) {
        logger.error(`Error getting task stats for user ${userId}: ${error.message}`);
        throw new Error(`Failed to get user task statistics: ${error.message}`);
    }
}

/**
 * Get projects by status
 * @param {string} status - Project status to filter by
 * @returns {Promise<Array>} - Array of projects
 */
async function getProjectsByStatus(status) {
    try {
        const projects = await Project.find({
            status: status,
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return projects;
    } catch (error) {
        logger.error(`Error getting projects with status ${status}: ${error.message}`);
        throw new Error(`Failed to get projects by status: ${error.message}`);
    }
}

/**
 * Get active users (users who have logged in recently)
 * @param {number} days - Number of days to consider for activity (default: 30)
 * @returns {Promise<Array>} - Array of active users
 */
async function getActiveUsers(days = 30) {
    try {
        const date = new Date();
        date.setDate(date.getDate() - days);

        logger.info(`Finding users active since ${date.toISOString()}`);

        // Get all users
        const users = await User.find()
            .select('-password')
            .sort({ updatedAt: -1 });

        logger.info(`Found ${users.length} total users in the database`);

        // Enhance user data with real login information
        const enhancedUsers = users.map(user => {
            // Convert Mongoose document to plain object
            const userObj = user.toObject();

            // Check lastLogin field and other activity indicators
            const hasLoggedIn = user.lastLogin && new Date(user.lastLogin) > new Date(0);
            const isActive = user.estActif === true || hasLoggedIn;

            // For debugging
            logger.info(`User ${user.prenom} ${user.nom}: estActif=${user.estActif}, lastLogin=${user.lastLogin ? new Date(user.lastLogin).toISOString() : 'none'}, hasLoggedIn=${hasLoggedIn}, isActive=${isActive}`);

            // If lastLogin is set but not accurate, check other activity indicators
            if (!userObj.lastLogin || new Date(userObj.lastLogin) <= new Date(0)) {
                // Check if there's login history in another field
                if (user.dernierConnexion) {
                    userObj.lastLogin = user.dernierConnexion;
                } else if (user.updatedAt && user.updatedAt !== user.createdAt) {
                    // Use updatedAt as a proxy for activity if it's different from createdAt
                    userObj.lastLogin = user.updatedAt;
                } else {
                    userObj.lastLogin = null;
                }
            }

            // Override estActif based on actual login activity
            userObj.estActif = isActive;

            return userObj;
        });

        // Log user estActif status to help with debugging
        const activeCount = enhancedUsers.filter(user => user.estActif === true).length;
        const inactiveCount = enhancedUsers.filter(user => user.estActif !== true).length;

        logger.info(`User status breakdown: Active: ${activeCount}, Inactive: ${inactiveCount}`);

        return enhancedUsers;
    } catch (error) {
        logger.error(`Error getting active users: ${error.message}`);
        throw new Error(`Failed to get active users: ${error.message}`);
    }
}

/**
 * Get count of projects by status
 * @returns {Promise<Object>} - Object with counts by status
 */
async function getProjectCountsByStatus() {
    try {
        const statusCounts = {};

        // Get all statuses defined in the Project model
        const statuses = ['En cours', 'Clôturé', 'Annulé'];

        // Count projects for each status
        for (const status of statuses) {
            const count = await Project.countDocuments({
                status,
                isDeleted: { $ne: true }
            });
            statusCounts[status] = count;
        }

        // Add total count
        statusCounts.total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        return statusCounts;
    } catch (error) {
        logger.error(`Error counting projects by status: ${error.message}`);
        throw new Error(`Failed to count projects by status: ${error.message}`);
    }
}

/**
 * Get all projects sorted by creation date
 * @param {Object} options - Options for sorting and limiting
 * @returns {Promise<Array>} - Array of projects
 */
async function getAllProjects(options = {}) {
    try {
        const { limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;

        const sort = {};
        sort[sortBy] = sortOrder;

        const projects = await Project.find({
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'nom prenom email role')
            .sort(sort)
            .limit(limit);

        return projects;
    } catch (error) {
        logger.error(`Error getting all projects: ${error.message}`);
        throw new Error(`Failed to get all projects: ${error.message}`);
    }
}

/**
 * Get projects created in the last n days
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Array of recent projects
 */
async function getRecentProjects(days = 30) {
    try {
        const date = new Date();
        date.setDate(date.getDate() - days);

        const projects = await Project.find({
            createdAt: { $gte: date },
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return projects;
    } catch (error) {
        logger.error(`Error getting recent projects: ${error.message}`);
        throw new Error(`Failed to get recent projects: ${error.message}`);
    }
}

/**
 * Get users who created the most projects
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} - Array of users with project counts
 */
async function getTopProjectCreators(limit = 5) {
    try {
        const projectCounts = await Project.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$createdBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        // Populate user details
        const result = [];
        for (const item of projectCounts) {
            const user = await User.findById(item._id).select('-password');
            if (user) {
                result.push({
                    user: {
                        _id: user._id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        role: user.role
                    },
                    projectCount: item.count
                });
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error getting top project creators: ${error.message}`);
        throw new Error(`Failed to get top project creators: ${error.message}`);
    }
}

/**
 * Get projects with the most tasks
 * @param {number} limit - Number of projects to return
 * @returns {Promise<Array>} - Array of projects with task counts
 */
async function getProjectsWithMostTasks(limit = 5) {
    try {
        const taskCounts = await Task.aggregate([
            { $match: { isArchived: { $ne: true }, projectId: { $exists: true, $ne: null } } },
            { $group: { _id: '$projectId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        // Populate project details
        const result = [];
        for (const item of taskCounts) {
            const project = await Project.findById(item._id).populate('createdBy', 'nom prenom email role');
            if (project && !project.isDeleted) {
                result.push({
                    project: {
                        _id: project._id,
                        name: project.name,
                        projectNumber: project.projectNumber,
                        status: project.status,
                        createdBy: project.createdBy
                    },
                    taskCount: item.count
                });
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error getting projects with most tasks: ${error.message}`);
        throw new Error(`Failed to get projects with most tasks: ${error.message}`);
    }
}

/**
 * Get users involved in multiple projects
 * @param {number} minProjects - Minimum number of projects to be considered
 * @returns {Promise<Array>} - Array of users with project counts
 */
async function getUsersInMultipleProjects(minProjects = 2) {
    try {
        // This implementation depends on how users are associated with projects
        // Assuming they're in the employees array
        const userCounts = await Project.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $unwind: '$employees' },
            { $group: { _id: '$employees.employeeId', count: { $sum: 1 } } },
            { $match: { count: { $gte: minProjects } } },
            { $sort: { count: -1 } }
        ]);

        // Populate user details
        const result = [];
        for (const item of userCounts) {
            const user = await User.findById(item._id).select('-password');
            if (user) {
                result.push({
                    user: {
                        _id: user._id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        role: user.role
                    },
                    projectCount: item.count
                });
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error getting users in multiple projects: ${error.message}`);
        throw new Error(`Failed to get users in multiple projects: ${error.message}`);
    }
}

/**
 * Get tasks by priority
 * @returns {Promise<Object>} - Object with tasks grouped by priority
 */
async function getTasksByPriority() {
    try {
        const priorities = ['low', 'medium', 'high'];
        const result = {};

        for (const priority of priorities) {
            const tasks = await Task.find({
                priority,
                isArchived: { $ne: true }
            })
                .populate('assignee', 'nom prenom email role')
                .populate('creator', 'nom prenom email role')
                .sort({ createdAt: -1 });

            result[priority] = tasks;
        }

        return result;
    } catch (error) {
        logger.error(`Error getting tasks by priority: ${error.message}`);
        throw new Error(`Failed to get tasks by priority: ${error.message}`);
    }
}

/**
 * Get tasks with upcoming deadlines
 * @param {number} days - Number of days to look ahead
 * @returns {Promise<Array>} - Array of tasks with upcoming deadlines
 */
async function getTasksWithUpcomingDeadlines(days = 7) {
    try {
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + days);

        const tasks = await Task.find({
            endDate: { $gte: today, $lte: future },
            status: { $ne: 'done' },
            isArchived: { $ne: true }
        })
            .populate('assignee', 'nom prenom email role')
            .populate('creator', 'nom prenom email role')
            .sort({ endDate: 1 });

        return tasks;
    } catch (error) {
        logger.error(`Error getting tasks with upcoming deadlines: ${error.message}`);
        throw new Error(`Failed to get tasks with upcoming deadlines: ${error.message}`);
    }
}

/**
 * Get users with the most assigned tasks
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} - Array of users with task counts
 */
async function getUsersWithMostTasks(limit = 5) {
    try {
        const taskCounts = await Task.aggregate([
            { $match: { isArchived: { $ne: true }, assignee: { $exists: true, $ne: null } } },
            { $group: { _id: '$assignee', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        // Populate user details
        const result = [];
        for (const item of taskCounts) {
            const user = await User.findById(item._id).select('-password');
            if (user) {
                result.push({
                    user: {
                        _id: user._id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        role: user.role
                    },
                    taskCount: item.count
                });
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error getting users with most tasks: ${error.message}`);
        throw new Error(`Failed to get users with most tasks: ${error.message}`);
    }
}

/**
 * Get overdue tasks
 * @returns {Promise<Array>} - Array of overdue tasks
 */
async function getOverdueTasks() {
    try {
        const today = new Date();

        const tasks = await Task.find({
            endDate: { $lt: today },
            status: { $ne: 'done' },
            isArchived: { $ne: true }
        })
            .populate('assignee', 'nom prenom email role')
            .populate('creator', 'nom prenom email role')
            .populate('projectId', 'name projectNumber status')
            .sort({ endDate: 1 });

        return tasks;
    } catch (error) {
        logger.error(`Error getting overdue tasks: ${error.message}`);
        throw new Error(`Failed to get overdue tasks: ${error.message}`);
    }
}

/**
 * Get recently completed tasks
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Array of recently completed tasks
 */
async function getRecentlyCompletedTasks(days = 30) {
    try {
        const date = new Date();
        date.setDate(date.getDate() - days);

        const tasks = await Task.find({
            status: 'done',
            completedAt: { $gte: date },
            isArchived: { $ne: true }
        })
            .populate('assignee', 'nom prenom email role')
            .populate('creator', 'nom prenom email role')
            .sort({ completedAt: -1 });

        return tasks;
    } catch (error) {
        logger.error(`Error getting recently completed tasks: ${error.message}`);
        throw new Error(`Failed to get recently completed tasks: ${error.message}`);
    }
}

/**
 * Get user role statistics
 * @returns {Promise<Object>} - Object with counts by role
 */
async function getUserRoleStats() {
    try {
        const result = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Convert to a more friendly format
        const stats = {};
        let total = 0;

        result.forEach(item => {
            stats[item._id] = item.count;
            total += item.count;
        });

        stats.total = total;

        return stats;
    } catch (error) {
        logger.error(`Error getting user role statistics: ${error.message}`);
        throw new Error(`Failed to get user role statistics: ${error.message}`);
    }
}

/**
 * Get recently registered users
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} - Array of recently registered users
 */
async function getRecentlyRegisteredUsers(limit = 5) {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit);

        return users;
    } catch (error) {
        logger.error(`Error getting recently registered users: ${error.message}`);
        throw new Error(`Failed to get recently registered users: ${error.message}`);
    }
}

/**
 * Get document statistics
 * @returns {Promise<Object>} - Object with document statistics
 */
async function getDocumentStats() {
    try {
        // Count documents by file type
        const fileTypeCounts = await Document.aggregate([
            { $group: { _id: '$fileType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Count documents by processing status
        const processingStatusCounts = await Document.aggregate([
            { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Count total documents
        const totalCount = await Document.countDocuments();

        // Recent uploads
        const recentUploads = await Document.find()
            .populate('uploadedBy', 'nom prenom email role')
            .sort({ createdAt: -1 })
            .limit(5);

        return {
            totalCount,
            byFileType: fileTypeCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            byProcessingStatus: processingStatusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            recentUploads: recentUploads.map(doc => ({
                _id: doc._id,
                title: doc.title,
                fileType: doc.fileType,
                uploadedBy: doc.uploadedBy ? `${doc.uploadedBy.prenom} ${doc.uploadedBy.nom}` : 'Unknown',
                createdAt: doc.createdAt
            }))
        };
    } catch (error) {
        logger.error(`Error getting document statistics: ${error.message}`);
        throw new Error(`Failed to get document statistics: ${error.message}`);
    }
}

/**
 * Get documents by type
 * @param {string} fileType - File type to filter by
 * @returns {Promise<Array>} - Array of documents
 */
async function getDocumentsByType(fileType) {
    try {
        const documents = await Document.find({ fileType })
            .populate('uploadedBy', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return documents;
    } catch (error) {
        logger.error(`Error getting documents by type ${fileType}: ${error.message}`);
        throw new Error(`Failed to get documents by type: ${error.message}`);
    }
}

/**
 * Get documents related to a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of documents
 */
async function getProjectDocuments(projectId) {
    try {
        // This is an example implementation and would need to be adapted
        // based on how documents are associated with projects in your system
        const documents = await Document.find({
            'metadata.projectId': projectId
        })
            .populate('uploadedBy', 'nom prenom email role')
            .sort({ createdAt: -1 });

        return documents;
    } catch (error) {
        logger.error(`Error getting documents for project ${projectId}: ${error.message}`);
        throw new Error(`Failed to get project documents: ${error.message}`);
    }
}

/**
 * Get top document uploaders
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} - Array of users with document counts
 */
async function getTopDocumentUploaders(limit = 5) {
    try {
        const uploaderCounts = await Document.aggregate([
            { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        // Populate user details
        const result = [];
        for (const item of uploaderCounts) {
            const user = await User.findById(item._id).select('-password');
            if (user) {
                result.push({
                    user: {
                        _id: user._id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        role: user.role
                    },
                    documentCount: item.count
                });
            }
        }

        return result;
    } catch (error) {
        logger.error(`Error getting top document uploaders: ${error.message}`);
        throw new Error(`Failed to get top document uploaders: ${error.message}`);
    }
}

/**
 * Get projects with overdue tasks
 * @returns {Promise<Array>} - Array of projects with overdue tasks
 */
async function getProjectsWithOverdueTasks() {
    try {
        const today = new Date();

        // Find overdue tasks
        const overdueTasks = await Task.find({
            endDate: { $lt: today },
            status: { $ne: 'done' },
            isArchived: { $ne: true },
            projectId: { $exists: true, $ne: null }
        }).distinct('projectId');

        // Get project details
        const projects = await Project.find({
            _id: { $in: overdueTasks },
            isDeleted: { $ne: true }
        })
            .populate('createdBy', 'nom prenom email role');

        return projects;
    } catch (error) {
        logger.error(`Error getting projects with overdue tasks: ${error.message}`);
        throw new Error(`Failed to get projects with overdue tasks: ${error.message}`);
    }
}

/**
 * Get task completion rate by project
 * @returns {Promise<Array>} - Array of projects with completion rates
 */
async function getTaskCompletionRateByProject() {
    try {
        // Find all active projects
        const projects = await Project.find({
            isDeleted: { $ne: true }
        });

        const result = [];

        for (const project of projects) {
            // Get all tasks for this project
            const tasks = await Task.find({
                projectId: project._id,
                isArchived: { $ne: true }
            });

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === 'done').length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            result.push({
                project: {
                    _id: project._id,
                    name: project.name,
                    projectNumber: project.projectNumber,
                    status: project.status
                },
                taskStats: {
                    total: totalTasks,
                    completed: completedTasks,
                    completionRate: Math.round(completionRate * 100) / 100 // Round to 2 decimal places
                }
            });
        }

        // Sort by completion rate (descending)
        result.sort((a, b) => b.taskStats.completionRate - a.taskStats.completionRate);

        return result;
    } catch (error) {
        logger.error(`Error getting task completion rate by project: ${error.message}`);
        throw new Error(`Failed to get task completion rate: ${error.message}`);
    }
}

// Export all functions
module.exports = {
    getUserTasks,
    getProjectTasks,
    getProjectDetails,
    getUserProfile,
    getUsersByRole,
    getProjectActions,
    searchProjects,
    getUserTaskStats,
    getProjectsByStatus,
    getActiveUsers,
    // New functions
    getProjectCountsByStatus,
    getAllProjects,
    getRecentProjects,
    getTopProjectCreators,
    getProjectsWithMostTasks,
    getUsersInMultipleProjects,
    getTasksByPriority,
    getTasksWithUpcomingDeadlines,
    getUsersWithMostTasks,
    getOverdueTasks,
    getRecentlyCompletedTasks,
    getUserRoleStats,
    getRecentlyRegisteredUsers,
    getDocumentStats,
    getDocumentsByType,
    getProjectDocuments,
    getTopDocumentUploaders,
    getProjectsWithOverdueTasks,
    getTaskCompletionRateByProject
}; 