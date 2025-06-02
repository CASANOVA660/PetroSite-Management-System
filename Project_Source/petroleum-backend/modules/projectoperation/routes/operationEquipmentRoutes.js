const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const operationEquipmentController = require('../controllers/operationEquipmentController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const equipmentValidation = [
    body('equipmentId').notEmpty().withMessage('L\'identifiant de l\'équipement est requis'),
    body('status').optional().isIn(['available', 'inUse', 'maintenance', 'reserved']).withMessage('Statut invalide'),
    body('location').optional().notEmpty().withMessage('La localisation ne peut pas être vide')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/projects/:projectId/operation/equipment
 * @desc    Get all operation equipment for a project
 * @access  Private
 */
router.get('/:projectId/operation/equipment', operationEquipmentController.getProjectOperationEquipment);

/**
 * @route   POST /api/projects/:projectId/operation/equipment
 * @desc    Add equipment to operation
 * @access  Private
 */
router.post('/:projectId/operation/equipment', equipmentValidation, operationEquipmentController.addOperationEquipment);

/**
 * @route   PUT /api/projects/:projectId/operation/equipment/:operationEquipmentId
 * @desc    Update operation equipment
 * @access  Private
 */
router.put('/:projectId/operation/equipment/:operationEquipmentId', operationEquipmentController.updateOperationEquipment);

/**
 * @route   DELETE /api/projects/:projectId/operation/equipment/:operationEquipmentId
 * @desc    Remove equipment from operation
 * @access  Private
 */
router.delete('/:projectId/operation/equipment/:operationEquipmentId', operationEquipmentController.removeOperationEquipment);

module.exports = router; 