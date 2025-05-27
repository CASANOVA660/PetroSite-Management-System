const projectEmployeeService = require('../services/projectEmployeeService');
const logger = require('../../../utils/logger');

/**
 * Get all employees assigned to a project
 */
exports.getProjectEmployees = async (req, res) => {
    try {
        const { projectId } = req.params;
        const employees = await projectEmployeeService.getProjectEmployees(projectId);
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        logger.error(`Error in getProjectEmployees controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all available employees for assignment
 */
exports.getAllAvailableEmployees = async (req, res) => {
    try {
        const employees = await projectEmployeeService.getAllAvailableEmployees();
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        logger.error(`Error in getAllAvailableEmployees controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Assign an employee to a project
 */
exports.assignEmployeeToProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;
        const result = await projectEmployeeService.assignEmployeeToProject(projectId, req.body, userId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-employee-update', {
                action: 'assigned',
                employee: result
            });
        }

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        logger.error(`Error in assignEmployeeToProject controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update an employee's status in a project
 */
exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { projectId, employeeId } = req.params;
        const result = await projectEmployeeService.updateEmployeeStatus(projectId, employeeId, req.body);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-employee-update', {
                action: 'updated',
                employee: result
            });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        logger.error(`Error in updateEmployeeStatus controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Set all project employees to operational status
 */
exports.setEmployeesToOperational = async (req, res) => {
    try {
        const { projectId } = req.params;
        const employees = await projectEmployeeService.setEmployeesToOperational(projectId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-employee-update', {
                action: 'bulk-status-update',
                employees: employees
            });
        }

        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        logger.error(`Error in setEmployeesToOperational controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Remove an employee from a project
 */
exports.removeEmployeeFromProject = async (req, res) => {
    try {
        const { projectId, employeeId } = req.params;
        const result = await projectEmployeeService.removeEmployeeFromProject(projectId, employeeId);

        // Emit socket event for real-time updates
        if (global.io) {
            global.io.to(projectId).emit('project-employee-update', {
                action: 'removed',
                employeeId: employeeId
            });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        logger.error(`Error in removeEmployeeFromProject controller: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
}; 