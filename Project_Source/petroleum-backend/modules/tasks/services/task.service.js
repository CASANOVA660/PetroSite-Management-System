const Task = require('../models/task.model');
const Document = require('../../documents/models/document.model');
const cloudinary = require('../../../config/cloudinary');
const redis = require('../../../config/redis');
const { createNotification } = require('../../notifications/controllers/notificationController');
const mongoose = require('mongoose');

class TaskService {
    // Cache constants
    CACHE_DURATION = 3600; // 1 hour in seconds
    USER_TASKS_KEY_PREFIX = 'user_tasks:';

    // Create a new task
    async createTask(taskData) {
        try {
            const task = new Task(taskData);
            await task.save();

            const populatedTask = await Task.findById(task._id)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return populatedTask;
        } catch (error) {
            console.error('TaskService - Error creating task:', error);
            throw error;
        }
    }

    // Create a personal task
    async createPersonalTask(userData, taskData) {
        try {
            // For personal tasks, creator and assignee are the same person
            const task = new Task({
                ...taskData,
                creator: userData.id,
                assignee: userData.id,
                needsValidation: false, // Personal tasks don't need validation
                tags: ['Personal']
            });

            await task.save();
            const populatedTask = await Task.findById(task._id)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            await this.clearUserTasksCache(userData.id);

            return populatedTask;
        } catch (error) {
            console.error('TaskService - Error creating personal task:', error);
            throw error;
        }
    }

    // Get all tasks for a user
    async getUserTasks(userId) {
        try {
            console.log('TaskService - getUserTasks called for user:', userId);

            // Try to get from cache first
            const cacheKey = `${this.USER_TASKS_KEY_PREFIX}${userId}`;
            const cachedTasks = await redis.get(cacheKey);

            if (cachedTasks) {
                console.log('TaskService - Returning cached tasks for user', userId);
                // Even when returning cached tasks, let's log what's being returned
                const parsedTasks = JSON.parse(cachedTasks);

                // Check for action tasks in the cache
                const allCachedTasks = [
                    ...(parsedTasks.todo || []),
                    ...(parsedTasks.inProgress || []),
                    ...(parsedTasks.inReview || []),
                    ...(parsedTasks.done || [])
                ];

                const actionTasks = allCachedTasks.filter(t => t.actionId);
                console.log(`TaskService - Cache has ${actionTasks.length} action tasks for user ${userId}`);

                // If we have action tasks in cache, return them
                if (actionTasks.length > 0) {
                    return parsedTasks;
                }

                // If no action tasks in cache, proceed to fetch from DB
                console.log('TaskService - No action tasks in cache, clearing cache to refresh');
                await redis.del(cacheKey);
            }

            // If not in cache, fetch from database
            console.log('TaskService - Fetching tasks from database for user:', userId);
            const tasks = await Task.find({
                assignee: userId,
                isArchived: { $ne: true }  // Explicitly exclude archived tasks
            })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .sort({ createdAt: -1 });

            console.log(`TaskService - Found ${tasks.length} total tasks for user ${userId}`);

            // Log action tasks specifically
            const actionTasks = tasks.filter(t => t.actionId);
            console.log(`TaskService - Found ${actionTasks.length} action tasks for user ${userId}`);
            if (actionTasks.length > 0) {
                actionTasks.forEach(task => {
                    console.log(`TaskService - Action task: id=${task._id}, title=${task.title}, actionId=${task.actionId}`);
                });
            }

            // Group tasks by status
            const groupedTasks = {
                todo: tasks.filter(task => task.status === 'todo'),
                inProgress: tasks.filter(task => task.status === 'inProgress'),
                inReview: tasks.filter(task => task.status === 'inReview'),
                done: tasks.filter(task => task.status === 'done')
            };

            // Log counts by status
            console.log('TaskService - Task counts by status:', {
                todo: groupedTasks.todo.length,
                inProgress: groupedTasks.inProgress.length,
                inReview: groupedTasks.inReview.length,
                done: groupedTasks.done.length
            });

            // Cache the result
            await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(groupedTasks));
            console.log(`TaskService - Cached ${tasks.length} tasks for user ${userId}`);

            return groupedTasks;
        } catch (error) {
            console.error('TaskService - Error fetching user tasks:', error);
            throw error;
        }
    }

    // Get tasks by actionId
    async getTasksByActionId(actionId) {
        try {
            if (!actionId) {
                throw new Error('Action ID is required');
            }

            const tasks = await Task.find({ actionId })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            return tasks;
        } catch (error) {
            console.error(`TaskService - Error fetching tasks for action ${actionId}:`, error);
            throw error;
        }
    }

    // Get tasks by globalActionId
    async getTasksByGlobalActionId(globalActionId) {
        try {
            if (!globalActionId) {
                throw new Error('Global Action ID is required');
            }

            const tasks = await Task.find({ globalActionId })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            return tasks;
        } catch (error) {
            console.error(`TaskService - Error fetching tasks for global action ${globalActionId}:`, error);
            throw error;
        }
    }

    // Update task data (generic method for action service)
    async updateTaskData(taskId, updateData) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            const updatedTask = await Task.findByIdAndUpdate(
                taskId,
                updateData,
                { new: true }
            ).populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error updating task data:', error);
            throw error;
        }
    }

    // Delete task
    async deleteTask(taskId) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            // Delete associated files from Cloudinary if they exist
            if (task.files && task.files.length > 0) {
                for (const file of task.files) {
                    try {
                        if (file.publicId) {
                            await cloudinary.uploader.destroy(file.publicId);
                        }
                    } catch (fileError) {
                        console.error(`Failed to delete file ${file.publicId} from Cloudinary:`, fileError);
                        // Continue with other files even if one fails
                    }
                }
            }

            // Delete the task
            await Task.deleteOne({ _id: taskId });

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return true;
        } catch (error) {
            console.error('TaskService - Error deleting task:', error);
            throw error;
        }
    }

    // Update task status
    async updateTaskStatus(taskId, status, userId) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            // Check if the task needs validation
            if (status === 'done' && task.needsValidation && task.status !== 'inReview') {
                throw new Error('This task needs to be reviewed before marking as done');
            }

            // Handle task completion
            const updates = { status };
            if (status === 'done') {
                updates.completedAt = new Date();

                // Process files if task is done
                if (task.files && task.files.length > 0) {
                    await this.processTaskFiles(task);
                }
            }

            // Update the task
            const updatedTask = await Task.findByIdAndUpdate(
                taskId,
                updates,
                { new: true }
            ).populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            // Send notification to creator/manager if status changed to inReview
            if (status === 'inReview' &&
                task.creator &&
                task.creator.toString() !== userId &&
                task.needsValidation) {

                await createNotification({
                    type: 'TASK_REVIEW_REQUESTED',
                    message: `La tâche "${task.title}" est prête pour révision`,
                    userId: task.creator.toString(),
                    isRead: false
                });

                // Real-time notification
                if (global.io) {
                    global.io.to(task.creator.toString()).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'TASK_REVIEW_REQUESTED',
                            message: `La tâche "${task.title}" est prête pour révision`,
                            userId: task.creator.toString()
                        }
                    });
                }
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error updating task status:', error);
            throw error;
        }
    }

    // Process task files when task is done
    async processTaskFiles(task) {
        // Only process for action-related tasks with project association
        if (!task.actionId && !task.globalActionId || !task.projectId || !task.category) {
            return;
        }

        try {
            // For each file, create a document entry
            for (const file of task.files) {
                if (!file.approved) continue; // Skip unapproved files

                await Document.create({
                    name: file.name,
                    url: file.url,
                    publicId: file.publicId,
                    category: task.category,
                    projectId: task.projectId,
                    uploadedBy: file.uploadedBy,
                    format: file.type.split('/')[1],
                    resourceType: file.type.split('/')[0],
                    size: file.size
                });
            }
        } catch (error) {
            console.error('TaskService - Error processing task files:', error);
            // We don't throw here, just log, to avoid preventing task completion
        }
    }

    // Update task progress
    async updateTaskProgress(taskId, progress) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            const updatedTask = await Task.findByIdAndUpdate(
                taskId,
                { progress },
                { new: true }
            ).populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error updating task progress:', error);
            throw error;
        }
    }

    // Add a comment to a task
    async addComment(taskId, commentData) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            task.comments.push(commentData);
            await task.save();

            const updatedTask = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom');

            // Send notification to relevant users
            const targetUserId = commentData.author.toString() === task.assignee.toString()
                ? task.creator.toString()
                : task.assignee.toString();

            await createNotification({
                type: 'TASK_COMMENT_ADDED',
                message: `Nouveau commentaire sur la tâche "${task.title}"`,
                userId: targetUserId,
                isRead: false
            });

            // Real-time notification
            if (global.io) {
                global.io.to(targetUserId).emit('notification', {
                    type: 'NEW_NOTIFICATION',
                    payload: {
                        type: 'TASK_COMMENT_ADDED',
                        message: `Nouveau commentaire sur la tâche "${task.title}"`,
                        userId: targetUserId
                    }
                });
            }

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error adding comment:', error);
            throw error;
        }
    }

    // Add a file to a task
    async addFile(taskId, fileData) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            task.files.push(fileData);
            await task.save();

            const updatedTask = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error adding file:', error);
            throw error;
        }
    }

    // Approve a file in a task
    async approveFile(taskId, fileId, userId) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            // Check if user is creator/manager of the task
            if (task.creator.toString() !== userId) {
                throw new Error('Unauthorized to approve files');
            }

            const fileIndex = task.files.findIndex(file => file._id.toString() === fileId);

            if (fileIndex === -1) {
                throw new Error('File not found');
            }

            task.files[fileIndex].approved = true;
            await task.save();

            const updatedTask = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error approving file:', error);
            throw error;
        }
    }

    // Toggle subtask completion
    async toggleSubtask(taskId, subtaskId) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            const subtaskIndex = task.subtasks.findIndex(subtask =>
                subtask._id.toString() === subtaskId
            );

            if (subtaskIndex === -1) {
                throw new Error('Subtask not found');
            }

            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;

            // Calculate progress based on completed subtasks
            if (task.subtasks.length > 0) {
                const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
                task.progress = Math.round((completedCount / task.subtasks.length) * 100);
            }

            await task.save();

            const updatedTask = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error toggling subtask:', error);
            throw error;
        }
    }

    // Add subtask
    async addSubtask(taskId, subtaskData) {
        try {
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            task.subtasks.push(subtaskData);

            // Recalculate progress if needed
            if (task.subtasks.length > 0) {
                const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
                task.progress = Math.round((completedCount / task.subtasks.length) * 100);
            }

            await task.save();

            const updatedTask = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error adding subtask:', error);
            throw error;
        }
    }

    // Review a task (accept, decline, or return with feedback)
    async reviewTask(taskId, reviewData, userId) {
        try {
            const { decision, feedback } = reviewData;
            const task = await Task.findById(taskId);

            if (!task) {
                throw new Error('Task not found');
            }

            // Check if user is the creator/manager of the task
            if (task.creator.toString() !== userId) {
                throw new Error('Unauthorized to review this task');
            }

            let updatedTask;

            switch (decision) {
                case 'accept':
                    updatedTask = await Task.findByIdAndUpdate(
                        taskId,
                        {
                            status: 'done',
                            completedAt: new Date()
                        },
                        { new: true }
                    ).populate('assignee', 'nom prenom')
                        .populate('creator', 'nom prenom');

                    // Process files if task is accepted
                    if (task.files && task.files.length > 0) {
                        await this.processTaskFiles(task);
                    }

                    // Notify assignee
                    await createNotification({
                        type: 'TASK_ACCEPTED',
                        message: `La tâche "${task.title}" a été acceptée`,
                        userId: task.assignee.toString(),
                        isRead: false
                    });

                    if (global.io) {
                        global.io.to(task.assignee.toString()).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'TASK_ACCEPTED',
                                message: `La tâche "${task.title}" a été acceptée`,
                                userId: task.assignee.toString()
                            }
                        });
                    }
                    break;

                case 'decline':
                    updatedTask = await Task.findByIdAndUpdate(
                        taskId,
                        {
                            isDeclined: true,
                            declineReason: feedback,
                            declinedAt: new Date(),
                            isArchived: true,
                            archivedAt: new Date()
                        },
                        { new: true }
                    ).populate('assignee', 'nom prenom')
                        .populate('creator', 'nom prenom');

                    // Notify assignee
                    await createNotification({
                        type: 'TASK_DECLINED',
                        message: `La tâche "${task.title}" a été refusée`,
                        userId: task.assignee.toString(),
                        isRead: false
                    });

                    if (global.io) {
                        global.io.to(task.assignee.toString()).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'TASK_DECLINED',
                                message: `La tâche "${task.title}" a été refusée`,
                                userId: task.assignee.toString()
                            }
                        });
                    }
                    break;

                case 'return':
                    updatedTask = await Task.findByIdAndUpdate(
                        taskId,
                        {
                            status: 'inProgress',
                            feedback: feedback
                        },
                        { new: true }
                    ).populate('assignee', 'nom prenom')
                        .populate('creator', 'nom prenom');

                    // Notify assignee
                    await createNotification({
                        type: 'TASK_RETURNED',
                        message: `La tâche "${task.title}" vous a été retournée pour modifications`,
                        userId: task.assignee.toString(),
                        isRead: false
                    });

                    if (global.io) {
                        global.io.to(task.assignee.toString()).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                type: 'TASK_RETURNED',
                                message: `La tâche "${task.title}" vous a été retournée pour modifications`,
                                userId: task.assignee.toString()
                            }
                        });
                    }
                    break;

                default:
                    throw new Error('Invalid review decision');
            }

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error reviewing task:', error);
            throw error;
        }
    }

    // Get completed tasks history for a user
    async getTaskHistory(userId) {
        try {
            const tasks = await Task.find({
                assignee: userId,
                $or: [
                    { status: 'done' },
                    { isArchived: true }
                ]
            })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .sort({ completedAt: -1, archivedAt: -1 });

            return tasks;
        } catch (error) {
            console.error('TaskService - Error fetching task history:', error);
            throw error;
        }
    }

    // Archive completed tasks older than the specified date
    async archiveOldTasks(daysThreshold = 1) {
        try {
            const thresholdDate = new Date();
            thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

            const result = await Task.updateMany(
                {
                    status: 'done',
                    completedAt: { $lt: thresholdDate },
                    isArchived: false
                },
                {
                    isArchived: true,
                    archivedAt: new Date()
                }
            );

            console.log(`TaskService - Archived ${result.nModified} old tasks`);
            return result.nModified;
        } catch (error) {
            console.error('TaskService - Error archiving old tasks:', error);
            throw error;
        }
    }

    // Helper method to clear user tasks cache
    async clearUserTasksCache(userId) {
        try {
            if (!userId) {
                console.error('TaskService - Cannot clear cache: userId is undefined or null');
                return;
            }

            // Log the cache clearing
            console.log(`TaskService - Clearing cache for user ${userId}`);
            const cacheKey = `${this.USER_TASKS_KEY_PREFIX}${userId}`;

            // Delete the cache key
            const result = await redis.del(cacheKey);
            console.log(`TaskService - Cache cleared for user ${userId} (Result: ${result})`);
        } catch (error) {
            console.error('TaskService - Error clearing cache:', error);
            // Don't throw, just log the error
        }
    }
}

module.exports = new TaskService(); 