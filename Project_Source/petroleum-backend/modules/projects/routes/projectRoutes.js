const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../../../middleware/auth');

// Validation middleware
const projectValidation = [
    body('name').trim().notEmpty().withMessage('Le nom du projet est requis'),
    body('clientName').trim().notEmpty().withMessage('Le nom du client est requis'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('startDate').isISO8601().withMessage('Date de début invalide'),
    body('endDate').isISO8601().withMessage('Date de fin invalide'),
    body('status').isIn(['En cours', 'Fermé', 'Annulé']).withMessage('Statut invalide')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Project routes
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectValidation, projectController.createProject);
router.put('/:id', projectValidation, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

/**
 * @route   PATCH /api/projects/:id/status
 * @desc    Update project status
 * @access  Private
 */
router.patch('/:id/status', projectController.updateProjectStatus);

// Equipment routes
router.post('/:projectId/equipment', projectController.addProjectEquipment);
router.get('/:projectId/equipment/:dossierType', projectController.getProjectEquipment);
router.delete('/:projectId/equipment/:equipmentId/:dossierType', projectController.removeProjectEquipment);

module.exports = router; 