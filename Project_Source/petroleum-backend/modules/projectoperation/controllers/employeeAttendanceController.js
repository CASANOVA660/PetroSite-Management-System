const { validationResult } = require('express-validator');
const employeeAttendanceService = require('../services/employeeAttendanceService');
const logger = require('../../../utils/logger');

/**
 * Get attendance records for a project
 */
exports.getProjectAttendance = async (req, res) => {
    try {
        const { projectId } = req.params;
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            employeeId: req.query.employeeId,
            status: req.query.status
        };

        const attendance = await employeeAttendanceService.getProjectAttendance(projectId, filters);
        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        logger.error(`Error in getProjectAttendance controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Record employee attendance
 */
exports.recordAttendance = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { projectId } = req.params;
        const userId = req.user._id;
        const attendance = await employeeAttendanceService.recordAttendance(projectId, req.body, userId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-attendance-update', {
                action: 'recorded',
                attendance: attendance
            });
        }

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        logger.error(`Error in recordAttendance controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update attendance record
 */
exports.updateAttendance = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { attendanceId } = req.params;
        const attendance = await employeeAttendanceService.updateAttendance(attendanceId, req.body);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(attendance.projectId.toString()).emit('project-attendance-update', {
                action: 'updated',
                attendance: attendance
            });
        }

        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        logger.error(`Error in updateAttendance controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete attendance record
 */
exports.deleteAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const result = await employeeAttendanceService.deleteAttendance(attendanceId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(req.params.projectId).emit('project-attendance-update', {
                action: 'deleted',
                attendanceId: attendanceId
            });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        logger.error(`Error in deleteAttendance controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 