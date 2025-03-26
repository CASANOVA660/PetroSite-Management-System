const Document = require('../models/Document');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Get all documents for a project
exports.getProjectDocuments = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { category } = req.query;

        const query = { project: projectId, isDeleted: false };
        if (category) query.category = category;

        const documents = await Document.find(query)
            .populate('uploadedBy', 'name surname')
            .sort({ uploadDate: -1 });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching project documents:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
    }
};

// Upload a new document
exports.uploadDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, category } = req.body;
        const { projectId } = req.params;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Handle file upload (assuming multer middleware is used)
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
        }

        const document = new Document({
            name,
            description,
            category,
            project: projectId,
            uploadedBy: req.user._id,
            fileUrl: req.file.path, // Assuming multer saves the file path
            fileType: req.file.mimetype
        });

        await document.save();
        await document.populate('uploadedBy', 'name surname');

        res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload du document' });
    }
};

// Update document
exports.updateDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const document = await Document.findById(req.params.documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document non trouvé' });
        }

        // Check if user has permission to update
        if (document.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à modifier ce document' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            document[key] = updates[key];
        });

        await document.save();
        await document.populate('uploadedBy', 'name surname');

        res.json(document);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du document' });
    }
};

// Delete document (soft delete)
exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document non trouvé' });
        }

        // Check if user has permission to delete
        if (document.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce document' });
        }

        document.isDeleted = true;
        await document.save();

        res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du document' });
    }
}; 