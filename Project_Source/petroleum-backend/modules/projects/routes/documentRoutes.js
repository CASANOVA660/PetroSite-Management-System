const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../../../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté'));
        }
    }
});

// Validation middleware
const documentValidation = [
    body('name').trim().notEmpty().withMessage('Le nom du document est requis'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('category').isIn(['general', 'administrative', 'technical', 'hse', 'hr'])
        .withMessage('Catégorie de document invalide')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all documents for a project
router.get('/project/:projectId', documentController.getProjectDocuments);

// Upload a new document
router.post('/project/:projectId',
    upload.single('file'),
    documentValidation,
    documentController.uploadDocument
);

// Update document
router.put('/:documentId', documentValidation, documentController.updateDocument);

// Delete document
router.delete('/:documentId', documentController.deleteDocument);

module.exports = router; 