const Equipment = require('../models/equipment.model');
const EquipmentHistory = require('../models/history.model');
const redis = require('../../../config/redis');
const logger = require('../../../utils/logger');

class EquipmentService {
    // Redis cache TTL in seconds
    static CACHE_TTL = 300; // 5 minutes

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
            await this._invalidateListCache();

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

            // Create a unique cache key based on the query parameters
            const cacheKey = `equipment:list:${status || 'all'}:${location || 'all'}:${search || 'none'}:${page}:${limit}:${sort}`;

            // Try to get from cache first
            const cachedResult = await redis.get(cacheKey);
            if (cachedResult) {
                logger.info('Equipment list retrieved from cache', { cacheKey });
                return JSON.parse(cachedResult);
            }

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

            // Cache the result
            await redis.set(cacheKey, JSON.stringify(result), 'EX', EquipmentService.CACHE_TTL);
            logger.info('Equipment list cached', { cacheKey, ttl: EquipmentService.CACHE_TTL });

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
            const cacheKey = `equipment:${equipmentId}`;

            // Try to get from cache first
            const cachedEquipment = await redis.get(cacheKey);
            if (cachedEquipment) {
                logger.info('Equipment retrieved from cache', { id: equipmentId });
                return JSON.parse(cachedEquipment);
            }

            // Fetch equipment with creator info
            const equipment = await Equipment.findById(equipmentId)
                .populate('createdBy', 'nom prenom')
                .lean();

            if (!equipment) {
                logger.warn('Equipment not found', { id: equipmentId });
                return null;
            }

            // Cache the result
            await redis.set(cacheKey, JSON.stringify(equipment), 'EX', EquipmentService.CACHE_TTL);
            logger.info('Equipment cached', { id: equipmentId, ttl: EquipmentService.CACHE_TTL });

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

            // Invalidate caches
            await this._invalidateCache(equipmentId);

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

            // Invalidate caches
            await this._invalidateCache(equipmentId);

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

                // Invalidate equipment cache
                await this._invalidateCache(historyData.equipmentId);
            }

            // Invalidate history cache
            await this._invalidateHistoryCache(historyData.equipmentId);

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
            const cacheKey = `equipment:${equipmentId}:history${type ? `:${type}` : ''}`;

            // Try to get from cache first
            const cachedHistory = await redis.get(cacheKey);
            if (cachedHistory) {
                logger.info('Equipment history retrieved from cache', {
                    equipmentId,
                    type: type || 'all'
                });
                return JSON.parse(cachedHistory);
            }

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

            // Cache the result
            await redis.set(cacheKey, JSON.stringify(history), 'EX', EquipmentService.CACHE_TTL);
            logger.info('Equipment history cached', {
                equipmentId,
                type: type || 'all',
                ttl: EquipmentService.CACHE_TTL
            });

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

    // Helper to invalidate equipment cache
    async _invalidateCache(equipmentId) {
        try {
            // Delete equipment detail cache
            await redis.del(`equipment:${equipmentId}`);

            // Delete equipment history cache (all types)
            await redis.del(`equipment:${equipmentId}:history`);

            // Delete specific history type caches
            await redis.del(`equipment:${equipmentId}:history:placement`);
            await redis.del(`equipment:${equipmentId}:history:operation`);
            await redis.del(`equipment:${equipmentId}:history:maintenance`);

            // Invalidate list cache (pattern match)
            await this._invalidateListCache();

            logger.info('Equipment cache invalidated', { id: equipmentId });
        } catch (error) {
            logger.error('Error invalidating equipment cache', {
                id: equipmentId,
                error: error.message
            });
        }
    }

    // Helper to invalidate only history cache
    async _invalidateHistoryCache(equipmentId) {
        try {
            // Delete equipment history cache (all types)
            await redis.del(`equipment:${equipmentId}:history`);

            // Delete specific history type caches
            await redis.del(`equipment:${equipmentId}:history:placement`);
            await redis.del(`equipment:${equipmentId}:history:operation`);
            await redis.del(`equipment:${equipmentId}:history:maintenance`);

            logger.info('Equipment history cache invalidated', { id: equipmentId });
        } catch (error) {
            logger.error('Error invalidating equipment history cache', {
                id: equipmentId,
                error: error.message
            });
        }
    }

    // Helper to invalidate list cache using pattern
    async _invalidateListCache() {
        try {
            // Get all keys matching the pattern
            const keys = await redis.keys('equipment:list:*');

            if (keys.length > 0) {
                // Delete all matching keys
                await redis.del(...keys);
                logger.info('Equipment list cache invalidated', { count: keys.length });
            }
        } catch (error) {
            logger.error('Error invalidating equipment list cache', {
                error: error.message
            });
        }
    }
}

module.exports = new EquipmentService(); 