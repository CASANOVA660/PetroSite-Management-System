const taskService = require('../services/task.service');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../../notifications/controllers/notificationController');
const cloudinary = require('../../../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tasks',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

class TaskController {
    // Middleware for file upload
    uploadFile = upload.single('file');

    // Get all tasks for the current user
    async getUserTasks(req, res) {
        try {
            const userId = req.user.id;
            // Check for additional flags in the request
            const includeProjectActions = req.query.includeProjectActions === 'true';

            console.log('TaskController - getUserTasks called with includeProjectActions:', includeProjectActions);

            const tasks = await taskService.getUserTasks(userId, { includeProjectActions });

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('TaskController - Error fetching user tasks:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des tâches.',
                error: error.message
            });
        }
    }

    // Get only project action tasks for the current user
    async getProjectActionTasks(req, res) {
        try {
            const userId = req.user.id;
            console.log('TaskController - getProjectActionTasks called for user:', userId);

            const tasks = await taskService.getProjectActionTasks(userId);

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('TaskController - Error fetching project action tasks:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des tâches d\'action de projet.',
                error: error.message
            });
        }
    }

    // Get only global action tasks for the current user
    async getGlobalActionTasks(req, res) {
        try {
            const userId = req.user.id;
            console.log('TaskController - getGlobalActionTasks called for user:', userId);

            const tasks = await taskService.getGlobalActionTasks(userId);

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error('TaskController - Error fetching global action tasks:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des tâches d\'action globale.',
                error: error.message
            });
        }
    }

    // Get tasks by global action ID
    async getTasksByGlobalActionId(req, res) {
        try {
            const { globalActionId } = req.params;

            if (!globalActionId) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'ID de l\'action globale est requis'
                });
            }

            console.log('TaskController - getTasksByGlobalActionId called for action:', globalActionId);
            const tasks = await taskService.getTasksByGlobalActionId(globalActionId);

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error(`TaskController - Error fetching tasks for global action ${req.params.globalActionId}:`, error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des tâches liées à cette action globale.',
                error: error.message
            });
        }
    }

    // Get tasks by project action ID
    async getTasksByActionId(req, res) {
        try {
            const { actionId } = req.params;

            if (!actionId) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'ID de l\'action de projet est requis'
                });
            }

            console.log('TaskController - getTasksByActionId called for action:', actionId);
            const tasks = await taskService.getTasksByActionId(actionId);

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (error) {
            console.error(`TaskController - Error fetching tasks for project action ${req.params.actionId}:`, error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des tâches liées à cette action de projet.',
                error: error.message
            });
        }
    }

    // Create a personal task
    async createPersonalTask(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const userData = req.user;
            const taskData = {
                title: req.body.title,
                description: req.body.description,
                startDate: new Date(),
                endDate: req.body.dueDate,
                priority: req.body.priority || 'medium',
                subtasks: req.body.subtasks || []
            };

            const task = await taskService.createPersonalTask(userData, taskData);

            return res.status(201).json({
                success: true,
                data: task
            });
        } catch (error) {
            console.error('TaskController - Error creating personal task:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la création de la tâche.',
                error: error.message
            });
        }
    }

    // Update task status
    async updateTaskStatus(req, res) {
        const { taskId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!['todo', 'inProgress', 'inReview', 'done'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide.'
            });
        }

        try {
            const updatedTask = await taskService.updateTaskStatus(taskId, status, userId);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error updating task status:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update task progress
    async updateTaskProgress(req, res) {
        const { taskId } = req.params;
        const { progress } = req.body;

        if (isNaN(progress) || progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progression invalide. Doit être un nombre entre 0 et 100.'
            });
        }

        try {
            const updatedTask = await taskService.updateTaskProgress(taskId, progress);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error updating task progress:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Add comment to task
    async addComment(req, res) {
        const { taskId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Le texte du commentaire est requis.'
            });
        }

        try {
            const commentData = {
                text,
                author: userId
            };

            const updatedTask = await taskService.addComment(taskId, commentData);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error adding comment:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Upload file to task
    async uploadTaskFile(req, res) {
        const { taskId } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni.'
            });
        }

        try {
            // Create file data object from Cloudinary upload result
            const fileObject = {
                name: req.file.originalname || req.file.filename,
                url: req.file.path, // Cloudinary URL
                publicId: req.file.filename, // Cloudinary public ID
                type: req.file.mimetype,
                size: req.file.size,
                uploadedBy: userId
            };

            const updatedTask = await taskService.addFile(taskId, fileObject);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error uploading file:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Approve file
    async approveFile(req, res) {
        const { taskId, fileId } = req.params;
        const userId = req.user.id;

        try {
            const updatedTask = await taskService.approveFile(taskId, fileId, userId);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error approving file:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Toggle subtask completion
    async toggleSubtask(req, res) {
        const { taskId, subtaskId } = req.params;

        try {
            const updatedTask = await taskService.toggleSubtask(taskId, subtaskId);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error toggling subtask:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Add subtask
    async addSubtask(req, res) {
        const { taskId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Le texte de la sous-tâche est requis.'
            });
        }

        try {
            const subtaskData = {
                text: text.trim(),
                completed: false
            };

            const updatedTask = await taskService.addSubtask(taskId, subtaskData);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error adding subtask:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Review task (accept, decline, or return with feedback)
    async reviewTask(req, res) {
        const { taskId } = req.params;
        const { decision, feedback } = req.body;
        const userId = req.user.id;

        if (!['accept', 'decline', 'return'].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: 'Décision invalide.'
            });
        }

        if ((decision === 'decline' || decision === 'return') && (!feedback || !feedback.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Un commentaire est requis pour refuser ou retourner une tâche.'
            });
        }

        try {
            const updatedTask = await taskService.reviewTask(taskId, { decision, feedback }, userId);

            return res.status(200).json({
                success: true,
                data: updatedTask
            });
        } catch (error) {
            console.error('TaskController - Error reviewing task:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get task history
    async getTaskHistory(req, res) {
        try {
            const userId = req.user.id;
            const history = await taskService.getTaskHistory(userId);

            return res.status(200).json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('TaskController - Error fetching task history:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération de l\'historique des tâches.',
                error: error.message
            });
        }
    }

    // Archive old tasks (admin/cron job endpoint)
    async archiveOldTasks(req, res) {
        try {
            const { days } = req.query;
            const daysThreshold = parseInt(days) || 1;

            const archivedCount = await taskService.archiveOldTasks(daysThreshold);

            return res.status(200).json({
                success: true,
                message: `${archivedCount} tâches ont été archivées.`
            });
        } catch (error) {
            console.error('TaskController - Error archiving tasks:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de l\'archivage des tâches.',
                error: error.message
            });
        }
    }

    // Manually create tasks from a project action
    async createTasksFromProjectAction(req, res) {
        try {
            const { actionId } = req.params;

            if (!actionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Action ID is required'
                });
            }

            console.log('TaskController - createTasksFromProjectAction called for action:', actionId);

            // Force clear the cache before creating tasks
            const taskService = require('../services/task.service');
            const userId = req.user.id;
            await taskService.clearUserTasksCache(userId);

            // Create the tasks
            const tasks = await taskService.createTasksFromProjectAction(actionId);

            // Now fetch and return fully populated tasks
            const populatedTasks = await Promise.all(tasks.map(async (task) => {
                return await taskService.getTaskById(task._id);
            }));

            return res.status(200).json({
                success: true,
                message: `Created ${tasks.length} tasks for project action`,
                data: populatedTasks
            });
        } catch (error) {
            console.error('TaskController - Error creating tasks from project action:', error);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la création des tâches à partir de l\'action de projet.',
                error: error.message
            });
        }
    }

    // Get task with linked data
    async getTaskWithLinkedData(req, res) {
        try {
            const { taskId } = req.params;
            const task = await taskService.getTaskWithLinkedData(taskId);

            return res.status(200).json({
                success: true,
                data: task
            });
        } catch (error) {
            console.error('TaskController - Error fetching task with linked data:', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new TaskController(); 