const { validationResult } = require('express-validator');
const dailyReportService = require('../services/dailyReportService');
const logger = require('../../../utils/logger');

/**
 * Get all daily reports for a project
 */
exports.getProjectDailyReports = async (req, res) => {
    try {
        const { projectId } = req.params;
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const reports = await dailyReportService.getProjectDailyReports(projectId, filters);
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        logger.error(`Error in getProjectDailyReports controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get a specific daily report by ID
 */
exports.getDailyReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await dailyReportService.getDailyReportById(reportId);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        logger.error(`Error in getDailyReportById controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new daily report
 */
exports.createDailyReport = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { projectId } = req.params;
        const userId = req.user._id;
        const report = await dailyReportService.createDailyReport(projectId, req.body, userId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-report-update', {
                action: 'created',
                report: report
            });
        }

        res.status(201).json({ success: true, data: report });
    } catch (error) {
        logger.error(`Error in createDailyReport controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a daily report
 */
exports.updateDailyReport = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { reportId } = req.params;
        const report = await dailyReportService.updateDailyReport(reportId, req.body);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(report.projectId.toString()).emit('project-report-update', {
                action: 'updated',
                report: report
            });
        }

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        logger.error(`Error in updateDailyReport controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a daily report
 */
exports.deleteDailyReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const result = await dailyReportService.deleteDailyReport(reportId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(req.params.projectId).emit('project-report-update', {
                action: 'deleted',
                reportId: reportId
            });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        logger.error(`Error in deleteDailyReport controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 