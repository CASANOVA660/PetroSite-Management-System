const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const employeeAttendanceController = require('../controllers/employeeAttendanceController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const attendanceValidation = [
    body('employeeId').notEmpty().withMessage('L\'identifiant de l\'employé est requis'),
    body('date').isISO8601().withMessage('Date invalide'),
    body('status').optional().isIn(['present', 'absent', 'late', 'excused']).withMessage('Statut invalide'),
    body('checkInTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Format d\'heure d\'arrivée invalide (HH:MM)'),
    body('checkOutTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Format d\'heure de départ invalide (HH:MM)')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/projects/:projectId/operation/attendance
 * @desc    Get attendance records for a project
 * @access  Private
 */
router.get('/:projectId/operation/attendance', employeeAttendanceController.getProjectAttendance);

/**
 * @route   POST /api/projects/:projectId/operation/attendance
 * @desc    Record employee attendance
 * @access  Private
 */
router.post('/:projectId/operation/attendance', attendanceValidation, employeeAttendanceController.recordAttendance);

/**
 * @route   PUT /api/projects/:projectId/operation/attendance/:attendanceId
 * @desc    Update attendance record
 * @access  Private
 */
router.put('/:projectId/operation/attendance/:attendanceId', attendanceValidation, employeeAttendanceController.updateAttendance);

/**
 * @route   DELETE /api/projects/:projectId/operation/attendance/:attendanceId
 * @desc    Delete attendance record
 * @access  Private
 */
router.delete('/:projectId/operation/attendance/:attendanceId', employeeAttendanceController.deleteAttendance);

module.exports = router; 