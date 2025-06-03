const express = require('express');
const authMiddleware = require('../../../middleware/auth');
const meetController = require('../controllers/meetController');
const { upload } = require('../../../middleware/upload');
const router = express.Router();

// Protection de toutes les routes avec middleware d'authentification
router.use(authMiddleware);

// Routes pour les réunions
router.route('/')
    .post(meetController.createMeeting)
    .get(meetController.getMeetingsForUser);

router.route('/:id')
    .get(meetController.getMeetingById)
    .put(meetController.updateMeeting)
    .delete(meetController.deleteMeeting);

// Route pour annuler une réunion
router.patch('/:id/cancel', meetController.cancelMeeting);

// Route pour générer un lien Google Meet
router.post('/:id/generate-meet-link', meetController.generateMeetLink);

// Routes pour les notes de réunion
router.post('/:id/notes', meetController.addNoteToMeeting);

// Routes pour les pièces jointes de réunion
// Utilisation de multer pour le téléchargement de fichiers
router.post('/:id/attachments', upload.single('file'), meetController.addAttachmentToMeeting);

module.exports = router; 