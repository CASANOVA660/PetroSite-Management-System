const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Equipment = require('../../equipment/models/equipment.model');
const logger = require('../../../utils/logger');
const { EQUIPMENT_STATUS, ACTIVITY_TYPE } = Equipment;

class PlanService {
    /**
     * Get all plans with optional filters
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} List of plans
     */
    static async getPlans(filters = {}) {
        try {
            const query = { isDeleted: false };

            // Apply filters if provided
            if (filters.equipmentId) {
                query.equipmentId = filters.equipmentId;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.type) {
                query.type = filters.type;
            }

            // Project ID filter
            if (filters.projectId) {
                query.projectId = filters.projectId;
            }

            // Date range filters
            if (filters.startDate) {
                query.startDate = { $gte: new Date(filters.startDate) };
            }

            if (filters.endDate) {
                query.endDate = { $lte: new Date(filters.endDate) };
            }

            const plans = await Plan.find(query)
                .populate('equipmentId', 'nom reference matricule status')
                .populate('createdBy', 'nom prenom')
                .populate('projectId', 'nom description')
                .sort({ startDate: 1 })
                .lean();

            return plans;
        } catch (error) {
            logger.error('Error in getPlans:', error);
            throw error;
        }
    }

    /**
     * Get plan by ID
     * @param {string} id - Plan ID
     * @returns {Promise<Object>} Plan object
     */
    static async getPlanById(id) {
        try {
            const plan = await Plan.findOne({ _id: id, isDeleted: false })
                .populate('equipmentId', 'nom reference matricule status')
                .populate('createdBy', 'nom prenom')
                .lean();

            return plan;
        } catch (error) {
            logger.error(`Error in getPlanById: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new plan with equipment status validation
     * @param {Object} planData - Plan data
     * @param {string} userId - User ID creating the plan
     * @returns {Promise<Object>} Created plan
     */
    static async createPlan(planData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { equipmentId, startDate, endDate, type } = planData;

            // Log the plan data for debugging
            console.log('Creating plan with data:', planData);

            // For custom plan types, equipment is optional
            const isCustomType = type === 'custom';

            // Validate equipment exists if not a custom type or if equipmentId is provided
            if ((!isCustomType || equipmentId) && equipmentId) {
                const equipment = await Equipment.findById(equipmentId).session(session);
                if (!equipment) {
                    throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
                }
            }

            // For standard plan types, check equipment availability
            if (!isCustomType && equipmentId) {
                const equipment = await Equipment.findById(equipmentId).session(session);
                // Check if equipment is available for the activity type
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

                // Check for scheduling conflicts
                const hasConflict = equipment.hasScheduleConflict(new Date(startDate), new Date(endDate));
                if (hasConflict) {
                    throw new Error('Cet équipement a déjà une activité planifiée pendant cette période');
                }

                // Create activity in equipment for standard types
                const activityData = {
                    type,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    description: planData.description || planData.title,
                    location: planData.location,
                    responsiblePerson: planData.responsiblePerson,
                    status: 'SCHEDULED',
                    createdBy: userId
                };

                equipment.activities.push(activityData);
                await equipment.save({ session });

                // Get the created activity ID
                const activityId = equipment.activities[equipment.activities.length - 1]._id;

                // Create a history entry for this activity
                const EquipmentHistory = mongoose.model('EquipmentHistory');
                const historyEntry = new EquipmentHistory({
                    equipmentId,
                    type,
                    description: planData.description || `${planData.title} - Activité de ${type} planifiée`,
                    fromDate: new Date(startDate),
                    toDate: new Date(endDate),
                    location: planData.location,
                    // Format responsiblePerson as an object if it's a string
                    responsiblePerson: typeof planData.responsiblePerson === 'string'
                        ? { name: planData.responsiblePerson }
                        : planData.responsiblePerson,
                    activityId,
                    isStatusChange: false,
                    createdBy: userId
                });
                await historyEntry.save({ session });

                // Create the plan with activityId for standard types
                const plan = new Plan({
                    ...planData,
                    activityId,
                    status: 'scheduled',
                    createdBy: userId
                });

                await plan.save({ session });

                await session.commitTransaction();
                session.endSession();

                // Return populated plan
                const populatedPlan = await Plan.findById(plan._id)
                    .populate('equipmentId', 'nom reference matricule status')
                    .populate('createdBy', 'nom prenom')
                    .populate('projectId', 'nom description');

                return populatedPlan;
            }
            // For custom plan types, create plan without equipment activity
            else {
                // For custom plans, just create the plan without modifying equipment
                const plan = new Plan({
                    ...planData,
                    status: 'scheduled',
                    createdBy: userId
                });

                await plan.save({ session });

                await session.commitTransaction();
                session.endSession();

                // Return populated plan
                const populatedPlan = await Plan.findById(plan._id)
                    .populate('equipmentId', 'nom reference matricule status')
                    .populate('createdBy', 'nom prenom')
                    .populate('projectId', 'nom description');

                return populatedPlan;
            }
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error in createPlan: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a plan and manage equipment activity
     * @param {string} id - Plan ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID updating the plan
     * @returns {Promise<Object>} Updated plan
     */
    static async updatePlan(id, updateData, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Get the existing plan
            const plan = await Plan.findOne({ _id: id, isDeleted: false }).session(session);
            if (!plan) {
                throw new Error('Plan non trouvé');
            }

            // Check if this is a custom plan type
            const isCustomPlan = plan.type !== ACTIVITY_TYPE.PLACEMENT &&
                plan.type !== ACTIVITY_TYPE.MAINTENANCE &&
                plan.type !== ACTIVITY_TYPE.REPAIR;

            const isChangingToCustom = updateData.type &&
                updateData.type !== ACTIVITY_TYPE.PLACEMENT &&
                updateData.type !== ACTIVITY_TYPE.MAINTENANCE &&
                updateData.type !== ACTIVITY_TYPE.REPAIR;

            const isChangingFromCustom = !isCustomPlan && updateData.type &&
                (updateData.type === ACTIVITY_TYPE.PLACEMENT ||
                    updateData.type === ACTIVITY_TYPE.MAINTENANCE ||
                    updateData.type === ACTIVITY_TYPE.REPAIR);

            // For standard plan types, handle equipment activities
            if (!isCustomPlan && !isChangingToCustom) {
                // If updating equipment, dates, or type, validate equipment availability
                if (updateData.equipmentId || updateData.startDate || updateData.endDate || updateData.type) {
                    const equipmentId = updateData.equipmentId || plan.equipmentId;
                    const startDate = updateData.startDate || plan.startDate;
                    const endDate = updateData.endDate || plan.endDate;
                    const type = updateData.type || plan.type;

                    // If equipment is changed, validate new equipment
                    if (updateData.equipmentId && updateData.equipmentId !== plan.equipmentId.toString()) {
                        const newEquipment = await Equipment.findById(equipmentId).session(session);
                        if (!newEquipment) {
                            throw new Error(`Nouvel équipement avec ID ${equipmentId} non trouvé`);
                        }

                        // Check if equipment is available for the activity type
                        if (type === ACTIVITY_TYPE.PLACEMENT &&
                            newEquipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
                            throw new Error(`L'équipement n'est pas disponible pour un placement (statut actuel: ${newEquipment.status})`);
                        } else if (type === ACTIVITY_TYPE.MAINTENANCE &&
                            (newEquipment.status === EQUIPMENT_STATUS.REPAIR ||
                                newEquipment.status === EQUIPMENT_STATUS.OUT_OF_SERVICE)) {
                            throw new Error(`L'équipement ne peut pas être mis en maintenance (statut actuel: ${newEquipment.status})`);
                        } else if (type === ACTIVITY_TYPE.REPAIR &&
                            newEquipment.status === EQUIPMENT_STATUS.OUT_OF_SERVICE) {
                            throw new Error(`L'équipement ne peut pas être réparé (statut actuel: ${newEquipment.status})`);
                        }

                        // Check for scheduling conflicts in new equipment
                        const hasConflict = newEquipment.hasScheduleConflict(new Date(startDate), new Date(endDate));
                        if (hasConflict) {
                            throw new Error('Cet équipement a déjà une activité planifiée pendant cette période');
                        }

                        // If changing equipment, cancel old activity
                        if (plan.activityId) {
                            const oldEquipment = await Equipment.findById(plan.equipmentId).session(session);
                            if (oldEquipment) {
                                const activityIndex = oldEquipment.activities.findIndex(
                                    a => a._id.toString() === plan.activityId.toString()
                                );

                                if (activityIndex !== -1) {
                                    oldEquipment.activities[activityIndex].status = 'CANCELLED';
                                    await oldEquipment.save({ session });
                                }
                            }
                        }

                        // Create new activity in new equipment
                        const activityData = {
                            type,
                            startDate: new Date(startDate),
                            endDate: new Date(endDate),
                            description: updateData.description || plan.description || plan.title,
                            location: updateData.location || plan.location,
                            responsiblePerson: updateData.responsiblePerson || plan.responsiblePerson,
                            status: 'SCHEDULED',
                            createdBy: userId
                        };

                        newEquipment.activities.push(activityData);
                        await newEquipment.save({ session });

                        // Update plan with new activity ID
                        updateData.activityId = newEquipment.activities[newEquipment.activities.length - 1]._id;

                        // Create history entry for the new activity
                        const EquipmentHistory = mongoose.model('EquipmentHistory');
                        const historyEntry = new EquipmentHistory({
                            equipmentId: equipmentId,
                            type,
                            description: updateData.description || plan.description || `${plan.title} - Activité de ${type} planifiée (équipement modifié)`,
                            fromDate: new Date(startDate),
                            toDate: new Date(endDate),
                            location: updateData.location || plan.location,
                            responsiblePerson: typeof updateData.responsiblePerson === 'string'
                                ? { name: updateData.responsiblePerson }
                                : (updateData.responsiblePerson || (typeof plan.responsiblePerson === 'string'
                                    ? { name: plan.responsiblePerson }
                                    : plan.responsiblePerson)),
                            activityId: newEquipment.activities[newEquipment.activities.length - 1]._id,
                            isStatusChange: false,
                            createdBy: userId
                        });
                        await historyEntry.save({ session });
                    }
                    // If same equipment but dates/type changed
                    else if (updateData.startDate || updateData.endDate || updateData.type) {
                        const equipment = await Equipment.findById(plan.equipmentId).session(session);
                        if (!equipment) {
                            throw new Error(`Équipement avec ID ${plan.equipmentId} non trouvé`);
                        }

                        // Find the activity and update it
                        if (plan.activityId) {
                            const activityIndex = equipment.activities.findIndex(
                                a => a._id.toString() === plan.activityId.toString()
                            );

                            if (activityIndex !== -1) {
                                // Update the activity
                                if (updateData.startDate) {
                                    equipment.activities[activityIndex].startDate = new Date(updateData.startDate);
                                }

                                if (updateData.endDate) {
                                    equipment.activities[activityIndex].endDate = new Date(updateData.endDate);
                                }

                                if (updateData.type) {
                                    equipment.activities[activityIndex].type = updateData.type;
                                }

                                if (updateData.description) {
                                    equipment.activities[activityIndex].description = updateData.description;
                                }

                                if (updateData.location) {
                                    equipment.activities[activityIndex].location = updateData.location;
                                }

                                if (updateData.responsiblePerson) {
                                    equipment.activities[activityIndex].responsiblePerson = updateData.responsiblePerson;
                                }

                                equipment.activities[activityIndex].updatedBy = userId;
                                await equipment.save({ session });

                                // Update or create history entry for the updated activity
                                const EquipmentHistory = mongoose.model('EquipmentHistory');
                                const existingHistory = await EquipmentHistory.findOne({
                                    activityId: plan.activityId,
                                    equipmentId: plan.equipmentId
                                }).session(session);

                                if (existingHistory) {
                                    // Update existing history entry
                                    if (updateData.startDate) existingHistory.fromDate = new Date(updateData.startDate);
                                    if (updateData.endDate) existingHistory.toDate = new Date(updateData.endDate);
                                    if (updateData.type) existingHistory.type = updateData.type;
                                    if (updateData.description) existingHistory.description = updateData.description;
                                    if (updateData.location) existingHistory.location = updateData.location;
                                    if (updateData.responsiblePerson) {
                                        existingHistory.responsiblePerson = typeof updateData.responsiblePerson === 'string'
                                            ? { name: updateData.responsiblePerson }
                                            : updateData.responsiblePerson;
                                    }
                                    existingHistory.updatedBy = userId;
                                    existingHistory.updatedAt = new Date();
                                    await existingHistory.save({ session });
                                } else {
                                    // Create new history entry if none exists
                                    const historyEntry = new EquipmentHistory({
                                        equipmentId: plan.equipmentId,
                                        type: updateData.type || plan.type,
                                        description: updateData.description || plan.description || `${plan.title} - Activité mise à jour`,
                                        fromDate: new Date(updateData.startDate || plan.startDate),
                                        toDate: new Date(updateData.endDate || plan.endDate),
                                        location: updateData.location || plan.location,
                                        responsiblePerson: typeof updateData.responsiblePerson === 'string'
                                            ? { name: updateData.responsiblePerson }
                                            : (updateData.responsiblePerson || (typeof plan.responsiblePerson === 'string'
                                                ? { name: plan.responsiblePerson }
                                                : plan.responsiblePerson)),
                                        activityId: plan.activityId,
                                        isStatusChange: false,
                                        createdBy: userId
                                    });
                                    await historyEntry.save({ session });
                                }
                            }
                        }
                    }
                }
            }
            // Handle changing from standard to custom plan type
            else if (isChangingToCustom && plan.activityId) {
                // Cancel the associated equipment activity
                const equipment = await Equipment.findById(plan.equipmentId).session(session);
                if (equipment) {
                    const activityIndex = equipment.activities.findIndex(
                        a => a._id.toString() === plan.activityId.toString()
                    );

                    if (activityIndex !== -1) {
                        equipment.activities[activityIndex].status = 'CANCELLED';
                        equipment.activities[activityIndex].updatedBy = userId;
                        await equipment.save({ session });

                        // Remove the activityId from the plan when converting to custom
                        updateData.activityId = null;
                    }
                }
            }
            // Handle changing from custom to standard plan type
            else if (isChangingFromCustom) {
                const equipmentId = updateData.equipmentId || plan.equipmentId;
                const startDate = updateData.startDate || plan.startDate;
                const endDate = updateData.endDate || plan.endDate;
                const type = updateData.type;

                // Create a new activity for the equipment
                const equipment = await Equipment.findById(equipmentId).session(session);
                if (!equipment) {
                    throw new Error(`Équipement avec ID ${equipmentId} non trouvé`);
                }

                // Check if equipment is available for the activity type
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

                // Check for scheduling conflicts
                const hasConflict = equipment.hasScheduleConflict(new Date(startDate), new Date(endDate));
                if (hasConflict) {
                    throw new Error('Cet équipement a déjà une activité planifiée pendant cette période');
                }

                // Create activity in equipment
                const activityData = {
                    type,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    description: updateData.description || plan.description || plan.title,
                    location: updateData.location || plan.location,
                    responsiblePerson: updateData.responsiblePerson || plan.responsiblePerson,
                    status: 'SCHEDULED',
                    createdBy: userId
                };

                equipment.activities.push(activityData);
                await equipment.save({ session });

                // Add the activityId to the update data
                updateData.activityId = equipment.activities[equipment.activities.length - 1]._id;
            }

            // Update the plan
            updateData.updatedBy = userId;
            const updatedPlan = await Plan.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true, session }
            ).populate('equipmentId', 'nom reference matricule status')
                .populate('createdBy', 'nom prenom')
                .populate('projectId', 'nom description');

            await session.commitTransaction();
            session.endSession();

            return updatedPlan;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error in updatePlan: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a plan and cancel equipment activity
     * @param {string} id - Plan ID
     * @param {string} userId - User ID deleting the plan
     * @returns {Promise<boolean>} Success indicator
     */
    static async deletePlan(id, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find plan
            const plan = await Plan.findOne({ _id: id, isDeleted: false }).session(session);
            if (!plan) {
                throw new Error('Plan non trouvé');
            }

            // Cancel associated equipment activity if exists
            if (plan.activityId && plan.equipmentId) {
                const equipment = await Equipment.findById(plan.equipmentId).session(session);
                if (equipment) {
                    const activityIndex = equipment.activities.findIndex(
                        a => a._id.toString() === plan.activityId.toString()
                    );

                    if (activityIndex !== -1) {
                        equipment.activities[activityIndex].status = 'CANCELLED';
                        equipment.activities[activityIndex].updatedBy = userId;
                        await equipment.save({ session });

                        // Add history entry for cancelled activity
                        const EquipmentHistory = mongoose.model('EquipmentHistory');
                        const historyEntry = new EquipmentHistory({
                            equipmentId: plan.equipmentId,
                            type: plan.type,
                            description: `${plan.title || 'Activité'} - Annulée`,
                            fromDate: new Date(),
                            activityId: plan.activityId,
                            isStatusChange: false,
                            status: 'CANCELLED',
                            reason: 'Plan supprimé',
                            // Add responsiblePerson field properly formatted
                            responsiblePerson: typeof plan.responsiblePerson === 'string'
                                ? { name: plan.responsiblePerson }
                                : plan.responsiblePerson,
                            createdBy: userId
                        });
                        await historyEntry.save({ session });
                    }
                }
            }

            // Soft delete the plan
            plan.isDeleted = true;
            plan.deletedAt = new Date();
            plan.deletedBy = userId;
            await plan.save({ session });

            await session.commitTransaction();
            session.endSession();

            return true;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error(`Error in deletePlan: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available equipment for planning
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} type - Activity type (placement, maintenance, repair, custom)
     * @param {string} projectId - Optional project ID to filter related equipment
     * @returns {Promise<Array>} List of available equipment
     */
    static async getAvailableEquipment(startDate, endDate, type, projectId) {
        try {
            console.log('Service - getAvailableEquipment called with:', {
                startDate,
                endDate,
                type,
                projectId
            });

            // Find equipment with the right status for the activity type
            let statusQuery = {};

            // Only apply status restrictions for standard types
            if (type === ACTIVITY_TYPE.PLACEMENT) {
                statusQuery.status = EQUIPMENT_STATUS.AVAILABLE;
            } else if (type === ACTIVITY_TYPE.MAINTENANCE) {
                statusQuery.status = { $nin: [EQUIPMENT_STATUS.REPAIR, EQUIPMENT_STATUS.OUT_OF_SERVICE] };
            } else if (type === ACTIVITY_TYPE.REPAIR) {
                statusQuery.status = { $ne: EQUIPMENT_STATUS.OUT_OF_SERVICE };
            }
            // For custom types, don't restrict by status

            console.log('Service - status query:', statusQuery);

            // Get equipment that matches status requirements
            const equipment = await Equipment.find(statusQuery)
                .select('_id nom reference matricule status activities')
                .lean();

            console.log(`Service - Found ${equipment.length} equipment matching status requirements`);

            if (equipment.length === 0) {
                console.log('Service - No equipment matches the status criteria');
                return [];
            }

            // Log the first equipment found to see what data structure we're working with
            if (equipment.length > 0) {
                console.log('Service - Example equipment:', {
                    _id: equipment[0]._id,
                    nom: equipment[0].nom,
                    status: equipment[0].status,
                    hasActivities: Array.isArray(equipment[0].activities),
                    activitiesCount: Array.isArray(equipment[0].activities) ? equipment[0].activities.length : 0
                });
            }

            // Return all equipment with activities instead of filtering
            // This allows the frontend to handle conflict detection
            const formattedEquipment = equipment.map(equip => ({
                _id: equip._id,
                nom: equip.nom,
                reference: equip.reference,
                matricule: equip.matricule,
                status: equip.status,
                activities: equip.activities || []
            }));

            console.log(`Service - Returning ${formattedEquipment.length} equipment with activities`);

            // If we have a projectId, check if we need to prioritize equipment used in this project before
            if (projectId) {
                try {
                    // Find plans for this project to identify previously used equipment
                    const projectPlans = await Plan.find({
                        projectId: projectId,
                        isDeleted: false
                    }).distinct('equipmentId');

                    if (projectPlans.length > 0) {
                        console.log(`Found ${projectPlans.length} previously used equipment for project ${projectId}`);

                        // Convert IDs to strings for comparison
                        const projectEquipmentIds = projectPlans.map(id => id.toString());

                        // Sort equipment to prioritize previously used equipment in this project
                        formattedEquipment.sort((a, b) => {
                            const aUsed = projectEquipmentIds.includes(a._id.toString());
                            const bUsed = projectEquipmentIds.includes(b._id.toString());

                            if (aUsed && !bUsed) return -1;
                            if (!aUsed && bUsed) return 1;
                            return 0;
                        });
                    }
                } catch (error) {
                    console.error('Error prioritizing project equipment:', error);
                    // Continue without prioritization if there's an error
                }
            }

            return formattedEquipment;
        } catch (error) {
            logger.error(`Error in getAvailableEquipment: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PlanService; 