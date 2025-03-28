const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name surname');
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des projets' });
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name surname');

        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du projet' });
    }
};

// Create new project
exports.createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, clientName, description, startDate, endDate, status } = req.body;

        // Generate project number (PRJ-YYYY-XXXX)
        const year = new Date().getFullYear();
        const lastProject = await Project.findOne({
            projectNumber: new RegExp(`^PRJ-${year}-`)
        }).sort({ projectNumber: -1 });

        let sequence = 1;
        if (lastProject) {
            const lastSequence = parseInt(lastProject.projectNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        const projectNumber = `PRJ-${year}-${sequence.toString().padStart(4, '0')}`;

        const project = new Project({
            name,
            clientName,
            description,
            startDate,
            endDate,
            status,
            projectNumber,
            createdBy: req.user._id
        });

        await project.save();
        await project.populate('createdBy', 'name surname');

        res.status(201).json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Erreur lors de la création du projet' });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Check if user has permission to update
        if (project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à modifier ce projet' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            project[key] = updates[key];
        });

        await project.save();
        await project.populate('createdBy', 'name surname');

        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du projet' });
    }
};

// Delete project (soft delete)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        // Check if user has permission to delete
        if (project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce projet' });
        }

        project.isDeleted = true;
        await project.save();

        res.json({ message: 'Projet supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du projet' });
    }
}; 