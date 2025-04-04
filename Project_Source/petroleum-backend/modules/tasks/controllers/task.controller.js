const taskService = require('../services/task.service');

class TaskController {
    async getUserTasks(req, res) {
        try {
            console.log('Getting tasks for user with ID:', req.user.id);
            const tasks = await taskService.getUserTasks(req.user.id);
            res.json(tasks);
        } catch (error) {
            console.error('Error in getUserTasks:', error);
            res.status(500).json({ message: error.message });
        }
    }

    async updateTaskStatus(req, res) {
        try {
            const { taskId } = req.params;
            const { status } = req.body;

            const task = await taskService.updateTaskStatus(taskId, status);
            res.json(task);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async deleteTask(req, res) {
        try {
            const { taskId } = req.params;
            await taskService.deleteTask(taskId);
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new TaskController(); 