const equipmentService = require('../services/equipment.service');
const logger = require('../../../utils/logger');
const { createNotification } = require('../../notifications/controllers/notificationController');
const mongoose = require('mongoose');
const { EQUIPMENT_STATUS, ACTIVITY_TYPE } = require('../models/equipment.model');

// Create a new equipment
const createEquipment = async (req, res) => {
    try {
        const equipment = await equipmentService.createEquipment(req.body, req.user._id);

        // Send notification to manager
        try {
            const managerRole = 'Manager';
            // Create a notification for equipment creation
            await createNotification({
                type: 'EQUIPMENT_CREATION',
                message: `Un nouvel équipement a été ajouté: ${equipment.nom} (${equipment.reference})`,
                role: managerRole,
                isRead: false
            });

            // Emit socket event for real-time table update if socket.io is available
            if (global.io) {
                global.io.emit('equipmentUpdate', {
                    action: 'create',
                    equipment
                });
            }
        } catch (notifError) {
            logger.error('Error creating notification for equipment creation', {
                error: notifError.message,
                equipmentId: equipment._id
            });
            // Don't fail the whole request if notification fails
        }

        res.status(201).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error('Controller - Error creating equipment', { error: error.message });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.message
            });
        }

        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                success: false,
                error: 'Duplication Error',
                details: 'Un équipement avec cette référence ou ce matricule existe déjà'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Get all equipment with pagination and filters
const getAllEquipment = async (req, res) => {
    try {
        // Extract filters from query parameters
        const filters = {
            status: req.query.status,
            location: req.query.location,
            search: req.query.search
        };

        // Extract pagination and sorting options
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sort: req.query.sort || '-createdAt'
        };

        // Add include parameter if present
        if (req.query.include) {
            options.include = req.query.include.split(',');
        }

        const result = await equipmentService.getAllEquipment(filters, options);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Controller - Error fetching equipment list', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Get equipment by ID
const getEquipmentById = async (req, res) => {
    try {
        const equipment = await equipmentService.getEquipmentById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                details: 'Équipement non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error('Controller - Error fetching equipment by ID', {
            id: req.params.id,
            error: error.message
        });

        // Handle cast error (invalid ID format)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Update equipment by ID
const updateEquipment = async (req, res) => {
    try {
        const equipment = await equipmentService.updateEquipment(req.params.id, req.body, req.user._id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                details: 'Équipement non trouvé'
            });
        }

        // Emit socket event for real-time table update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'update',
                equipment
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error('Controller - Error updating equipment', {
            id: req.params.id,
            error: error.message
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.message
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                success: false,
                error: 'Duplication Error',
                details: 'Un équipement avec cette référence ou ce matricule existe déjà'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Delete equipment by ID
const deleteEquipment = async (req, res) => {
    try {
        const equipment = await equipmentService.deleteEquipment(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                details: 'Équipement non trouvé'
            });
        }

        // Emit socket event for real-time table update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'delete',
                equipmentId: req.params.id
            });
        }

        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error('Controller - Error deleting equipment', {
            id: req.params.id,
            error: error.message
        });

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Add equipment history entry
const addHistoryEntry = async (req, res) => {
    try {
        // First check if equipment exists
        const equipment = await equipmentService.getEquipmentById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                details: 'Équipement non trouvé'
            });
        }

        // Add the equipment ID to the history data
        const historyData = {
            ...req.body,
            equipmentId: req.params.id
        };

        // Check if description contains a project ID and try to get project name
        if (historyData.description && historyData.description.includes('pour ')) {
            const projectIdMatch = historyData.description.match(/pour\s+([a-f0-9]{24})/i);
            if (projectIdMatch && projectIdMatch[1]) {
                try {
                    const Project = mongoose.model('Project');
                    const projectId = projectIdMatch[1];

                    // Handle specific project IDs - for immediate fix
                    if (projectId === '684d98f0fba24b9f7a6ff18a') {
                        historyData.description = historyData.description.replace(
                            projectId,
                            'Projet Test'
                        );

                        if (historyData.reason && historyData.reason.includes(projectId)) {
                            historyData.reason = historyData.reason.replace(
                                projectId,
                                'Projet Test'
                            );
                        }
                    } else {
                        const project = await Project.findById(projectId).select('name').lean();

                        if (project) {
                            // Replace project ID with project name in description
                            historyData.description = historyData.description.replace(
                                projectId,
                                project.name
                            );

                            // Also update reason if it contains the project ID
                            if (historyData.reason && historyData.reason.includes(projectId)) {
                                historyData.reason = historyData.reason.replace(
                                    projectId,
                                    project.name
                                );
                            }
                        }
                    }
                } catch (error) {
                    logger.warn('Failed to replace project ID with name', {
                        error: error.message,
                        description: historyData.description
                    });
                    // Continue with original description if project lookup fails
                }
            }
        }

        const historyEntry = await equipmentService.addHistoryEntry(historyData, req.user._id);

        // Update status if it's a maintenance entry
        if (req.body.type === 'maintenance') {
            // Update equipment status based on maintenance details
            const statusUpdate = {};

            if (req.body.toDate) {
                // Maintenance is completed
                statusUpdate.status = 'disponible_bon_etat';
            } else {
                // Ongoing maintenance
                statusUpdate.status = 'on_repair';
            }

            if (Object.keys(statusUpdate).length > 0) {
                await equipmentService.updateEquipment(req.params.id, statusUpdate);

                // Emit update event
                if (global.io) {
                    global.io.emit('equipmentUpdate', {
                        action: 'statusChange',
                        equipmentId: req.params.id,
                        newStatus: statusUpdate.status
                    });
                }
            }
        }

        // Similar for operation history - update status
        if (req.body.type === 'operation') {
            // If operation has no end date, equipment is in use
            if (!req.body.toDate) {
                await equipmentService.updateEquipment(req.params.id, {
                    status: 'working_non_disponible'
                });

                // Emit update event
                if (global.io) {
                    global.io.emit('equipmentUpdate', {
                        action: 'statusChange',
                        equipmentId: req.params.id,
                        newStatus: 'working_non_disponible'
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            data: historyEntry
        });
    } catch (error) {
        logger.error('Controller - Error adding history entry', {
            equipmentId: req.params.id,
            error: error.message
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.message
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Get equipment history
const getEquipmentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        // First check if equipment exists
        const equipment = await equipmentService.getEquipmentById(id);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Not Found',
                details: 'Équipement non trouvé'
            });
        }

        const history = await equipmentService.getEquipmentHistory(id, type);

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Controller - Error fetching equipment history', {
            id: req.params.id,
            type: req.query.type,
            error: error.message
        });

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Schedule an activity for equipment
const scheduleActivity = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        // Validate required fields
        const { type, startDate, endDate } = req.body;
        if (!type || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: 'Le type, la date de début et la date de fin sont requis'
            });
        }

        const result = await equipmentService.scheduleActivity(
            req.params.id,
            req.body,
            req.user._id
        );

        // Emit socket event for real-time update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'activityScheduled',
                equipmentId: req.params.id
            });
        }

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Controller - Error scheduling activity', {
            equipmentId: req.params.id,
            error: error.message
        });

        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('non trouvé')) {
            statusCode = 404;
        } else if (error.message.includes('déjà une activité') ||
            error.message.includes('n\'est pas disponible') ||
            error.message.includes('ne peut pas être')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            error: 'Error',
            details: errorMessage
        });
    }
};

// Start a scheduled activity
const startActivity = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id) ||
            !mongoose.Types.ObjectId.isValid(req.params.activityId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        const activity = await equipmentService.startActivity(
            req.params.id,
            req.params.activityId,
            req.user._id
        );

        // Emit socket event for real-time update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'activityStarted',
                equipmentId: req.params.id,
                activityId: req.params.activityId
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        logger.error('Controller - Error starting activity', {
            equipmentId: req.params.id,
            activityId: req.params.activityId,
            error: error.message
        });

        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('non trouvée')) {
            statusCode = 404;
        } else if (error.message.includes('déjà commencée')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            error: 'Error',
            details: errorMessage
        });
    }
};

// Complete an activity
const completeActivity = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id) ||
            !mongoose.Types.ObjectId.isValid(req.params.activityId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        const activity = await equipmentService.completeActivity(
            req.params.id,
            req.params.activityId,
            req.user._id
        );

        // Emit socket event for real-time update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'activityCompleted',
                equipmentId: req.params.id,
                activityId: req.params.activityId
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        logger.error('Controller - Error completing activity', {
            equipmentId: req.params.id,
            activityId: req.params.activityId,
            error: error.message
        });

        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('non trouvée')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            error: 'Error',
            details: errorMessage
        });
    }
};

// Cancel an activity
const cancelActivity = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id) ||
            !mongoose.Types.ObjectId.isValid(req.params.activityId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        const activity = await equipmentService.cancelActivity(
            req.params.id,
            req.params.activityId,
            req.user._id,
            req.body.reason
        );

        // Emit socket event for real-time update if socket.io is available
        if (global.io) {
            global.io.emit('equipmentUpdate', {
                action: 'activityCancelled',
                equipmentId: req.params.id,
                activityId: req.params.activityId
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        logger.error('Controller - Error cancelling activity', {
            equipmentId: req.params.id,
            activityId: req.params.activityId,
            error: error.message
        });

        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('non trouvée')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            error: 'Error',
            details: errorMessage
        });
    }
};

// Check equipment availability
const checkAvailability = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: 'Les dates de début et de fin sont requises'
            });
        }

        const result = await equipmentService.checkAvailability(
            req.params.id,
            new Date(startDate),
            new Date(endDate)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Controller - Error checking availability', {
            equipmentId: req.params.id,
            error: error.message
        });

        let statusCode = 500;
        let errorMessage = error.message;

        if (error.message.includes('non trouvé')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            error: 'Error',
            details: errorMessage
        });
    }
};

// Get equipment status summary
const getStatusSummary = async (req, res) => {
    try {
        const summary = await equipmentService.getStatusSummary();

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        logger.error('Controller - Error getting status summary', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Get equipment status history
const getStatusHistory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID',
                details: 'Format d\'ID invalide'
            });
        }

        const history = await equipmentService.getEquipmentStatusHistory(req.params.id);

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Controller - Error getting status history', {
            equipmentId: req.params.id,
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

// Get active equipment (with ongoing activities)
const getActiveEquipment = async (req, res) => {
    try {
        const equipment = await equipmentService.getActiveEquipment();

        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        logger.error('Controller - Error getting active equipment', {
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: 'Server Error',
            details: error.message
        });
    }
};

module.exports = {
    createEquipment,
    getAllEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    addHistoryEntry,
    getEquipmentHistory,
    scheduleActivity,
    startActivity,
    completeActivity,
    cancelActivity,
    checkAvailability,
    getStatusSummary,
    getStatusHistory,
    getActiveEquipment
}; 