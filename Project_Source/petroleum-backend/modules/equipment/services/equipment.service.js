const Equipment = require('../models/equipment.model');
const EquipmentHistory = require('../models/history.model');
const mongoose = require('mongoose');
// const redis = require('../../../config/redis'); // REMOVE CACHE
const logger = require('../../../utils/logger');

const { EQUIPMENT_STATUS, ACTIVITY_TYPE } = Equipment;

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
            logger.info('Fetching equipment list with filters', { filters, options });

            const { status, location, search } = filters;
            const { page = 1, limit = 10, sort = '-createdAt', include = [] } = options;

            // Build query
            const query = { isDeleted: false };

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
            const equipmentQuery = Equipment.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'nom prenom');

            // Include activities if requested
            if (include.includes('activities')) {
                // Populate embedded activities
                equipmentQuery.populate({
                    path: 'activities',
                    match: {
                        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
                    },
                    options: { sort: { startDate: 1 } }
                });

                // Populate external activities from history
                equipmentQuery.populate({
                    path: 'externalActivities',
                    select: 'type description fromDate location responsiblePerson',
                    match: {
                        toDate: { $exists: false },
                        isStatusChange: false
                    },
                    options: { sort: { fromDate: 1 } }
                });
            }

            const equipmentList = await equipmentQuery.lean();

            // Combine embedded and external activities if needed
            if (include.includes('activities')) {
                equipmentList.forEach(equipment => {
                    // Normalize embedded activities format
                    const embeddedActivities = (equipment.activities || []).map(activity => ({
                        id: activity._id,
                        type: activity.type,
                        description: activity.description,
                        startDate: activity.startDate,
                        endDate: activity.endDate,
                        status: activity.status,
                        location: activity.location,
                        isEmbedded: true
                    }));

                    // Normalize external activities format
                    const externalActivities = (equipment.externalActivities || []).map(activity => ({
                        id: activity._id,
                        type: activity.type,
                        description: activity.description,
                        startDate: activity.fromDate,
                        endDate: null, // External activities don't have end dates
                        location: activity.location,
                        responsiblePerson: activity.responsiblePerson,
                        isExternal: true
                    }));

                    // Combine both types of activities
                    equipment.allActivities = [...embeddedActivities, ...externalActivities]
                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                    // Remove the separate arrays to keep the response clean
                    delete equipment.externalActivities;
                });
            }

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
    async updateEquipment(equipmentId, updateData, userId) {
        try {
            logger.info('Updating equipment', { id: equipmentId });

            const equipment = await Equipment.findById(equipmentId);

            if (!equipment) {
                logger.warn('Equipment not found for update', { id: equipmentId });
                return null;
            }

            // Check if status is changing
            const oldStatus = equipment.status;
            const newStatus = updateData.status;

            if (newStatus && oldStatus !== newStatus) {
                // Record status change in history
                await this.recordStatusChange(
                    equipmentId,
                    oldStatus,
                    newStatus,
                    updateData.statusReason || 'Mise à jour manuelle du statut',
                    userId
                );
            }

            // Apply updates
            Object.assign(equipment, updateData, { updatedBy: userId });
            await equipment.save();

            logger.info('Equipment updated successfully', { id: equipmentId });

            // Populate creator info before returning
            await equipment.populate('createdBy', 'nom prenom');
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

            // Update equipment status based on activity type
            const equipment = await Equipment.findById(historyData.equipmentId);
            if (equipment) {
                let statusUpdate = null;

                if (historyData.type === ACTIVITY_TYPE.MAINTENANCE) {
                    // If has end date, maintenance is completed
                    if (historyData.toDate) {
                        statusUpdate = EQUIPMENT_STATUS.AVAILABLE;
                        equipment.lastMaintenanceDate = historyData.toDate;
                    } else {
                        // Ongoing maintenance
                        statusUpdate = EQUIPMENT_STATUS.MAINTENANCE;
                    }
                } else if (historyData.type === ACTIVITY_TYPE.REPAIR) {
                    // If has end date, repair is completed
                    if (historyData.toDate) {
                        statusUpdate = EQUIPMENT_STATUS.AVAILABLE;
                    } else {
                        // Ongoing repair
                        statusUpdate = EQUIPMENT_STATUS.REPAIR;
                    }
                } else if (historyData.type === ACTIVITY_TYPE.OPERATION ||
                    historyData.type === ACTIVITY_TYPE.PLACEMENT) {
                    // If operation has no end date, equipment is in use
                    if (!historyData.toDate) {
                        statusUpdate = EQUIPMENT_STATUS.IN_USE;
                    }
                }

                if (statusUpdate && equipment.status !== statusUpdate) {
                    // Record status change in history
                    await this.recordStatusChange(
                        historyData.equipmentId,
                        equipment.status,
                        statusUpdate,
                        `Changement de statut suite à l'activité: ${historyData.type}`,
                        userId
                    );

                    // Update equipment status
                    equipment.status = statusUpdate;
                    equipment.updatedBy = userId;
                    await equipment.save();
                }
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

    // Get equipment status history
    async getEquipmentStatusHistory(equipmentId) {
        try {
            // Find status change history entries
            const statusHistory = await EquipmentHistory.find({
                equipmentId,
                isStatusChange: true
            })
                .sort({ createdAt: -1 })
                .populate('createdBy', 'nom prenom')
                .lean();

            return statusHistory;
        } catch (error) {
            logger.error('Error fetching equipment status history', {
                equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Record status change in history
    async recordStatusChange(equipmentId, fromStatus, toStatus, reason, userId) {
        try {
            const statusHistory = new EquipmentHistory({
                equipmentId,
                type: 'maintenance', // Using maintenance as a default type for status entries
                isStatusChange: true,
                fromStatus,
                toStatus,
                reason,
                description: `Changement de statut: ${fromStatus} → ${toStatus} - ${reason}`,
                fromDate: new Date(),
                createdBy: userId
            });

            await statusHistory.save();
            logger.info('Status change recorded in history', {
                equipmentId,
                fromStatus,
                toStatus
            });

            return statusHistory;
        } catch (error) {
            logger.error('Error recording status change', {
                equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Schedule an activity for equipment
    async scheduleActivity(equipmentId, activityData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            logger.info('Scheduling activity for equipment', {
                equipmentId,
                type: activityData.type
            });

            // Find equipment
            const equipment = await Equipment.findById(equipmentId).session(session);
            if (!equipment) {
                throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
            }

            const { type, startDate, endDate, description, location, responsiblePerson } = activityData;

            // Check for scheduling conflicts
            if (equipment.hasScheduleConflict(startDate, endDate)) {
                throw new Error('Cet équipement a déjà une activité planifiée pendant cette période');
            }

            // Validate equipment status for this activity type
            if (type === ACTIVITY_TYPE.PLACEMENT &&
                equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
                throw new Error(`L'équipement n'est pas disponible pour un placement (statut actuel: ${equipment.status})`);
            } else if (type === ACTIVITY_TYPE.MAINTENANCE &&
                (equipment.status === EQUIPMENT_STATUS.REPAIR ||
                    equipment.status === EQUIPMENT_STATUS.OUT_OF_SERVICE)) {
                throw new Error(`L'équipement ne peut pas être mis en maintenance (statut actuel: ${equipment.status})`);
            } else if (type === ACTIVITY_TYPE.REPAIR &&
                equipment.status === EQUIPMENT_STATUS.OUT_OF_SERVICE) {
                throw new Error(`L'équipement ne peut pas être réparé (statut actuel: ${equipment.status})`);
            }

            // Create activity
            const newActivity = {
                type,
                startDate,
                endDate,
                description,
                location,
                responsiblePerson,
                status: 'SCHEDULED',
                createdBy: userId
            };

            // Add to equipment activities
            equipment.activities.push(newActivity);
            await equipment.save({ session });

            // Create history entry for the scheduled activity
            const historyEntry = new EquipmentHistory({
                equipmentId,
                type,
                description: description || `Activité de ${type} planifiée`,
                fromDate: startDate,
                toDate: null, // Will be set when completed
                location,
                responsiblePerson,
                activityId: equipment.activities[equipment.activities.length - 1]._id,
                createdBy: userId
            });

            await historyEntry.save({ session });

            await session.commitTransaction();
            session.endSession();

            logger.info('Activity scheduled successfully', { equipmentId, activityId: newActivity._id });

            return {
                equipment,
                activity: equipment.activities[equipment.activities.length - 1],
                historyEntry
            };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Error scheduling activity', {
                equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Start a scheduled activity
    async startActivity(equipmentId, activityId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find equipment
            const equipment = await Equipment.findById(equipmentId).session(session);
            if (!equipment) {
                throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
            }

            // Find activity
            const activityIndex = equipment.activities.findIndex(a =>
                a._id.toString() === activityId && a.status === 'SCHEDULED'
            );

            if (activityIndex === -1) {
                throw new Error('Activité planifiée non trouvée ou déjà commencée');
            }

            const activity = equipment.activities[activityIndex];

            // Determine new status based on activity type
            let newStatus;
            switch (activity.type) {
                case ACTIVITY_TYPE.PLACEMENT:
                case ACTIVITY_TYPE.OPERATION:
                    newStatus = EQUIPMENT_STATUS.IN_USE;
                    break;
                case ACTIVITY_TYPE.MAINTENANCE:
                    newStatus = EQUIPMENT_STATUS.MAINTENANCE;
                    break;
                case ACTIVITY_TYPE.REPAIR:
                    newStatus = EQUIPMENT_STATUS.REPAIR;
                    break;
                default:
                    throw new Error(`Type d'activité non pris en charge: ${activity.type}`);
            }

            // Record status change
            await this.recordStatusChange(
                equipmentId,
                equipment.status,
                newStatus,
                `Début de l'activité: ${activity.type}`,
                userId
            );

            // Update activity status
            equipment.activities[activityIndex].status = 'IN_PROGRESS';
            equipment.activities[activityIndex].actualStartDate = new Date();

            // Update equipment status
            equipment.status = newStatus;
            equipment.updatedBy = userId;

            await equipment.save({ session });

            // Update history entry
            await EquipmentHistory.findOneAndUpdate(
                { equipmentId, activityId: activity._id },
                {
                    $set: {
                        description: `${activity.description || `Activité de ${activity.type}`} (en cours)`
                    }
                }
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            logger.info('Activity started successfully', {
                equipmentId,
                activityId
            });

            return equipment.activities[activityIndex];
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Error starting activity', {
                equipmentId,
                activityId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Complete an activity
    async completeActivity(equipmentId, activityId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find equipment
            const equipment = await Equipment.findById(equipmentId).session(session);
            if (!equipment) {
                throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
            }

            // Find activity
            const activityIndex = equipment.activities.findIndex(a =>
                a._id.toString() === activityId && a.status === 'IN_PROGRESS'
            );

            if (activityIndex === -1) {
                throw new Error('Activité en cours non trouvée');
            }

            const activity = equipment.activities[activityIndex];

            // Update activity status
            equipment.activities[activityIndex].status = 'COMPLETED';
            equipment.activities[activityIndex].actualEndDate = new Date();

            // Record status change to AVAILABLE
            await this.recordStatusChange(
                equipmentId,
                equipment.status,
                EQUIPMENT_STATUS.AVAILABLE,
                `Fin de l'activité: ${activity.type}`,
                userId
            );

            // Update equipment status
            equipment.status = EQUIPMENT_STATUS.AVAILABLE;
            equipment.updatedBy = userId;

            // If maintenance, update last maintenance date
            if (activity.type === ACTIVITY_TYPE.MAINTENANCE) {
                equipment.lastMaintenanceDate = new Date();
            }

            await equipment.save({ session });

            // Update history entry
            await EquipmentHistory.findOneAndUpdate(
                { equipmentId, activityId: activity._id },
                {
                    $set: {
                        toDate: new Date(),
                        description: `${activity.description || `Activité de ${activity.type}`} (terminée)`
                    }
                }
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            logger.info('Activity completed successfully', {
                equipmentId,
                activityId
            });

            return equipment.activities[activityIndex];
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Error completing activity', {
                equipmentId,
                activityId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Cancel an activity
    async cancelActivity(equipmentId, activityId, userId, reason) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find equipment
            const equipment = await Equipment.findById(equipmentId).session(session);
            if (!equipment) {
                throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
            }

            // Find activity
            const activityIndex = equipment.activities.findIndex(a =>
                a._id.toString() === activityId &&
                (a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS')
            );

            if (activityIndex === -1) {
                throw new Error('Activité non trouvée ou déjà terminée/annulée');
            }

            const activity = equipment.activities[activityIndex];

            // If activity is in progress, revert equipment status
            if (activity.status === 'IN_PROGRESS') {
                // Record status change back to AVAILABLE
                await this.recordStatusChange(
                    equipmentId,
                    equipment.status,
                    EQUIPMENT_STATUS.AVAILABLE,
                    `Annulation de l'activité: ${activity.type} - ${reason || 'Non spécifiée'}`,
                    userId
                );

                // Update equipment status
                equipment.status = EQUIPMENT_STATUS.AVAILABLE;
            }

            // Update activity status
            equipment.activities[activityIndex].status = 'CANCELLED';

            await equipment.save({ session });

            // Update history entry
            await EquipmentHistory.findOneAndUpdate(
                { equipmentId, activityId: activity._id },
                {
                    $set: {
                        toDate: new Date(),
                        description: `${activity.description || `Activité de ${activity.type}`} (annulée: ${reason || 'Non spécifiée'})`
                    }
                }
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            logger.info('Activity cancelled successfully', {
                equipmentId,
                activityId
            });

            return equipment.activities[activityIndex];
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Error cancelling activity', {
                equipmentId,
                activityId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Check equipment availability for a specific period
    async checkAvailability(equipmentId, startDate, endDate) {
        try {
            // Find equipment
            const equipment = await Equipment.findById(equipmentId);
            if (!equipment) {
                throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
            }

            // Check if equipment status allows new activities
            if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
                return { isAvailable: false, reason: `Équipement non disponible, statut actuel: ${equipment.status}` };
            }

            // Check for schedule conflicts
            const hasConflict = equipment.hasScheduleConflict(startDate, endDate);

            return {
                isAvailable: !hasConflict,
                reason: hasConflict ? 'Conflit d\'horaire avec une activité existante' : null
            };
        } catch (error) {
            logger.error('Error checking equipment availability', {
                equipmentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Get equipment status summary
    async getStatusSummary() {
        try {
            const summary = await Equipment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Convert to a more user-friendly format
            const result = {};
            for (const status in EQUIPMENT_STATUS) {
                result[EQUIPMENT_STATUS[status]] = 0;
            }

            summary.forEach(item => {
                result[item._id] = item.count;
            });

            return result;
        } catch (error) {
            logger.error('Error getting equipment status summary', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // Get equipment with active activities
    async getActiveEquipment() {
        try {
            // Find equipment with activities in progress
            const equipment = await Equipment.find({
                'activities.status': 'IN_PROGRESS'
            }).populate('createdBy', 'nom prenom').lean();

            return equipment;
        } catch (error) {
            logger.error('Error fetching active equipment', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new EquipmentService(); 