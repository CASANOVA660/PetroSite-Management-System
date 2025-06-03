const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and documents
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Document upload for RAG
const ragDocumentFilter = (req, file, cb) => {
    // Accept only document types suitable for RAG
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/html',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, TXT, HTML, DOC, and DOCX files are allowed.'), false);
    }
};

// Create multer upload instance for RAG documents
const ragStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/rag-documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'rag-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadDocument = multer({
    storage: ragStorage,
    fileFilter: ragDocumentFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit for RAG documents
    }
}).single('document');

module.exports = {
    upload,
    uploadDocument
}; 