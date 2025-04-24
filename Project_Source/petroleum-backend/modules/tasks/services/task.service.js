const Task = require('../models/task.model');
const Document = require('../../documents/models/document.model');
const cloudinary = require('../../../config/cloudinary');
const redis = require('../../../config/redis');
const { createNotification } = require('../../notifications/controllers/notificationController');
const mongoose = require('mongoose');
const Notification = require('../../notifications/models/Notification');

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
    async getUserTasks(userId, options = {}) {
        try {
            console.log('TaskService - getUserTasks called for user:', userId, 'with options:', options);
            const { includeProjectActions = false } = options;

            // Build query based on parameters
            const query = {
                assignee: userId,
                isArchived: { $ne: true }  // Explicitly exclude archived tasks
            };

            // If we're not explicitly including project actions, exclude them
            if (!includeProjectActions) {
                query.actionId = { $exists: false };
            }

            console.log('TaskService - Using query:', JSON.stringify(query));

            const tasks = await Task.find(query)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom')
                .populate('actionId')
                .populate('globalActionId')
                .sort({ createdAt: -1 }); // Sort by creation date, newest first

            console.log(`TaskService - Found ${tasks.length} total tasks for user ${userId}`);

            // Log action tasks specifically
            const actionTasks = tasks.filter(t => t.actionId);
            console.log(`TaskService - Found ${actionTasks.length} action tasks for user ${userId}`);
            if (actionTasks.length > 0) {
                actionTasks.forEach(task => {
                    console.log(`TaskService - Action task: id=${task._id}, title=${task.title}, actionId=${task.actionId}`);
                });
            }

            // Group tasks by status while preserving order
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

            // Update the cache with fresh data
            const cacheKey = `${this.USER_TASKS_KEY_PREFIX}${userId}${includeProjectActions ? ':with_project_actions' : ''}`;
            await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(groupedTasks));
            console.log(`TaskService - Updated cache with ${tasks.length} tasks for user ${userId}`);

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
            console.error(`TaskService - Error fetching tasks for project action ${actionId}:`, error);
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

            // Check if this is a realization task
            const isRealizationTask = task.title && task.title.startsWith('Réalisation:') ||
                (task.tags && task.tags.includes('Realization'));

            console.log(`TaskService - Is Realization task: ${isRealizationTask}`);

            // For Suivi tasks, check needsValidation flag
            if (task.title && (
                task.title.startsWith('Suivi:') ||
                task.title.startsWith('SUIVI:') ||
                task.title.toLowerCase().includes('suivi:')
            ) || (task.tags && task.tags.some(tag =>
                ['Follow-up', 'Suivi', 'Project Action Validation', 'Validation'].includes(tag)
            ))) {
                console.log(`TaskService - Suivi task detected, needsValidation=${task.needsValidation}`);

                // Only modify needsValidation if it's already false
                // If it's true, we'll keep it true for manager validation
                if (task.needsValidation === false) {
                    console.log(`TaskService - Suivi task with needsValidation=false, proceeding with normal workflow`);
                    // No changes needed - the existing workflow works fine
                } else {
                    console.log(`TaskService - Suivi task with needsValidation=true, will require manager validation`);
                    // We'll keep needsValidation=true to trigger manager validation in the front-end
                }

                // Verify the linked task exists
                const linkedTaskCheck = await Task.findById(task.linkedTaskId);
                if (!linkedTaskCheck) {
                    console.error(`TaskService - WARNING: Linked task with ID ${task.linkedTaskId} not found for Suivi task ${taskId}!`);
                } else {
                    console.log(`TaskService - Verified linked task exists: ${linkedTaskCheck.title} (${linkedTaskCheck._id})`);
                    console.log(`TaskService - Linked task assignee: ${linkedTaskCheck.assignee}`);
                }
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

            // Update associated action status if this task is related to an action
            await this.updateAssociatedActionStatus(task, status);

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error updating task status:', error);
            throw error;
        }
    }

    // Update the status of the action associated with a task
    async updateAssociatedActionStatus(task, taskStatus) {
        try {
            // Don't proceed if task isn't associated with an action
            if (!task.actionId && !task.globalActionId) {
                return;
            }

            // Map task status to action status
            let actionStatus;
            switch (taskStatus) {
                case 'todo':
                    actionStatus = 'pending';
                    break;
                case 'inProgress':
                    actionStatus = 'in_progress';
                    break;
                case 'inReview':
                    actionStatus = 'inReview';
                    break;
                case 'done':
                    actionStatus = 'completed';
                    break;
                default:
                    return; // Don't update if unknown status
            }

            // Update project action
            if (task.actionId) {
                console.log(`TaskService - Updating project action ${task.actionId} status to ${actionStatus} from task status ${taskStatus}`);
                const Action = require('../../actions/models/action.model');
                await Action.findByIdAndUpdate(task.actionId, { status: actionStatus });
            }

            // Update global action
            if (task.globalActionId) {
                console.log(`TaskService - Updating global action ${task.globalActionId} status to ${actionStatus} from task status ${taskStatus}`);
                const GlobalAction = require('../../actions/models/globalAction.model');
                await GlobalAction.findByIdAndUpdate(task.globalActionId, { status: actionStatus });
            }
        } catch (error) {
            // Log but don't throw to prevent task update failure
            console.error('TaskService - Error updating associated action status:', error);
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

            // Get linked task if exists
            let linkedTask = null;
            if (task.linkedTaskId) {
                linkedTask = await Task.findById(task.linkedTaskId)
                    .populate('assignee', 'nom prenom')
                    .populate('creator', 'nom prenom');
            }

            // The author of the comment
            const commentAuthorId = commentData.author.toString();

            // Create a set of users to notify (excluding the comment author)
            const usersToNotify = new Set();

            // Add task assignee if not the comment author
            if (task.assignee && task.assignee._id.toString() !== commentAuthorId) {
                usersToNotify.add(task.assignee._id.toString());
            }

            // Add task creator if not the comment author
            if (task.creator && task.creator._id.toString() !== commentAuthorId) {
                usersToNotify.add(task.creator._id.toString());
            }

            // If there's a linked task, also notify its assignee if not already in the list and not the comment author
            if (linkedTask && linkedTask.assignee && linkedTask.assignee._id.toString() !== commentAuthorId) {
                usersToNotify.add(linkedTask.assignee._id.toString());
            }

            // Create notification title based on task type
            let notificationTitle = task.title;
            if (task.title.startsWith('Réalisation:') || task.title.startsWith('Suivi:')) {
                notificationTitle = task.title.substring(task.title.indexOf(':') + 1).trim();
            }

            // Get comment author name
            const author = await this.getUserById(commentAuthorId);
            const authorName = author ? `${author.prenom} ${author.nom}` : 'Un utilisateur';

            // Send notifications to all relevant users
            for (const userId of usersToNotify) {
                await createNotification({
                    type: 'TASK_COMMENT_ADDED',
                    message: `${authorName} a commenté sur la tâche "${notificationTitle}"`,
                    userId: userId,
                    isRead: false
                });

                // Real-time notification
                if (global.io) {
                    global.io.to(userId).emit('notification', {
                        type: 'NEW_NOTIFICATION',
                        payload: {
                            type: 'TASK_COMMENT_ADDED',
                            message: `${authorName} a commenté sur la tâche "${notificationTitle}"`,
                            userId: userId
                        }
                    });
                }
            }

            // Clear user tasks cache for all involved users
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee._id.toString());
            }
            if (task.creator) {
                await this.clearUserTasksCache(task.creator._id.toString());
            }
            if (linkedTask && linkedTask.assignee) {
                await this.clearUserTasksCache(linkedTask.assignee._id.toString());
            }

            return updatedTask;
        } catch (error) {
            console.error('TaskService - Error adding comment:', error);
            throw error;
        }
    }

    // Helper method to get user by ID
    async getUserById(userId) {
        try {
            const User = require('../../users/models/User');
            return await User.findById(userId);
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
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
            console.log(`TaskService - Reviewing task ${taskId} with decision: ${reviewData.decision}`);
            const { decision, feedback } = reviewData;

            // Validate decision
            if (!decision || !['accept', 'decline', 'return'].includes(decision)) {
                throw new Error('Invalid decision');
            }

            // Get the task
            const task = await Task.findById(taskId).populate('assignee', 'nom prenom');
            if (!task) {
                throw new Error('Task not found');
            }

            console.log(`TaskService - Task found: ${task.title}`);
            console.log(`TaskService - Task status: ${task.status}`);
            console.log(`TaskService - Task needs validation: ${task.needsValidation}`);
            console.log(`TaskService - Task linked task ID: ${task.linkedTaskId}`);
            console.log(`TaskService - Feedback: ${feedback}`);

            // Check if this is a Suivi task
            const isSuiviTask = (
                (task.title && (
                    task.title.startsWith('Suivi:') ||
                    task.title.startsWith('SUIVI:') ||
                    task.title.toLowerCase().includes('suivi:')
                )) ||
                (task.tags && task.tags.some(tag =>
                    ['Follow-up', 'Suivi', 'Project Action Validation', 'Validation'].includes(tag)
                ))
            );

            console.log(`TaskService - Is Suivi task: ${isSuiviTask}`);

            // Check if this is a realization task
            const isRealizationTask = task.title && task.title.startsWith('Réalisation:') ||
                (task.tags && task.tags.includes('Realization'));

            console.log(`TaskService - Is Realization task: ${isRealizationTask}`);

            // For Suivi tasks, check needsValidation flag
            if (isSuiviTask && task.linkedTaskId) {
                console.log(`TaskService - Suivi task detected, needsValidation=${task.needsValidation}`);

                // Only modify needsValidation if it's already false
                // If it's true, we'll keep it true for manager validation
                if (task.needsValidation === false) {
                    console.log(`TaskService - Suivi task with needsValidation=false, proceeding with normal workflow`);
                    // No changes needed - the existing workflow works fine
                } else {
                    console.log(`TaskService - Suivi task with needsValidation=true, will require manager validation`);
                    // We'll keep needsValidation=true to trigger manager validation in the front-end
                }

                // Verify the linked task exists
                const linkedTaskCheck = await Task.findById(task.linkedTaskId);
                if (!linkedTaskCheck) {
                    console.error(`TaskService - WARNING: Linked task with ID ${task.linkedTaskId} not found for Suivi task ${taskId}!`);
                } else {
                    console.log(`TaskService - Verified linked task exists: ${linkedTaskCheck.title} (${linkedTaskCheck._id})`);
                    console.log(`TaskService - Linked task assignee: ${linkedTaskCheck.assignee}`);
                }
            }

            // SPECIAL CASE FOR MANAGER VALIDATION:
            // If this is sent by suivi person for manager validation
            if (isSuiviTask && task.needsValidation && feedback === 'pending_manager_validation') {
                console.log(`TaskService - Suivi task sent for manager validation`);

                // Update the task to mark it as pending manager validation but keep it in review
                const updatedTask = await Task.findByIdAndUpdate(
                    taskId,
                    {
                        reviewFeedback: 'pending_manager_validation'
                    },
                    { new: true }
                );

                // Send notification to the manager (creator)
                if (task.creator) {
                    await Notification.create({
                        type: 'TASK_NEEDS_MANAGER_VALIDATION',
                        message: `La tâche "${task.title}" a été validée par le superviseur et nécessite votre validation finale`,
                        userId: task.creator.toString(),
                        isRead: false,
                        metadata: {
                            taskId: task._id,
                            linkedTaskId: task.linkedTaskId,
                            validatedBy: userId
                        }
                    });

                    // Real-time notification
                    if (global.io) {
                        const socketId = global.userSockets?.get(String(task.creator));
                        if (socketId) {
                            global.io.to(socketId).emit('notification', {
                                type: 'NEW_NOTIFICATION',
                                payload: {
                                    type: 'TASK_NEEDS_MANAGER_VALIDATION',
                                    message: `La tâche "${task.title}" a été validée par le superviseur et nécessite votre validation finale`,
                                    userId: task.creator.toString(),
                                    metadata: {
                                        taskId: task._id,
                                        linkedTaskId: task.linkedTaskId,
                                        validatedBy: userId
                                    }
                                }
                            });
                        }
                    }
                }

                return updatedTask;
            }

            // Special case for manager final validation (when needsValidation = true)
            if (isSuiviTask && task.needsValidation && task.reviewFeedback === 'pending_manager_validation' && decision === 'accept') {
                console.log(`TaskService - Manager is validating a suivi task that was pending validation`);

                // Handle manager validation (complete both tasks)
                const updatedTask = await Task.findByIdAndUpdate(
                    taskId,
                    {
                        status: 'done',
                        completedAt: new Date(),
                        reviewFeedback: feedback || 'Validated by manager'
                    },
                    { new: true }
                ).populate('assignee', 'nom prenom');

                // Now also complete the linked realization task
                if (task.linkedTaskId) {
                    const linkedTask = await Task.findById(task.linkedTaskId);
                    if (linkedTask) {
                        await Task.findByIdAndUpdate(
                            task.linkedTaskId,
                            {
                                status: 'done',
                                completedAt: new Date()
                            },
                            { new: true }
                        );

                        // Send notifications to both assignees
                        if (linkedTask.assignee) {
                            await Notification.create({
                                type: 'TASK_VALIDATED_BY_MANAGER',
                                message: `La tâche "${linkedTask.title}" a été validée par le manager et est terminée`,
                                userId: linkedTask.assignee.toString(),
                                isRead: false,
                                metadata: {
                                    taskId: linkedTask._id,
                                    linkedTaskId: task._id,
                                    validatedBy: userId
                                }
                            });
                        }

                        if (task.assignee) {
                            await Notification.create({
                                type: 'TASK_VALIDATED_BY_MANAGER',
                                message: `La tâche "${task.title}" a été validée par le manager et est terminée`,
                                userId: task.assignee._id.toString(),
                                isRead: false,
                                metadata: {
                                    taskId: task._id,
                                    linkedTaskId: linkedTask._id,
                                    validatedBy: userId
                                }
                            });
                        }

                        // Clear cache for both users
                        if (linkedTask.assignee) {
                            await this.clearUserTasksCache(linkedTask.assignee.toString());
                        }
                        if (task.assignee) {
                            await this.clearUserTasksCache(task.assignee._id.toString());
                        }
                    }
                }

                // Clear the task creator's cache
                if (task.creator) {
                    await this.clearUserTasksCache(task.creator.toString());
                }

                return updatedTask;
            }

            // Check if user is the creator/manager of the task
            if (task.creator.toString() !== userId) {
                console.log(`TaskService - Unauthorized: User ${userId} is not the creator ${task.creator}`);
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

                    // Special handling for Suivi tasks with linked tasks - when a Suivi person validates
                    if (isSuiviTask && task.linkedTaskId) {
                        console.log(`TaskService - Special handling for Suivi task with linked task`);
                        // Find the linked task (likely a realization task)
                        const linkedTask = await Task.findById(task.linkedTaskId);
                        if (linkedTask) {
                            console.log(`TaskService - Found linked realization task: ${linkedTask.title}`);
                            // Always mark the linked task as completed when validating a Suivi task
                            await Task.findByIdAndUpdate(
                                linkedTask._id,
                                {
                                    status: 'done',
                                    completedAt: new Date()
                                },
                                { new: true }
                            );
                            console.log(`TaskService - Linked realization task marked as done`);

                            // Clear linked task's user cache
                            if (linkedTask.assignee) {
                                await this.clearUserTasksCache(linkedTask.assignee.toString());
                            }

                            // 1. Send notification to the realization task assignee
                            if (linkedTask.assignee) {
                                console.log(`TaskService - Sending notification to realization assignee: ${linkedTask.assignee}`);

                                // Direct DB notification to ensure delivery
                                const realizationNotif = await Notification.create({
                                    type: 'TASK_VALIDATED',
                                    message: `La tâche "${linkedTask.title}" a été revue et validée par le responsable de suivi`,
                                    userId: linkedTask.assignee.toString(),
                                    isRead: false,
                                    metadata: {
                                        taskId: linkedTask._id,
                                        linkedTaskId: task._id,
                                        reviewerId: userId
                                    },
                                    createdAt: new Date()
                                });

                                console.log(`TaskService - Created DB notification for realization assignee: ${realizationNotif._id}`);

                                // Real-time notification with forced delivery
                                if (global.io) {
                                    try {
                                        const socketId = global.userSockets?.get(String(linkedTask.assignee));
                                        console.log(`TaskService - Sending socket notification to realization assignee: ${linkedTask.assignee}, socketId: ${socketId}`);

                                        if (socketId) {
                                            global.io.to(socketId).emit('notification', {
                                                type: 'NEW_NOTIFICATION',
                                                payload: {
                                                    _id: realizationNotif._id,
                                                    type: 'TASK_VALIDATED',
                                                    message: `La tâche "${linkedTask.title}" a été revue et validée par le responsable de suivi`,
                                                    userId: linkedTask.assignee.toString(),
                                                    metadata: {
                                                        taskId: linkedTask._id,
                                                        linkedTaskId: task._id,
                                                        reviewerId: userId
                                                    },
                                                    isRead: false,
                                                    createdAt: new Date()
                                                }
                                            });
                                            console.log(`TaskService - Socket notification sent to realization assignee`);
                                        } else {
                                            console.warn(`TaskService - Realization assignee ${linkedTask.assignee} not connected to socket`);
                                        }
                                    } catch (error) {
                                        console.error(`TaskService - Error sending socket notification to realization assignee:`, error);
                                    }
                                }
                            }

                            // 2. Send notification to the task creator if different from assignee and reviewer
                            if (linkedTask.creator &&
                                linkedTask.creator.toString() !== linkedTask.assignee?.toString() &&
                                linkedTask.creator.toString() !== userId) {

                                console.log(`TaskService - Sending notification to task creator: ${linkedTask.creator}`);

                                // Direct DB notification to ensure delivery
                                const creatorNotif = await Notification.create({
                                    type: 'TASK_COMPLETED',
                                    message: `La tâche "${linkedTask.title}" a été complétée et validée par le responsable de suivi`,
                                    userId: linkedTask.creator.toString(),
                                    isRead: false,
                                    metadata: {
                                        taskId: linkedTask._id,
                                        linkedTaskId: task._id,
                                        reviewerId: userId
                                    },
                                    createdAt: new Date()
                                });

                                console.log(`TaskService - Created DB notification for creator: ${creatorNotif._id}`);

                                // Real-time notification
                                if (global.io) {
                                    try {
                                        const socketId = global.userSockets?.get(String(linkedTask.creator));
                                        console.log(`TaskService - Sending socket notification to creator: ${linkedTask.creator}, socketId: ${socketId}`);

                                        if (socketId) {
                                            global.io.to(socketId).emit('notification', {
                                                type: 'NEW_NOTIFICATION',
                                                payload: {
                                                    _id: creatorNotif._id,
                                                    type: 'TASK_COMPLETED',
                                                    message: `La tâche "${linkedTask.title}" a été complétée et validée par le responsable de suivi`,
                                                    userId: linkedTask.creator.toString(),
                                                    metadata: {
                                                        taskId: linkedTask._id,
                                                        linkedTaskId: task._id,
                                                        reviewerId: userId
                                                    },
                                                    isRead: false,
                                                    createdAt: new Date()
                                                }
                                            });
                                            console.log(`TaskService - Socket notification sent to creator`);
                                        } else {
                                            console.warn(`TaskService - Creator ${linkedTask.creator} not connected to socket`);
                                        }
                                    } catch (error) {
                                        console.error(`TaskService - Error sending socket notification to creator:`, error);
                                    }
                                }
                            }
                        }
                    }
                    // Regular handling for non-Suivi tasks (or tasks without linked tasks)
                    else if (task.linkedTaskId && !task.needsValidation) {
                        console.log(`TaskService - Linked task auto-completion triggered: needsValidation=${task.needsValidation}`);

                        // Find the linked task
                        const linkedTask = await Task.findById(task.linkedTaskId);

                        // Log linked task details
                        if (linkedTask) {
                            console.log(`TaskService - Found linked task: ${linkedTask.title}`);
                            console.log(`TaskService - Linked task status: ${linkedTask.status}`);
                            console.log(`TaskService - Linked task needs validation: ${linkedTask.needsValidation}`);

                            // Mark the linked task as completed
                            await Task.findByIdAndUpdate(
                                linkedTask._id,
                                {
                                    status: 'done',
                                    completedAt: new Date()
                                },
                                { new: true }
                            );
                            console.log(`TaskService - Linked task marked as done`);

                            // Clear linked task's user cache
                            if (linkedTask.assignee) {
                                await this.clearUserTasksCache(linkedTask.assignee.toString());
                            }

                            // Notify the linked task's assignee
                            await createNotification({
                                type: 'TASK_COMPLETED',
                                message: `La tâche "${linkedTask.title}" a été automatiquement complétée suite à la validation de la tâche liée`,
                                userId: linkedTask.assignee.toString(),
                                isRead: false,
                                metadata: {
                                    taskId: linkedTask._id,
                                    linkedTaskId: task._id
                                },
                                createdAt: new Date()
                            });
                            console.log(`Enhanced notification sent to linked task assignee`);

                            if (global.io) {
                                global.io.to(linkedTask.assignee.toString()).emit('notification', {
                                    type: 'NEW_NOTIFICATION',
                                    payload: {
                                        type: 'TASK_COMPLETED',
                                        message: `La tâche "${linkedTask.title}" a été automatiquement complétée suite à la validation de la tâche liée`,
                                        userId: linkedTask.assignee.toString(),
                                        metadata: {
                                            taskId: linkedTask._id,
                                            linkedTaskId: task._id
                                        },
                                        isRead: false,
                                        createdAt: new Date()
                                    }
                                });
                                console.log(`Enhanced socket notification sent to linked task assignee`);
                            }
                        } else {
                            console.log(`TaskService - Linked task not found for ID: ${task.linkedTaskId}`);
                        }
                    } else {
                        console.log(`TaskService - No linked task auto-completion: linkedTaskId=${task.linkedTaskId}, needsValidation=${task.needsValidation}`);
                    }

                    // Notify task assignee about task acceptance
                    if (task.assignee && task.assignee.toString() !== userId) {
                        console.log(`TaskService - Sending notification to task assignee: ${task.assignee}`);

                        // Direct DB notification to ensure delivery
                        const assigneeNotif = await Notification.create({
                            type: 'TASK_ACCEPTED',
                            message: `Votre tâche "${task.title}" a été acceptée et marquée comme terminée`,
                            userId: task.assignee.toString(),
                            isRead: false,
                            metadata: {
                                taskId: task._id
                            },
                            createdAt: new Date()
                        });

                        console.log(`TaskService - Created DB notification for assignee: ${assigneeNotif._id}`);

                        if (global.io) {
                            try {
                                const socketId = global.userSockets?.get(String(task.assignee));
                                console.log(`TaskService - Sending socket notification to assignee: ${task.assignee}, socketId: ${socketId}`);

                                if (socketId) {
                                    global.io.to(socketId).emit('notification', {
                                        type: 'NEW_NOTIFICATION',
                                        payload: {
                                            _id: assigneeNotif._id,
                                            type: 'TASK_ACCEPTED',
                                            message: `Votre tâche "${task.title}" a été acceptée et marquée comme terminée`,
                                            userId: task.assignee.toString(),
                                            metadata: {
                                                taskId: task._id
                                            },
                                            isRead: false,
                                            createdAt: new Date()
                                        }
                                    });
                                    console.log(`TaskService - Socket notification sent to assignee`);
                                } else {
                                    console.warn(`TaskService - Assignee ${task.assignee} not connected to socket`);
                                }
                            } catch (error) {
                                console.error(`TaskService - Error sending socket notification to assignee:`, error);
                            }
                        }
                    }

                    // Notify manager if different from assignee
                    if (task.creator.toString() !== task.assignee?.toString() && task.creator.toString() !== userId) {
                        console.log(`TaskService - Sending notification to task creator/manager: ${task.creator}`);

                        // Direct DB notification to ensure delivery
                        const creatorNotif = await Notification.create({
                            type: 'TASK_COMPLETED',
                            message: `La tâche "${task.title}" a été complétée et acceptée`,
                            userId: task.creator.toString(),
                            isRead: false,
                            metadata: {
                                taskId: task._id
                            },
                            createdAt: new Date()
                        });

                        console.log(`TaskService - Created DB notification for creator/manager: ${creatorNotif._id}`);

                        if (global.io) {
                            try {
                                const socketId = global.userSockets?.get(String(task.creator));
                                console.log(`TaskService - Sending socket notification to creator/manager: ${task.creator}, socketId: ${socketId}`);

                                if (socketId) {
                                    global.io.to(socketId).emit('notification', {
                                        type: 'NEW_NOTIFICATION',
                                        payload: {
                                            _id: creatorNotif._id,
                                            type: 'TASK_COMPLETED',
                                            message: `La tâche "${task.title}" a été complétée et acceptée`,
                                            userId: task.creator.toString(),
                                            metadata: {
                                                taskId: task._id
                                            },
                                            isRead: false,
                                            createdAt: new Date()
                                        }
                                    });
                                    console.log(`TaskService - Socket notification sent to creator/manager`);
                                } else {
                                    console.warn(`TaskService - Creator/manager ${task.creator} not connected to socket`);
                                }
                            } catch (error) {
                                console.error(`TaskService - Error sending socket notification to creator/manager:`, error);
                            }
                        }
                    }
                    break;

                case 'decline':
                    updatedTask = await Task.findByIdAndUpdate(
                        taskId,
                        {
                            status: 'todo',
                            rejectionFeedback: feedback || 'Task declined without specific feedback'
                        },
                        { new: true }
                    ).populate('assignee', 'nom prenom')
                        .populate('creator', 'nom prenom');

                    // Notify assignee about task declination
                    if (task.assignee && task.assignee.toString() !== userId) {
                        await createNotification({
                            type: 'TASK_DECLINED',
                            message: `Votre tâche "${task.title}" a été refusée. Raison: ${feedback || 'Aucune raison fournie'}`,
                            userId: task.assignee.toString(),
                            isRead: false,
                            metadata: {
                                taskId: task._id,
                                feedback: feedback || 'Aucune raison fournie'
                            },
                            createdAt: new Date()
                        });

                        if (global.io) {
                            global.io.to(task.assignee.toString()).emit('notification', {
                                type: 'NEW_NOTIFICATION',
                                payload: {
                                    type: 'TASK_DECLINED',
                                    message: `Votre tâche "${task.title}" a été refusée. Raison: ${feedback || 'Aucune raison fournie'}`,
                                    userId: task.assignee.toString(),
                                    metadata: {
                                        taskId: task._id,
                                        feedback: feedback || 'Aucune raison fournie'
                                    },
                                    isRead: false,
                                    createdAt: new Date()
                                }
                            });
                            console.log(`Enhanced notification sent to task assignee about decline`);
                        }
                    }

                    // Special handling for Suivi tasks - notify linked realization task
                    if (isSuiviTask && task.linkedTaskId) {
                        const linkedTask = await Task.findById(task.linkedTaskId);
                        if (linkedTask && linkedTask.assignee) {
                            // Only notify if assignee is different from current task assignee
                            if (linkedTask.assignee.toString() !== task.assignee?.toString()) {
                                await createNotification({
                                    type: 'LINKED_TASK_DECLINED',
                                    message: `La tâche liée "${task.title}" a été refusée, ce qui pourrait affecter votre tâche "${linkedTask.title}"`,
                                    userId: linkedTask.assignee.toString(),
                                    isRead: false,
                                    metadata: {
                                        taskId: linkedTask._id,
                                        linkedTaskId: task._id,
                                        feedback: feedback || 'Aucune raison fournie'
                                    },
                                    createdAt: new Date()
                                });

                                if (global.io) {
                                    global.io.to(linkedTask.assignee.toString()).emit('notification', {
                                        type: 'NEW_NOTIFICATION',
                                        payload: {
                                            type: 'LINKED_TASK_DECLINED',
                                            message: `La tâche liée "${task.title}" a été refusée, ce qui pourrait affecter votre tâche "${linkedTask.title}"`,
                                            userId: linkedTask.assignee.toString(),
                                            metadata: {
                                                taskId: linkedTask._id,
                                                linkedTaskId: task._id,
                                                feedback: feedback || 'Aucune raison fournie'
                                            },
                                            isRead: false,
                                            createdAt: new Date()
                                        }
                                    });
                                    console.log(`Enhanced notification sent to linked task assignee about decline`);
                                }
                            }
                        }
                    }
                    break;

                case 'return':
                    updatedTask = await Task.findByIdAndUpdate(
                        taskId,
                        {
                            status: 'inProgress',
                            rejectionFeedback: feedback || 'Task returned for modifications'
                        },
                        { new: true }
                    ).populate('assignee', 'nom prenom')
                        .populate('creator', 'nom prenom');

                    // Notify assignee about task being returned
                    if (task.assignee && task.assignee.toString() !== userId) {
                        await createNotification({
                            type: 'TASK_RETURNED',
                            message: `Votre tâche "${task.title}" a été retournée pour modification. Commentaires: ${feedback || 'Aucune précision fournie'}`,
                            userId: task.assignee.toString(),
                            isRead: false,
                            metadata: {
                                taskId: task._id,
                                feedback: feedback || 'Aucune précision fournie'
                            },
                            createdAt: new Date()
                        });

                        if (global.io) {
                            global.io.to(task.assignee.toString()).emit('notification', {
                                type: 'NEW_NOTIFICATION',
                                payload: {
                                    type: 'TASK_RETURNED',
                                    message: `Votre tâche "${task.title}" a été retournée pour modification. Commentaires: ${feedback || 'Aucune précision fournie'}`,
                                    userId: task.assignee.toString(),
                                    metadata: {
                                        taskId: task._id,
                                        feedback: feedback || 'Aucune précision fournie'
                                    },
                                    isRead: false,
                                    createdAt: new Date()
                                }
                            });
                            console.log(`Enhanced notification sent to task assignee about return`);
                        }
                    }

                    // Special handling for Suivi tasks - notify linked realization task
                    if (isSuiviTask && task.linkedTaskId) {
                        const linkedTask = await Task.findById(task.linkedTaskId);
                        if (linkedTask && linkedTask.assignee) {
                            // Only notify if assignee is different from current task assignee
                            if (linkedTask.assignee.toString() !== task.assignee?.toString()) {
                                await createNotification({
                                    type: 'LINKED_TASK_RETURNED',
                                    message: `La tâche liée "${task.title}" a été retournée pour modification, ce qui pourrait affecter votre tâche "${linkedTask.title}"`,
                                    userId: linkedTask.assignee.toString(),
                                    isRead: false,
                                    metadata: {
                                        taskId: linkedTask._id,
                                        linkedTaskId: task._id,
                                        feedback: feedback || 'Aucune précision fournie'
                                    },
                                    createdAt: new Date()
                                });

                                if (global.io) {
                                    global.io.to(linkedTask.assignee.toString()).emit('notification', {
                                        type: 'NEW_NOTIFICATION',
                                        payload: {
                                            type: 'LINKED_TASK_RETURNED',
                                            message: `La tâche liée "${task.title}" a été retournée pour modification, ce qui pourrait affecter votre tâche "${linkedTask.title}"`,
                                            userId: linkedTask.assignee.toString(),
                                            metadata: {
                                                taskId: linkedTask._id,
                                                linkedTaskId: task._id,
                                                feedback: feedback || 'Aucune précision fournie'
                                            },
                                            isRead: false,
                                            createdAt: new Date()
                                        }
                                    });
                                    console.log(`Enhanced notification sent to linked task assignee about return`);
                                }
                            }
                        }
                    }
                    break;

                default:
                    throw new Error('Invalid review decision');
            }

            // Clear user tasks cache
            if (task.assignee) {
                await this.clearUserTasksCache(task.assignee.toString());
            }

            // Add a history entry
            if (updatedTask) {
                if (!updatedTask.history) {
                    updatedTask.history = [];
                }

                updatedTask.history.push({
                    user: userId,
                    action: 'review',
                    details: { decision, feedback },
                    date: new Date()
                });

                await updatedTask.save();
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

    // Clear user tasks cache
    async clearUserTasksCache(userId) {
        try {
            // Clear all variations of user task cache
            const baseKey = `${this.USER_TASKS_KEY_PREFIX}${userId}`;

            // Create a list of all possible cache keys
            const cacheKeys = [
                baseKey,                              // Basic user tasks
                `${baseKey}:with_project_actions`,    // User tasks with project actions
                `${baseKey}:project_actions_only`,    // Only project action tasks
                `${baseKey}:global_actions_only`      // Only global action tasks
            ];

            // Clear all cache keys
            for (const key of cacheKeys) {
                await redis.del(key);
                console.log(`TaskService - Cleared cache for key: ${key}`);
            }

            console.log(`TaskService - All cache cleared for user ${userId}`);
        } catch (error) {
            console.error(`TaskService - Error clearing cache for user ${userId}:`, error);
            // Don't throw the error since this is a non-critical operation
        }
    }

    // Get only project action tasks for a user
    async getProjectActionTasks(userId) {
        try {
            console.log('TaskService - getProjectActionTasks called for user:', userId);

            // Query only for tasks that have actionId
            const tasks = await Task.find({
                assignee: userId,
                actionId: { $exists: true, $ne: null },
                isArchived: { $ne: true }
            })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom')
                .populate('actionId')
                .sort({ createdAt: -1 }); // Sort by creation date, newest first

            console.log(`TaskService - Found ${tasks.length} project action tasks for user ${userId}`);

            // Group tasks by status while preserving order
            const groupedTasks = {
                todo: tasks.filter(task => task.status === 'todo'),
                inProgress: tasks.filter(task => task.status === 'inProgress'),
                inReview: tasks.filter(task => task.status === 'inReview'),
                done: tasks.filter(task => task.status === 'done')
            };

            // Update cache
            const cacheKey = `${this.USER_TASKS_KEY_PREFIX}${userId}:project_actions_only`;
            await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(groupedTasks));
            console.log(`TaskService - Updated cache for project action tasks for user ${userId}`);

            return groupedTasks;
        } catch (error) {
            console.error('TaskService - Error fetching project action tasks:', error);
            throw error;
        }
    }

    // Get only global action tasks for a user
    async getGlobalActionTasks(userId) {
        try {
            console.log('TaskService - getGlobalActionTasks called for user:', userId);

            // Query only for tasks that have globalActionId
            const tasks = await Task.find({
                assignee: userId,
                globalActionId: { $exists: true, $ne: null },
                isArchived: { $ne: true }
            })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom')
                .populate('globalActionId')
                .sort({ createdAt: -1 }); // Sort by creation date, newest first

            console.log(`TaskService - Found ${tasks.length} global action tasks for user ${userId}`);

            // Group tasks by status while preserving order
            const groupedTasks = {
                todo: tasks.filter(task => task.status === 'todo'),
                inProgress: tasks.filter(task => task.status === 'inProgress'),
                inReview: tasks.filter(task => task.status === 'inReview'),
                done: tasks.filter(task => task.status === 'done')
            };

            // Update cache
            const cacheKey = `${this.USER_TASKS_KEY_PREFIX}${userId}:global_actions_only`;
            await redis.setex(cacheKey, this.CACHE_DURATION, JSON.stringify(groupedTasks));
            console.log(`TaskService - Updated cache for global action tasks for user ${userId}`);

            return groupedTasks;
        } catch (error) {
            console.error('TaskService - Error fetching global action tasks:', error);
            throw error;
        }
    }

    // Create tasks directly from a project action
    async createTasksFromProjectAction(actionId) {
        try {
            console.log(`TaskService - createTasksFromProjectAction called for action: ${actionId}`);

            if (!actionId) {
                throw new Error('Action ID is required to create tasks');
            }

            // First, check if tasks already exist for this action
            const existingTasks = await Task.find({ actionId });
            if (existingTasks && existingTasks.length > 0) {
                console.log(`TaskService - ${existingTasks.length} tasks already exist for action ${actionId}`);
                return existingTasks;
            }

            // Fetch the action with all its details
            const Action = require('../../actions/models/action.model');
            const action = await Action.findById(actionId)
                .populate('responsible')
                .populate('responsibleFollowup')
                .populate('manager');

            if (!action) {
                throw new Error(`Project action with ID ${actionId} not found`);
            }

            console.log(`TaskService - Creating tasks for action: ${action.title}`);

            // Create tasks based on action type
            let tasks = [];

            // Create a task for the responsible person (realization)
            const realizationTask = new Task({
                title: `Réalisation: ${action.title}`,
                description: action.content,
                status: 'todo',
                progress: 0,
                priority: 'medium',
                startDate: action.startDate,
                endDate: action.endDate,
                assignee: action.responsible._id,
                creator: action.manager._id,
                needsValidation: false, // Always false for realization task
                tags: ['Project Action', 'Realization', action.category],
                actionId: action._id,
                projectId: action.projectId,
                category: action.category,
                type: 'realization'
            });

            await realizationTask.save();
            tasks.push(realizationTask);

            // Create a task for the follow-up person
            const followUpTask = new Task({
                title: `Suivi: ${action.title}`,
                description: action.content,
                status: 'todo',
                progress: 0,
                priority: 'medium',
                startDate: action.startDate,
                endDate: action.endDate,
                assignee: action.responsibleFollowup._id,
                creator: action.manager._id,
                needsValidation: action.needsValidation === true, // Only true if action needs validation
                tags: ['Project Action', 'Follow-up', action.category],
                actionId: action._id,
                projectId: action.projectId,
                category: action.category,
                linkedTaskId: realizationTask._id,
                type: 'followup'
            });

            await followUpTask.save();
            tasks.push(followUpTask);

            // Update the realization task with the link back to the follow-up task
            realizationTask.linkedTaskId = followUpTask._id;
            await realizationTask.save();

            console.log(`TaskService - Created ${tasks.length} tasks for action ${actionId}`);

            // Clear caches for all users involved
            await this.clearUserTasksCache(action.responsible._id.toString());
            await this.clearUserTasksCache(action.responsibleFollowup._id.toString());
            await this.clearUserTasksCache(action.manager._id.toString());

            return tasks;
        } catch (error) {
            console.error(`TaskService - Error creating tasks from project action:`, error);
            throw error;
        }
    }

    // Get task by ID
    async getTaskById(taskId) {
        try {
            if (!taskId) {
                throw new Error('Task ID is required');
            }

            const task = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom')
                .populate('actionId')
                .populate('globalActionId');

            if (!task) {
                throw new Error('Task not found');
            }

            return task;
        } catch (error) {
            console.error(`TaskService - Error fetching task with ID ${taskId}:`, error);
            throw error;
        }
    }

    // Get task by ID with data from linked task
    async getTaskWithLinkedData(taskId) {
        try {
            if (!taskId) {
                throw new Error('Task ID is required');
            }

            // Get the main task with all populated fields
            const task = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('comments.author', 'nom prenom')
                .populate('actionId')
                .populate('globalActionId');

            if (!task) {
                throw new Error('Task not found');
            }

            // If the task has a linked task, get its data too
            if (task.linkedTaskId) {
                const linkedTask = await Task.findById(task.linkedTaskId)
                    .populate('assignee', 'nom prenom')
                    .populate('creator', 'nom prenom')
                    .populate('comments.author', 'nom prenom');

                if (linkedTask) {
                    // Combine comments from both tasks
                    // Add a combined timestamp-sorted array of all comments
                    const allComments = [...task.comments, ...linkedTask.comments].sort((a, b) => {
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    });

                    // Add all files from both tasks
                    const allFiles = [...task.files, ...linkedTask.files];

                    // Create a combined view by setting additional properties
                    task._doc.allComments = allComments;
                    task._doc.allFiles = allFiles;
                    task._doc.linkedTask = {
                        _id: linkedTask._id,
                        title: linkedTask.title,
                        assignee: linkedTask.assignee,
                        creator: linkedTask.creator,
                    };
                }
            } else {
                // If no linked task, set allComments and allFiles to the task's own comments and files
                task._doc.allComments = task.comments;
                task._doc.allFiles = task.files;
            }

            return task;
        } catch (error) {
            console.error(`TaskService - Error fetching task with linked data for ID ${taskId}:`, error);
            throw error;
        }
    }
}

module.exports = new TaskService(); 