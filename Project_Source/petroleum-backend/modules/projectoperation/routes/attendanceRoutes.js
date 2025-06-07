const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../../../modules/middleware/auth');

// Get all attendance records for a project (with date filter)
router.get('/:projectId/attendance', authenticateToken, attendanceController.getProjectAttendance);

// Create a new attendance record
router.post('/:projectId/attendance', authenticateToken, attendanceController.createAttendance);

// Update an attendance record
router.put('/attendance/:attendanceId', authenticateToken, attendanceController.updateAttendance);

// Delete an attendance record
router.delete('/:projectId/attendance/:attendanceId', authenticateToken, attendanceController.deleteAttendance);

module.exports = router; 