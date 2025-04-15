const Task = require('../models/task.model');
const { createNotification } = require('../../notifications/controllers/notificationController');

class TaskService {
    async createTask(taskData) {
        try {
            console.log('Creating new task with data:', taskData);
            const task = new Task(taskData);
            await task.save();

            const populatedTask = await Task.findById(task._id)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('actionId');

            console.log('Task created successfully:', populatedTask);
            return populatedTask;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async getUserTasks(userId) {
        try {
            console.log('Fetching tasks for user:', userId);
            if (!userId) {
                console.error('No user ID provided');
                throw new Error('User ID is required');
            }

            const tasks = await Task.find({
                $or: [
                    { assignee: userId },
                    { creator: userId }
                ]
            })
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom')
                .populate('actionId')
                .sort('-createdAt');

            console.log('Found tasks count:', tasks.length);

            const categorizedTasks = {
                todo: tasks.filter(t => t.status === 'todo'),
                inProgress: tasks.filter(t => t.status === 'inProgress'),
                done: tasks.filter(t => t.status === 'done')
            };

            console.log('Tasks categorized:', {
                todoCount: categorizedTasks.todo.length,
                inProgressCount: categorizedTasks.inProgress.length,
                doneCount: categorizedTasks.done.length
            });

            return categorizedTasks;
        } catch (error) {
            console.error('Error fetching user tasks:', error);
            throw error;
        }
    }

    async updateTaskStatus(taskId, status) {
        try {
            console.log('Updating task status:', { taskId, status });
            const task = await Task.findById(taskId)
                .populate('assignee', 'nom prenom')
                .populate('creator', 'nom prenom');

            if (!task) {
                console.error('Task not found:', taskId);
                throw new Error('Task not found');
            }

            task.status = status;
            task.progress = status === 'done' ? 100 : status === 'inProgress' ? 50 : 0;
            await task.save();

            console.log('Task status updated successfully:', task);

            // If task is from an action and is completed, notify creator


            return task;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            const task = await Task.findById(taskId);
            if (!task) throw new Error('Task not found');

            await Task.findByIdAndDelete(taskId);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new TaskService(); 