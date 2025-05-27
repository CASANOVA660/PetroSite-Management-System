const mongoose = require('mongoose');
const Project = require('../models/Project');
const Employee = require('../../gestion-rh/models/employee.model');
const logger = require('../../../utils/logger');

class ProjectEmployeeService {
    /**
     * Get all employees assigned to a project
     * @param {string} projectId - Project ID
     * @returns {Promise<Array>} List of assigned employees
     */
    async getProjectEmployees(projectId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId)
                .select('employees')
                .populate({
                    path: 'employees.employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'employees.assignedBy',
                    select: 'name email'
                });

            if (!project) {
                throw new Error('Projet non trouvé');
            }

            return project.employees;
        } catch (error) {
            logger.error(`Error in getProjectEmployees: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all available employees that can be assigned to a project
     * @returns {Promise<Array>} List of all employees
     */
    async getAllAvailableEmployees() {
        try {
            const employees = await Employee.find()
                .select('name email phone position department profileImage');
            return employees;
        } catch (error) {
            logger.error(`Error in getAllAvailableEmployees: ${error.message}`);
            throw error;
        }
    }

    /**
     * Assign an employee to a project
     * @param {string} projectId - Project ID
     * @param {Object} employeeData - Employee data including employeeId, role, etc.
     * @param {string} userId - ID of the user making the assignment
     * @returns {Promise<Object>} Updated project
     */
    async assignEmployeeToProject(projectId, employeeData, userId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate employeeId format
            if (!mongoose.Types.ObjectId.isValid(employeeData.employeeId)) {
                throw new Error('Format de l\'identifiant de l\'employé invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Check if employee exists
            const employee = await Employee.findById(employeeData.employeeId);
            if (!employee) {
                throw new Error('Employé non trouvé');
            }

            // Check if employee is already assigned to this project
            const isAlreadyAssigned = project.employees.some(
                emp => emp.employeeId.toString() === employeeData.employeeId
            );

            if (isAlreadyAssigned) {
                throw new Error('Cet employé est déjà assigné à ce projet');
            }

            // Create the employee assignment object
            const employeeAssignment = {
                employeeId: employeeData.employeeId,
                role: employeeData.role,
                startDate: employeeData.startDate || null,
                endDate: employeeData.endDate || null,
                status: employeeData.status || 'Assigné',
                assignedBy: userId,
                assignedAt: new Date()
            };

            // Add employee to project
            project.employees.push(employeeAssignment);
            await project.save();

            // Return updated project with populated employee data
            const updatedProject = await Project.findById(projectId)
                .populate({
                    path: 'employees.employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'employees.assignedBy',
                    select: 'name email'
                });

            return updatedProject.employees[updatedProject.employees.length - 1];
        } catch (error) {
            logger.error(`Error in assignEmployeeToProject: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update an employee's status in a project
     * @param {string} projectId - Project ID
     * @param {string} employeeId - Employee ID
     * @param {Object} updateData - Data to update (status, role, etc.)
     * @returns {Promise<Object>} Updated project
     */
    async updateEmployeeStatus(projectId, employeeId, updateData) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate employeeId format
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                throw new Error('Format de l\'identifiant de l\'employé invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Find the employee in the project
            const employeeIndex = project.employees.findIndex(
                emp => emp.employeeId.toString() === employeeId
            );

            if (employeeIndex === -1) {
                throw new Error('Employé non trouvé dans ce projet');
            }

            // Update employee status
            if (updateData.status) {
                project.employees[employeeIndex].status = updateData.status;
            }

            // Update role if provided
            if (updateData.role) {
                project.employees[employeeIndex].role = updateData.role;
            }

            // Update dates if provided
            if (updateData.startDate) {
                project.employees[employeeIndex].startDate = updateData.startDate;
            }

            if (updateData.endDate) {
                project.employees[employeeIndex].endDate = updateData.endDate;
            }

            // Save the updated project
            await project.save();

            // Return updated project with populated employee data
            const updatedProject = await Project.findById(projectId)
                .populate({
                    path: 'employees.employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'employees.assignedBy',
                    select: 'name email'
                });

            return updatedProject.employees[employeeIndex];
        } catch (error) {
            logger.error(`Error in updateEmployeeStatus: ${error.message}`);
            throw error;
        }
    }

    /**
     * Set all employees in a project to "En opération" when project starts
     * @param {string} projectId - Project ID
     * @returns {Promise<Object>} Updated project
     */
    async setEmployeesToOperational(projectId) {
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

            // Set all employees to "En opération"
            project.employees.forEach(employee => {
                if (employee.status === 'Assigné') {
                    employee.status = 'En opération';
                }
            });

            // Save the updated project
            await project.save();

            // Return updated project with populated employee data
            const updatedProject = await Project.findById(projectId)
                .populate({
                    path: 'employees.employeeId',
                    select: 'name email phone position department profileImage'
                })
                .populate({
                    path: 'employees.assignedBy',
                    select: 'name email'
                });

            return updatedProject.employees;
        } catch (error) {
            logger.error(`Error in setEmployeesToOperational: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove an employee from a project
     * @param {string} projectId - Project ID
     * @param {string} employeeId - Employee ID
     * @returns {Promise<Object>} Updated project
     */
    async removeEmployeeFromProject(projectId, employeeId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Validate employeeId format
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                throw new Error('Format de l\'identifiant de l\'employé invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Find the employee in the project
            const employeeIndex = project.employees.findIndex(
                emp => emp.employeeId.toString() === employeeId
            );

            if (employeeIndex === -1) {
                throw new Error('Employé non trouvé dans ce projet');
            }

            // Remove employee from project
            project.employees.splice(employeeIndex, 1);
            await project.save();

            return { success: true, message: 'Employé retiré du projet avec succès' };
        } catch (error) {
            logger.error(`Error in removeEmployeeFromProject: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ProjectEmployeeService(); 