const documentService = require('../services/document.service');

// Get documents for each category
exports.getDocumentsGlobale = async (req, res) => {
    try {
        const documents = await documentService.getProjectDocuments({
            projectId: req.params.projectId,
            category: 'Documents globale'
        });
        res.json(documents);
    } catch (error) {
        console.error('Error in getDocumentsGlobale:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDossierAdministratif = async (req, res) => {
    try {
        const documents = await documentService.getProjectDocuments({
            projectId: req.params.projectId,
            category: 'Dossier Administratif'
        });
        res.json(documents);
    } catch (error) {
        console.error('Error in getDossierAdministratif:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDossierTechnique = async (req, res) => {
    try {
        const documents = await documentService.getProjectDocuments({
            projectId: req.params.projectId,
            category: 'Dossier Technique'
        });
        res.json(documents);
    } catch (error) {
        console.error('Error in getDossierTechnique:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDossierRH = async (req, res) => {
    try {
        const documents = await documentService.getProjectDocuments({
            projectId: req.params.projectId,
            category: 'Dossier RH'
        });
        res.json(documents);
    } catch (error) {
        console.error('Error in getDossierRH:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDossierHSE = async (req, res) => {
    try {
        const documents = await documentService.getProjectDocuments({
            projectId: req.params.projectId,
            category: 'Dossier HSE'
        });
        res.json(documents);
    } catch (error) {
        console.error('Error in getDossierHSE:', error);
        res.status(500).json({ message: error.message });
    }
};

// Upload documents for each category
exports.uploadDocumentsGlobale = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Uploading document globale:', {
            fileName: req.file.originalname,
            projectId: req.body.projectId,
            userId: req.user.id
        });

        const document = await documentService.uploadDocument(
            req.file,
            'Documents globale',
            req.body.projectId,
            req.user.id
        );

        res.status(201).json(document);
    } catch (error) {
        console.error('Error in uploadDocumentsGlobale:', error);
        res.status(500).json({ message: error.message });
    }
};

// document.controller.js
exports.uploadDossierAdministratif = async (req, res) => {
    try {
        console.log('[SERVER] Uploading to Dossier Administratif'); // Add this
        const document = await documentService.uploadDocument(
            req.file,
            'Dossier Administratif', // Hardcoded
            req.body.projectId,
            req.user.id
        );
        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.uploadDossierTechnique = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Uploading dossier technique:', {
            fileName: req.file.originalname,
            projectId: req.body.projectId,
            userId: req.user.id
        });

        const document = await documentService.uploadDocument(
            req.file,
            'Dossier Technique',
            req.body.projectId,
            req.user.id
        );

        res.status(201).json(document);
    } catch (error) {
        console.error('Error in uploadDossierTechnique:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadDossierRH = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Uploading dossier RH:', {
            fileName: req.file.originalname,
            projectId: req.body.projectId,
            userId: req.user.id
        });

        const document = await documentService.uploadDocument(
            req.file,
            'Dossier RH',
            req.body.projectId,
            req.user.id
        );

        res.status(201).json(document);
    } catch (error) {
        console.error('Error in uploadDossierRH:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadDossierHSE = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        console.log('Uploading dossier HSE:', {
            fileName: req.file.originalname,
            projectId: req.body.projectId,
            userId: req.user.id
        });

        const document = await documentService.uploadDocument(
            req.file,
            'Dossier HSE',
            req.body.projectId,
            req.user.id
        );

        res.status(201).json(document);
    } catch (error) {
        console.error('Error in uploadDossierHSE:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const document = await documentService.deleteDocument(req.params.id);
        res.json({ message: 'Document deleted successfully', document });
    } catch (error) {
        console.error('Error in deleteDocument:', error);
        res.status(500).json({ message: error.message });
    }
};