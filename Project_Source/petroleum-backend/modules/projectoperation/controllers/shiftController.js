const { validationResult } = require('express-validator');
const shiftService = require('../services/shiftService');
const logger = require('../../../utils/logger');

/**
 * Get all shifts for a project
 */
exports.getProjectShifts = async (req, res) => {
    try {
        const { projectId } = req.params;
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            employeeId: req.query.employeeId,
            type: req.query.type,
            status: req.query.status
        };

        const shifts = await shiftService.getProjectShifts(projectId, filters);
        res.status(200).json({ success: true, data: shifts });
    } catch (error) {
        logger.error(`Error in getProjectShifts controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create a new shift
 */
exports.createShift = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { projectId } = req.params;
        const userId = req.user._id;

        console.log('Creating shift with data:', {
            projectId,
            userId,
            body: req.body
        });

        const shift = await shiftService.createShift(projectId, req.body, userId);
        console.log('Shift created successfully:', shift);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-shift-update', {
                action: 'created',
                shift: shift
            });
            console.log('Socket event emitted for shift creation');
        }

        res.status(201).json({ success: true, data: shift });
    } catch (error) {
        console.error(`Error in createShift controller:`, error);
        logger.error(`Error in createShift controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update a shift
 */
exports.updateShift = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { shiftId } = req.params;
        const shift = await shiftService.updateShift(shiftId, req.body);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(shift.projectId.toString()).emit('project-shift-update', {
                action: 'updated',
                shift: shift
            });
        }

        res.status(200).json({ success: true, data: shift });
    } catch (error) {
        logger.error(`Error in updateShift controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a shift
 */
exports.deleteShift = async (req, res) => {
    try {
        const { shiftId } = req.params;
        const result = await shiftService.deleteShift(shiftId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(req.params.projectId).emit('project-shift-update', {
                action: 'deleted',
                shiftId: shiftId
            });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        logger.error(`Error in deleteShift controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 