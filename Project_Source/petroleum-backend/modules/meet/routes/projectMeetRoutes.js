const express = require('express');
const authMiddleware = require('../../../middleware/auth');
const meetController = require('../controllers/meetController');
const router = express.Router({ mergeParams: true });

// Protection de toutes les routes avec middleware d'authentification
router.use(authMiddleware);

// Route pour récupérer les réunions d'un projet
// Cette route sera accessible via /api/projects/:projectId/meetings
router.get('/', meetController.getMeetingsForProject);

module.exports = router; 