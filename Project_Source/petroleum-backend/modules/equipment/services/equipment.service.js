const Equipment = require('../models/equipment.model');
const EquipmentHistory = require('../models/history.model');
// const redis = require('../../../config/redis'); // REMOVE CACHE
const logger = require('../../../utils/logger');

class EquipmentService {
    // Redis cache TTL in seconds
    // static CACHE_TTL = 300; // 5 minutes

    // Create a new equipment
    async createEquipment(equipmentData, userId) {
        try {
            logger.info('Creating new equipment', {
                equipment: equipmentData.nom,
                reference: equipmentData.reference
            });

            const equipment = new Equipment({
                ...equipmentData,
                createdBy: userId
            });

            await equipment.save();
            logger.info('Equipment created successfully', { id: equipment._id });

            // Invalidate equipment list cache
            // await this._invalidateListCache(); // REMOVE CACHE

            return equipment;
        } catch (error) {
            logger.error('Error creating equipment', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Get all equipment with pagination and filters
    async getAllEquipment(filters = {}, options = {}) {
        try {
            const { status, location, search } = filters;
            const { page = 1, limit = 50, sort = '-createdAt' } = options;

            // Build query
            const query = {};

            if (status) {
                query.status = status;
            }

            if (location) {
                query.location = location;
            }

            if (search) {
                query.$or = [
                    { nom: { $regex: search, $options: 'i' } },
                    { reference: { $regex: search, $options: 'i' } },
                    { matricule: { $regex: search, $options: 'i' } }
                ];
            }

            // Calculate pagination
            const skip = (page - 1) * limit;

            // Execute query with pagination
            const equipmentList = await Equipment.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'nom prenom')
                .lean();

            // Get total count for pagination
            const total = await Equipment.countDocuments(query);

            const result = {
                data: equipmentList,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            };

            return result;
        } catch (error) {
            logger.error('Error fetching equipment list', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Get equipment by ID with its history
    async getEquipmentById(equipmentId) {
        try {
            // Fetch equipment with creator info
            const equipment = await Equipment.findById(equipmentId)
                .populate('createdBy', 'nom prenom')
                .lean();

            if (!equipment) {
                logger.warn('Equipment not found', { id: equipmentId });
                return null;
            }

            return equipment;
        } catch (error) {
            logger.error('Error fetching equipment by ID', {
                id: equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Update equipment by ID
    async updateEquipment(equipmentId, updateData) {
        try {
            logger.info('Updating equipment', { id: equipmentId });

            const equipment = await Equipment.findByIdAndUpdate(
                equipmentId,
                updateData,
                { new: true, runValidators: true }
            ).populate('createdBy', 'nom prenom');

            if (!equipment) {
                logger.warn('Equipment not found for update', { id: equipmentId });
                return null;
            }

            logger.info('Equipment updated successfully', { id: equipmentId });
            return equipment;
        } catch (error) {
            logger.error('Error updating equipment', {
                id: equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Delete equipment by ID
    async deleteEquipment(equipmentId) {
        try {
            logger.info('Deleting equipment', { id: equipmentId });

            const equipment = await Equipment.findByIdAndDelete(equipmentId);

            if (!equipment) {
                logger.warn('Equipment not found for deletion', { id: equipmentId });
                return null;
            }

            // Delete all history entries for this equipment
            await EquipmentHistory.deleteMany({ equipmentId });

            logger.info('Equipment and history deleted successfully', { id: equipmentId });
            return equipment;
        } catch (error) {
            logger.error('Error deleting equipment', {
                id: equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Add history entry
    async addHistoryEntry(historyData, userId) {
        try {
            logger.info('Adding equipment history entry', {
                equipmentId: historyData.equipmentId,
                type: historyData.type
            });

            const historyEntry = new EquipmentHistory({
                ...historyData,
                createdBy: userId
            });

            await historyEntry.save();

            // If this is a placement history and there's a location, update the equipment location
            if (historyData.type === 'placement' && historyData.location) {
                await Equipment.findByIdAndUpdate(
                    historyData.equipmentId,
                    { location: historyData.location }
                );
            }

            logger.info('History entry added successfully', { id: historyEntry._id });
            return historyEntry;
        } catch (error) {
            logger.error('Error adding history entry', {
                equipmentId: historyData.equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Get equipment history
    async getEquipmentHistory(equipmentId, type = null) {
        try {
            // Build query
            const query = { equipmentId };
            if (type) {
                query.type = type;
            }

            // Get history sorted by date (newest first)
            const history = await EquipmentHistory.find(query)
                .sort({ fromDate: -1 })
                .populate('createdBy', 'nom prenom')
                .lean();

            return history;
        } catch (error) {
            logger.error('Error fetching equipment history', {
                equipmentId,
                type: type || 'all',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new EquipmentService(); 