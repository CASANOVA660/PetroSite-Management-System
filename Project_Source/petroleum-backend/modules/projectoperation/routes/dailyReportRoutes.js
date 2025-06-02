const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const dailyReportController = require('../controllers/dailyReportController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const reportValidation = [
    body('date').isISO8601().withMessage('Date invalide'),
    body('activities').isArray().withMessage('Les activités doivent être un tableau'),
    body('activities.*.description').notEmpty().withMessage('La description de l\'activité est requise'),
    body('healthAndSafety.incidents').optional().isNumeric().withMessage('Le nombre d\'incidents doit être un nombre'),
    body('healthAndSafety.nearMisses').optional().isNumeric().withMessage('Le nombre de quasi-accidents doit être un nombre')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/projects/:projectId/operation/reports
 * @desc    Get all daily reports for a project
 * @access  Private
 */
router.get('/:projectId/operation/reports', dailyReportController.getProjectDailyReports);

/**
 * @route   GET /api/projects/:projectId/operation/reports/:reportId
 * @desc    Get a specific daily report by ID
 * @access  Private
 */
router.get('/:projectId/operation/reports/:reportId', dailyReportController.getDailyReportById);

/**
 * @route   POST /api/projects/:projectId/operation/reports
 * @desc    Create a new daily report
 * @access  Private
 */
router.post('/:projectId/operation/reports', reportValidation, dailyReportController.createDailyReport);

/**
 * @route   PUT /api/projects/:projectId/operation/reports/:reportId
 * @desc    Update a daily report
 * @access  Private
 */
router.put('/:projectId/operation/reports/:reportId', reportValidation, dailyReportController.updateDailyReport);

/**
 * @route   DELETE /api/projects/:projectId/operation/reports/:reportId
 * @desc    Delete a daily report
 * @access  Private
 */
router.delete('/:projectId/operation/reports/:reportId', dailyReportController.deleteDailyReport);

module.exports = router; 