const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const shiftValidation = [
    body('employeeId').notEmpty().withMessage('L\'identifiant de l\'employé est requis'),
    body('date').isISO8601().withMessage('Date invalide'),
    body('type').isIn(['day', 'night']).withMessage('Type de quart invalide'),
    body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Format d\'heure de début invalide (HH:MM)'),
    body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Format d\'heure de fin invalide (HH:MM)'),
    body('status').optional().isIn(['scheduled', 'completed', 'absent']).withMessage('Statut invalide')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/projects/shifts/test
 * @desc    Test route for shifts
 * @access  Private
 */
router.get('/shifts/test', (req, res) => {
    console.log('Shift test route accessed');
    res.status(200).json({ success: true, message: 'Shift routes are working correctly' });
});

/**
 * @route   GET /api/projects/:projectId/shifts
 * @desc    Get all shifts for a project
 * @access  Private
 */
router.get('/:projectId/shifts', shiftController.getProjectShifts);

/**
 * @route   POST /api/projects/:projectId/shifts
 * @desc    Create a new shift
 * @access  Private
 */
router.post('/:projectId/shifts', shiftValidation, shiftController.createShift);

/**
 * @route   PUT /api/projects/shifts/:shiftId
 * @desc    Update a shift
 * @access  Private
 */
router.put('/shifts/:shiftId', shiftValidation, shiftController.updateShift);

/**
 * @route   DELETE /api/projects/:projectId/shifts/:shiftId
 * @desc    Delete a shift
 * @access  Private
 */
router.delete('/:projectId/shifts/:shiftId', shiftController.deleteShift);

module.exports = router; 