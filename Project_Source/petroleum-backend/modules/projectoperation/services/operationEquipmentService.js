const mongoose = require('mongoose');
const OperationEquipment = require('../models/OperationEquipment');
const Project = require('../../projects/models/Project');
const Equipment = require('../../equipment/models/equipment.model');
const logger = require('../../../utils/logger');

class OperationEquipmentService {
    /**
     * Get all operation equipment for a project
     * @param {string} projectId - Project ID
     * @param {Object} filters - Optional filters (status, etc.)
     * @returns {Promise<Array>} List of operation equipment
     */
    async getProjectOperationEquipment(projectId, filters = {}) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Build query
            const query = {
                projectId,
                isDeleted: false
            };

            // Apply status filter if provided
            if (filters.status && ['available', 'inUse', 'maintenance', 'reserved'].includes(filters.status)) {
                query.status = filters.status;
            }

            // Get operation equipment with populated equipment data
            const operationEquipment = await OperationEquipment.find(query)
                .populate({
                    path: 'equipmentId',
                    select: 'nom reference status type'
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email position'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                })
                .sort({ createdAt: -1 });

            return operationEquipment;
        } catch (error) {
            logger.error(`Error in getProjectOperationEquipment: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add equipment to operation
     * @param {string} projectId - Project ID
     * @param {Object} equipmentData - Equipment data
     * @param {string} userId - ID of the user adding the equipment
     * @returns {Promise<Object>} Added operation equipment
     */
    async addOperationEquipment(projectId, equipmentData, userId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate equipmentId format
            if (!mongoose.Types.ObjectId.isValid(equipmentData.equipmentId)) {
                throw new Error('Format de l\'identifiant de l\'équipement invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Check if equipment exists
            const equipment = await Equipment.findById(equipmentData.equipmentId);
            if (!equipment) {
                throw new Error('Équipement non trouvé');
            }

            // Check if equipment is already added to this operation
            const existingEquipment = await OperationEquipment.findOne({
                projectId,
                equipmentId: equipmentData.equipmentId,
                isDeleted: false
            });

            if (existingEquipment) {
                throw new Error('Cet équipement est déjà ajouté à cette opération');
            }

            // Create operation equipment object
            const newOperationEquipment = new OperationEquipment({
                projectId,
                equipmentId: equipmentData.equipmentId,
                status: equipmentData.status || 'available',
                location: equipmentData.location || 'Site principal',
                maintenanceDate: equipmentData.maintenanceDate,
                assignedTo: equipmentData.assignedTo,
                notes: equipmentData.notes || '',
                createdBy: userId
            });

            // Save operation equipment
            await newOperationEquipment.save();

            // Return created operation equipment with populated data
            const createdOperationEquipment = await OperationEquipment.findById(newOperationEquipment._id)
                .populate({
                    path: 'equipmentId',
                    select: 'nom reference status type'
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email position'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            return createdOperationEquipment;
        } catch (error) {
            logger.error(`Error in addOperationEquipment: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update operation equipment
     * @param {string} operationEquipmentId - Operation equipment ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated operation equipment
     */
    async updateOperationEquipment(operationEquipmentId, updateData) {
        try {
            // Validate operationEquipmentId format
            if (!mongoose.Types.ObjectId.isValid(operationEquipmentId)) {
                throw new Error('Format de l\'identifiant de l\'équipement d\'opération invalide');
            }

            // Check if operation equipment exists
            const operationEquipment = await OperationEquipment.findById(operationEquipmentId);
            if (!operationEquipment || operationEquipment.isDeleted) {
                throw new Error('Équipement d\'opération non trouvé');
            }

            // Update operation equipment fields
            Object.keys(updateData).forEach(key => {
                // Only update valid fields
                if (key !== '_id' && key !== 'projectId' && key !== 'equipmentId' && key !== 'createdBy' && key !== 'isDeleted') {
                    operationEquipment[key] = updateData[key];
                }
            });

            // Save updated operation equipment
            await operationEquipment.save();

            // Return updated operation equipment with populated data
            const updatedOperationEquipment = await OperationEquipment.findById(operationEquipmentId)
                .populate({
                    path: 'equipmentId',
                    select: 'nom reference status type'
                })
                .populate({
                    path: 'assignedTo',
                    select: 'name email position'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            return updatedOperationEquipment;
        } catch (error) {
            logger.error(`Error in updateOperationEquipment: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove equipment from operation
     * @param {string} operationEquipmentId - Operation equipment ID
     * @returns {Promise<Object>} Result message
     */
    async removeOperationEquipment(operationEquipmentId) {
        try {
            // Validate operationEquipmentId format
            if (!mongoose.Types.ObjectId.isValid(operationEquipmentId)) {
                throw new Error('Format de l\'identifiant de l\'équipement d\'opération invalide');
            }

            // Check if operation equipment exists
            const operationEquipment = await OperationEquipment.findById(operationEquipmentId);
            if (!operationEquipment || operationEquipment.isDeleted) {
                throw new Error('Équipement d\'opération non trouvé');
            }

            // Soft delete
            operationEquipment.isDeleted = true;
            await operationEquipment.save();

            return { message: 'Équipement d\'opération supprimé avec succès' };
        } catch (error) {
            logger.error(`Error in removeOperationEquipment: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new OperationEquipmentService(); 