const express = require('express');
const router = express.Router();
const multer = require('multer');
const employeeController = require('../controllers/employee.controller');
const authMiddleware = require('../../../middleware/auth');

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

// Apply auth middleware to all routes
router.use(authMiddleware);

// Employee CRUD routes
router.post('/', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]), employeeController.createEmployee);

router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);

router.put('/:id', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]), employeeController.updateEmployee);

router.delete('/:id', employeeController.deleteEmployee);

// Folder management routes
router.post('/:employeeId/folders', employeeController.addFolder);
router.patch('/:employeeId/folders/:folderId', employeeController.renameFolder);
router.delete('/:employeeId/folders/:folderId', employeeController.deleteFolder);

// Document management routes
router.post('/:employeeId/folders/:folderId/documents', upload.single('file'), employeeController.addDocumentToFolder);
router.delete('/:employeeId/folders/:folderId/documents', employeeController.deleteDocumentFromFolder);

module.exports = router; 