const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../../../middleware/auth');

// Get all daily reports for a project
router.get('/:projectId/reports', authMiddleware, reportController.getProjectReports);

// Get a specific daily report
router.get('/reports/:reportId', authMiddleware, reportController.getReportById);

// Create a new daily report
router.post('/:projectId/reports', authMiddleware, reportController.createReport);

// Update a daily report
router.put('/reports/:reportId', authMiddleware, reportController.updateReport);

// Delete a daily report
router.delete('/reports/:reportId', authMiddleware, reportController.deleteReport);

// Submit a report for approval
router.post('/reports/:reportId/submit', authMiddleware, reportController.submitReport);

// Approve a report (manager only)
router.post('/reports/:reportId/approve', authMiddleware, reportController.approveReport);

// Reject a report (manager only)
router.post('/reports/:reportId/reject', authMiddleware, reportController.rejectReport);

module.exports = router; 