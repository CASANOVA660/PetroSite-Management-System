const cron = require('node-cron');
const taskService = require('../modules/tasks/services/task.service');

// Initialize and configure cron jobs
const initCronJobs = () => {
    console.log('Initializing cron jobs...');

    // Archive completed tasks that are older than 24 hours (runs at midnight every day)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily task archiving job');
        try {
            // Archive tasks completed more than 1 day ago
            const archivedCount = await taskService.archiveOldTasks(1);
            console.log(`${new Date().toISOString()} - Successfully archived ${archivedCount} old tasks`);
        } catch (error) {
            console.error(`${new Date().toISOString()} - Error running task archiving job:`, error);
        }
    });

    console.log('Cron jobs initialized successfully');
};

module.exports = { initCronJobs }; 