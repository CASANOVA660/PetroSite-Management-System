const { validationResult } = require('express-validator');
const operationEquipmentService = require('../services/operationEquipmentService');
const logger = require('../../../utils/logger');

/**
 * Get all operation equipment for a project
 */
exports.getProjectOperationEquipment = async (req, res) => {
    try {
        const { projectId } = req.params;
        const filters = {
            status: req.query.status
        };

        const equipment = await operationEquipmentService.getProjectOperationEquipment(projectId, filters);
        res.status(200).json({ success: true, data: equipment });
    } catch (error) {
        logger.error(`Error in getProjectOperationEquipment controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Add equipment to operation
 */
exports.addOperationEquipment = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { projectId } = req.params;
        const userId = req.user._id;
        const equipment = await operationEquipmentService.addOperationEquipment(projectId, req.body, userId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-equipment-update', {
                action: 'added',
                equipment: equipment
            });
        }

        res.status(201).json({ success: true, data: equipment });
    } catch (error) {
        logger.error(`Error in addOperationEquipment controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update operation equipment
 */
exports.updateOperationEquipment = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { operationEquipmentId } = req.params;
        const equipment = await operationEquipmentService.updateOperationEquipment(operationEquipmentId, req.body);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(equipment.projectId.toString()).emit('project-equipment-update', {
                action: 'updated',
                equipment: equipment
            });
        }

        res.status(200).json({ success: true, data: equipment });
    } catch (error) {
        logger.error(`Error in updateOperationEquipment controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Remove equipment from operation
 */
exports.removeOperationEquipment = async (req, res) => {
    try {
        const { operationEquipmentId } = req.params;
        const result = await operationEquipmentService.removeOperationEquipment(operationEquipmentId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(req.params.projectId).emit('project-equipment-update', {
                action: 'removed',
                operationEquipmentId: operationEquipmentId
            });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        logger.error(`Error in removeOperationEquipment controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 