/**
 * Cron job to automatically archive completed tasks that are older than a certain threshold
 */
const cron = require('node-cron');
const { connectDB } = require('../config/database');
const taskService = require('../modules/tasks/services/task.service');
const logger = require('../utils/logger');

// Connect to the database
connectDB();

// Run every day at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
    try {
        logger.info('Running task archiving cron job');

        // Archive tasks that have been completed for more than 1 day
        const archivedCount = await taskService.archiveOldTasks(1);

        logger.info(`Task archiving completed: ${archivedCount} tasks archived`);
    } catch (error) {
        logger.error('Error in task archiving cron job:', error);
    }
});

logger.info('Task archiving cron job scheduled'); 