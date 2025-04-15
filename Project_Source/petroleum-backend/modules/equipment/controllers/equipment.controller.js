const equipmentService = require('../services/equipment.service');
const logger = require('../../../utils/logger');
const { createNotification } = require('../../notifications/controllers/notificationController');

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
        const equipment = await equipmentService.updateEquipment(req.params.id, req.body);

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

module.exports = {
    createEquipment,
    getAllEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    addHistoryEntry,
    getEquipmentHistory
}; 