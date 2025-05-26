const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const requirementController = require('../controllers/requirementController');
const authMiddleware = require('../../../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all requirements for a project
router.get('/project/:projectId', requirementController.getProjectRequirements);

// Get a single requirement
router.get('/:id', requirementController.getRequirementById);

// Create a new requirement
router.post('/project/:projectId', [
    check('content', 'Le contenu est requis').not().isEmpty(),
    check('type', 'Le type est requis').not().isEmpty().isIn(['REGULATORY', 'TECHNICAL', 'BUSINESS', 'ENVIRONMENTAL', 'SAFETY', 'OTHER'])
], requirementController.createRequirement);

// Update a requirement
router.put('/:id/project/:projectId', [
    check('content', 'Le contenu est requis').not().isEmpty(),
    check('type', 'Le type est requis').not().isEmpty().isIn(['REGULATORY', 'TECHNICAL', 'BUSINESS', 'ENVIRONMENTAL', 'SAFETY', 'OTHER'])
], requirementController.updateRequirement);

// Delete a requirement
router.delete('/:id/project/:projectId', requirementController.deleteRequirement);

module.exports = router; 