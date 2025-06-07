const mongoose = require('mongoose');
const asyncHandler = require('../../../middleware/async');
const DailyReport = require('../models/dailyReportModel');

/**
 * Get all daily reports for a specific project
 * @route GET /api/projects/:projectId/reports
 * @access Private
 */
const getProjectReports = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { date, status } = req.query;

    // Build the query object
    const queryObject = { projectId };

    // Add date filter if provided
    if (date) {
        queryObject.date = date;
    }

    // Add status filter if provided
    if (status && status !== 'all') {
        queryObject.status = status;
    }

    const reports = await DailyReport.find(queryObject)
        .sort({ date: -1 })
        .populate('createdBy', 'name');

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

/**
 * Get a specific report by ID
 * @route GET /api/projects/reports/:reportId
 * @access Private
 */
const getReportById = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    const report = await DailyReport.findById(reportId)
        .populate('createdBy', 'name');

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

/**
 * Create a new daily report
 * @route POST /api/projects/:projectId/reports
 * @access Private
 */
const createReport = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    // Create the report
    const report = await DailyReport.create({
        ...req.body,
        projectId,
        createdBy: req.user.id,
        status: 'draft'
    });

    res.status(201).json({
        success: true,
        data: report
    });
});

/**
 * Update a daily report
 * @route PUT /api/projects/reports/:reportId
 * @access Private
 */
const updateReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    // Find the report
    let report = await DailyReport.findById(reportId);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user is the creator or a manager
    if (report.createdBy.toString() !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(403);
        throw new Error('Not authorized to update this report');
    }

    // Prevent updating if report is already approved
    if (report.status === 'approved' && req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(400);
        throw new Error('Cannot update an approved report');
    }

    // Update the report
    report = await DailyReport.findByIdAndUpdate(
        reportId,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: report
    });
});

/**
 * Delete a daily report
 * @route DELETE /api/projects/reports/:reportId
 * @access Private
 */
const deleteReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    // Find the report
    const report = await DailyReport.findById(reportId);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user is the creator or a manager
    if (report.createdBy.toString() !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(403);
        throw new Error('Not authorized to delete this report');
    }

    // Delete the report
    await report.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * Submit a report for approval
 * @route POST /api/projects/reports/:reportId/submit
 * @access Private
 */
const submitReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    // Find the report
    let report = await DailyReport.findById(reportId);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Check if user is the creator
    if (report.createdBy.toString() !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(403);
        throw new Error('Not authorized to submit this report');
    }

    // Update the report status
    report.status = 'submitted';
    report.submittedAt = Date.now();
    await report.save();

    res.status(200).json({
        success: true,
        data: report
    });
});

/**
 * Approve a report (manager only)
 * @route POST /api/projects/reports/:reportId/approve
 * @access Private/Manager
 */
const approveReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    // Check if user is a manager
    if (req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(403);
        throw new Error('Not authorized to approve reports');
    }

    // Find the report
    const report = await DailyReport.findById(reportId);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Update the report status
    report.status = 'approved';
    await report.save();

    res.status(200).json({
        success: true,
        data: report
    });
});

/**
 * Reject a report (manager only)
 * @route POST /api/projects/reports/:reportId/reject
 * @access Private/Manager
 */
const rejectReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { rejectionReason } = req.body;

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
        res.status(400);
        throw new Error('Invalid report ID');
    }

    // Check if user is a manager
    if (req.user.role !== 'manager' && req.user.role !== 'Manager') {
        res.status(403);
        throw new Error('Not authorized to reject reports');
    }

    // Find the report
    const report = await DailyReport.findById(reportId);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Update the report status
    report.status = 'rejected';
    if (rejectionReason) {
        report.notes = report.notes ? `${report.notes}\n\nRejection reason: ${rejectionReason}` : `Rejection reason: ${rejectionReason}`;
    }
    await report.save();

    res.status(200).json({
        success: true,
        data: report
    });
});

module.exports = {
    getProjectReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    submitReport,
    approveReport,
    rejectReport
}; 