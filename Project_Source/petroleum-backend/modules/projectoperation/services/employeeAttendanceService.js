const mongoose = require('mongoose');
const EmployeeAttendance = require('../models/EmployeeAttendance');
const Project = require('../../projects/models/Project');
const Employee = require('../../gestion-rh/models/employee.model');
const logger = require('../../../utils/logger');

class EmployeeAttendanceService {
    /**
     * Get attendance records for a project
     * @param {string} projectId - Project ID
     * @param {Object} filters - Optional filters (date range, employee, status)
     * @returns {Promise<Array>} List of attendance records
     */
    async getProjectAttendance(projectId, filters = {}) {
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

            // Apply status filter if provided
            if (filters.status && ['present', 'absent', 'late', 'excused'].includes(filters.status)) {
                query.status = filters.status;
            }

            // Get attendance records with populated data
            const attendance = await EmployeeAttendance.find(query)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'recordedBy',
                    select: 'name email'
                })
                .sort({ date: -1 });

            return attendance;
        } catch (error) {
            logger.error(`Error in getProjectAttendance: ${error.message}`);
            throw error;
        }
    }

    /**
     * Record employee attendance
     * @param {string} projectId - Project ID
     * @param {Object} attendanceData - Attendance data
     * @param {string} userId - ID of the user recording the attendance
     * @returns {Promise<Object>} Created attendance record
     */
    async recordAttendance(projectId, attendanceData, userId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate employeeId format
            if (!mongoose.Types.ObjectId.isValid(attendanceData.employeeId)) {
                throw new Error('Format de l\'identifiant de l\'employé invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Check if employee exists
            const employee = await Employee.findById(attendanceData.employeeId);
            if (!employee) {
                throw new Error('Employé non trouvé');
            }

            // Check if employee is assigned to the project
            const isAssigned = project.employees.some(
                emp => emp.employeeId.toString() === attendanceData.employeeId
            );

            if (!isAssigned) {
                throw new Error('Cet employé n\'est pas assigné à ce projet');
            }

            // Check if attendance for this employee on this date already exists
            const existingAttendance = await EmployeeAttendance.findOne({
                projectId,
                employeeId: attendanceData.employeeId,
                date: new Date(attendanceData.date),
                isDeleted: false
            });

            if (existingAttendance) {
                throw new Error('Une présence existe déjà pour cet employé à cette date');
            }

            // Calculate total hours if check-in and check-out times are provided
            let totalHours = null;
            if (attendanceData.checkInTime && attendanceData.checkOutTime) {
                const checkIn = attendanceData.checkInTime.split(':');
                const checkOut = attendanceData.checkOutTime.split(':');

                const checkInMinutes = parseInt(checkIn[0]) * 60 + parseInt(checkIn[1]);
                const checkOutMinutes = parseInt(checkOut[0]) * 60 + parseInt(checkOut[1]);

                totalHours = (checkOutMinutes - checkInMinutes) / 60;

                // Handle overnight shifts
                if (totalHours < 0) {
                    totalHours += 24;
                }
            }

            // Create attendance object
            const newAttendance = new EmployeeAttendance({
                projectId,
                employeeId: attendanceData.employeeId,
                date: attendanceData.date,
                status: attendanceData.status || 'present',
                checkInTime: attendanceData.checkInTime,
                checkOutTime: attendanceData.checkOutTime,
                totalHours: totalHours,
                notes: attendanceData.notes || '',
                recordedBy: userId
            });

            // Save attendance record
            await newAttendance.save();

            // Return created attendance record with populated data
            const createdAttendance = await EmployeeAttendance.findById(newAttendance._id)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'recordedBy',
                    select: 'name email'
                });

            return createdAttendance;
        } catch (error) {
            logger.error(`Error in recordAttendance: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update attendance record
     * @param {string} attendanceId - Attendance record ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated attendance record
     */
    async updateAttendance(attendanceId, updateData) {
        try {
            // Validate attendanceId format
            if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
                throw new Error('Format de l\'identifiant de présence invalide');
            }

            // Check if attendance record exists
            const attendance = await EmployeeAttendance.findById(attendanceId);
            if (!attendance || attendance.isDeleted) {
                throw new Error('Enregistrement de présence non trouvé');
            }

            // Update attendance fields
            Object.keys(updateData).forEach(key => {
                // Only update valid fields
                if (key !== '_id' && key !== 'projectId' && key !== 'employeeId' && key !== 'recordedBy' && key !== 'isDeleted') {
                    attendance[key] = updateData[key];
                }
            });

            // Recalculate total hours if check-in or check-out times are updated
            if (attendance.checkInTime && attendance.checkOutTime) {
                const checkIn = attendance.checkInTime.split(':');
                const checkOut = attendance.checkOutTime.split(':');

                const checkInMinutes = parseInt(checkIn[0]) * 60 + parseInt(checkIn[1]);
                const checkOutMinutes = parseInt(checkOut[0]) * 60 + parseInt(checkOut[1]);

                attendance.totalHours = (checkOutMinutes - checkInMinutes) / 60;

                // Handle overnight shifts
                if (attendance.totalHours < 0) {
                    attendance.totalHours += 24;
                }
            }

            // Save updated attendance record
            await attendance.save();

            // Return updated attendance record with populated data
            const updatedAttendance = await EmployeeAttendance.findById(attendanceId)
                .populate({
                    path: 'employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'recordedBy',
                    select: 'name email'
                });

            return updatedAttendance;
        } catch (error) {
            logger.error(`Error in updateAttendance: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete attendance record
     * @param {string} attendanceId - Attendance record ID
     * @returns {Promise<Object>} Result message
     */
    async deleteAttendance(attendanceId) {
        try {
            // Validate attendanceId format
            if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
                throw new Error('Format de l\'identifiant de présence invalide');
            }

            // Check if attendance record exists
            const attendance = await EmployeeAttendance.findById(attendanceId);
            if (!attendance || attendance.isDeleted) {
                throw new Error('Enregistrement de présence non trouvé');
            }

            // Soft delete
            attendance.isDeleted = true;
            await attendance.save();

            return { message: 'Enregistrement de présence supprimé avec succès' };
        } catch (error) {
            logger.error(`Error in deleteAttendance: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EmployeeAttendanceService(); 