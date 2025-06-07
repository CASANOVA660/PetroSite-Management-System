const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const Project = require('../../projects/models/Project');
const Employee = require('../../gestion-rh/models/employee.model');
const logger = require('../../../utils/logger');

class ShiftService {
    /**
     * Get all shifts for a project
     * @param {string} projectId - Project ID
     * @param {Object} filters - Optional filters (date range, employee, type)
     * @returns {Promise<Array>} List of shifts
     */
    async getProjectShifts(projectId, filters = {}) {
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

            // Apply date range filter if provided
            if (filters.startDate && filters.endDate) {
                query.date = {
                    $gte: new Date(filters.startDate),
                    $lte: new Date(filters.endDate)
                };
            }

            // Apply employee filter if provided
            if (filters.employeeId && mongoose.Types.ObjectId.isValid(filters.employeeId)) {
                query.employeeId = filters.employeeId;
            }

            // Apply shift type filter if provided
            if (filters.type && ['day', 'night'].includes(filters.type)) {
                query.type = filters.type;
            }

            // Apply status filter if provided
            if (filters.status && ['scheduled', 'completed', 'absent'].includes(filters.status)) {
                query.status = filters.status;
            }

            // Get shifts with populated employee data
            const shifts = await Shift.find(query)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                })
                .sort({ date: 1, type: 1 });

            return shifts;
        } catch (error) {
            logger.error(`Error in getProjectShifts: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new shift
     * @param {string} projectId - Project ID
     * @param {Object} shiftData - Shift data
     * @param {string} userId - ID of the user creating the shift
     * @returns {Promise<Object>} Created shift
     */
    async createShift(projectId, shiftData, userId) {
        try {
            console.log('ShiftService.createShift called with:', {
                projectId,
                shiftData,
                userId
            });

            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate employeeId format
            if (!mongoose.Types.ObjectId.isValid(shiftData.employeeId)) {
                throw new Error('Format de l\'identifiant de l\'employé invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }
            console.log('Project found:', project._id);

            // Check if employee exists
            const employee = await Employee.findById(shiftData.employeeId);
            if (!employee) {
                throw new Error('Employé non trouvé');
            }
            console.log('Employee found:', employee._id);

            // Check if employee is assigned to the project
            const isAssigned = project.employees.some(
                emp => emp.employeeId.toString() === shiftData.employeeId
            );

            if (!isAssigned) {
                console.log('Employee not assigned to project. Project employees:', project.employees);
                throw new Error('Cet employé n\'est pas assigné à ce projet');
            }
            console.log('Employee is assigned to project');

            // Create shift object
            const newShift = new Shift({
                projectId,
                employeeId: shiftData.employeeId,
                date: shiftData.date,
                type: shiftData.type,
                startTime: shiftData.startTime,
                endTime: shiftData.endTime,
                status: shiftData.status || 'scheduled',
                notes: shiftData.notes || '',
                createdBy: userId
            });

            console.log('New shift object created:', newShift);

            // Save shift
            await newShift.save();
            console.log('Shift saved to database with ID:', newShift._id);

            // Return created shift with populated data
            const createdShift = await Shift.findById(newShift._id)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            console.log('Returning populated shift:', createdShift);
            return createdShift;
        } catch (error) {
            console.error('Error in ShiftService.createShift:', error);
            logger.error(`Error in createShift: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a shift
     * @param {string} shiftId - Shift ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated shift
     */
    async updateShift(shiftId, updateData) {
        try {
            // Validate shiftId format
            if (!mongoose.Types.ObjectId.isValid(shiftId)) {
                throw new Error('Format de l\'identifiant du quart de travail invalide');
            }

            // Check if shift exists
            const shift = await Shift.findById(shiftId);
            if (!shift || shift.isDeleted) {
                throw new Error('Quart de travail non trouvé');
            }

            // Update shift fields
            Object.keys(updateData).forEach(key => {
                // Only update valid fields
                if (key !== '_id' && key !== 'projectId' && key !== 'createdBy' && key !== 'isDeleted') {
                    shift[key] = updateData[key];
                }
            });

            // Save updated shift
            await shift.save();

            // Return updated shift with populated data
            const updatedShift = await Shift.findById(shiftId)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            return updatedShift;
        } catch (error) {
            logger.error(`Error in updateShift: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a shift
     * @param {string} shiftId - Shift ID
     * @returns {Promise<Object>} Result message
     */
    async deleteShift(shiftId) {
        try {
            // Validate shiftId format
            if (!mongoose.Types.ObjectId.isValid(shiftId)) {
                throw new Error('Format de l\'identifiant du quart de travail invalide');
            }

            // Check if shift exists
            const shift = await Shift.findById(shiftId);
            if (!shift || shift.isDeleted) {
                throw new Error('Quart de travail non trouvé');
            }

            // Soft delete
            shift.isDeleted = true;
            await shift.save();

            return { message: 'Quart de travail supprimé avec succès' };
        } catch (error) {
            logger.error(`Error in deleteShift: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ShiftService(); 