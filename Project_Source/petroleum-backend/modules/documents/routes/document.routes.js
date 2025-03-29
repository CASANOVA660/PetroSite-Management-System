const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body } = require('express-validator');
const authMiddleware = require('../../../middleware/auth');
const documentController = require('../controllers/document.controller');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only specific file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, and GIF files are allowed.'));
        }
    }
});

// Validation middleware
const validateProjectId = [
    body('projectId')
        .trim()
        .notEmpty()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Invalid project ID format')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get documents for each category
router.get('/project/:projectId/documents-globale', documentController.getDocumentsGlobale);
router.get('/project/:projectId/dossier-administratif', documentController.getDossierAdministratif);
router.get('/project/:projectId/dossier-technique', documentController.getDossierTechnique);
router.get('/project/:projectId/dossier-rh', documentController.getDossierRH);
router.get('/project/:projectId/dossier-hse', documentController.getDossierHSE);

// Upload documents for each category
router.post('/documents-globale/upload', upload.single('file'), validateProjectId, documentController.uploadDocumentsGlobale);
router.post('/dossier-administratif/upload', upload.single('file'), validateProjectId, documentController.uploadDossierAdministratif);
router.post('/dossier-technique/upload', upload.single('file'), validateProjectId, documentController.uploadDossierTechnique);
router.post('/dossier-rh/upload', upload.single('file'), validateProjectId, documentController.uploadDossierRH);
router.post('/dossier-hse/upload', upload.single('file'), validateProjectId, documentController.uploadDossierHSE);

// Delete document
router.delete('/:id', documentController.deleteDocument);

module.exports = router;