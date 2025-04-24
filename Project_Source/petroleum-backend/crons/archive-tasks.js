/**
 * Cron job to automatically archive completed tasks that are older than a certain threshold
 */
const cron = require('node-cron');
const taskService = require('../modules/tasks/services/task.service');
const logger = require('../utils/logger');

// Archive completed tasks that are older than 24 hours (runs at midnight every day)
const archiveTasksJob = cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily task archiving job');
    try {
        // Archive tasks completed more than 1 day ago
        const archivedCount = await taskService.archiveOldTasks(1);
        logger.info(`Successfully archived ${archivedCount} old tasks`);
    } catch (error) {
        logger.error('Error running task archiving job:', error);
    }
}, {
    scheduled: true,
    timezone: "Europe/Paris"  // Set to your timezone
});

// Start the job
archiveTasksJob.start();

module.exports = { archiveTasksJob }; 