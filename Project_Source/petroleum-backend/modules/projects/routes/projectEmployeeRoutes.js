const express = require('express');
const router = express.Router({ mergeParams: true });
const projectEmployeeController = require('../controllers/projectEmployeeController');
const authMiddleware = require('../../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/projects/:projectId/employees
 * @desc    Get all employees assigned to a project
 * @access  Private
 */
router.get('/', projectEmployeeController.getProjectEmployees);

/**
 * @route   GET /api/projects/:projectId/employees/available
 * @desc    Get all available employees for assignment
 * @access  Private
 */
router.get('/available', projectEmployeeController.getAllAvailableEmployees);

/**
 * @route   POST /api/projects/:projectId/employees
 * @desc    Assign an employee to a project
 * @access  Private
 */
router.post('/', projectEmployeeController.assignEmployeeToProject);

/**
 * @route   PUT /api/projects/:projectId/employees/:employeeId
 * @desc    Update an employee's status in a project
 * @access  Private
 */
router.put('/:employeeId', projectEmployeeController.updateEmployeeStatus);

/**
 * @route   PUT /api/projects/:projectId/employees/operational
 * @desc    Set all project employees to operational status
 * @access  Private
 */
router.put('/operational/all', projectEmployeeController.setEmployeesToOperational);

/**
 * @route   DELETE /api/projects/:projectId/employees/:employeeId
 * @desc    Remove an employee from a project
 * @access  Private
 */
router.delete('/:employeeId', projectEmployeeController.removeEmployeeFromProject);

module.exports = router; 