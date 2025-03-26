const Project = require('../models/Project');

// List all projects
exports.listProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .sort({ creationDate: -1 })
            .populate('createdBy', 'nom prenom');

        res.status(200).json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des projets',
            error: error.message
        });
    }
};

// Get a single project
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'nom prenom');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du projet',
            error: error.message
        });
    }
};

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { name, clientName, description, startDate, endDate, status } = req.body;

        // Validate required fields
        if (!name || !clientName || !description || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs requis doivent être remplis',
                missingFields: {
                    name: !name,
                    clientName: !clientName,
                    description: !description,
                    startDate: !startDate,
                    endDate: !endDate
                }
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'La date de début doit être antérieure à la date de fin'
            });
        }

        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            console.error('User not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        // Create new project with all required fields
        const project = new Project({
            name,
            clientName,
            description,
            startDate: start,
            endDate: end,
            status: status || 'En cours',
            createdBy: req.user._id,
            projectNumber: `PROJ-${new Date().getFullYear()}-${(await Project.countDocuments() + 1).toString().padStart(3, '0')}`
        });

        // Save project
        await project.save();

        // Populate the createdBy field
        await project.populate('createdBy', 'nom prenom');

        console.log('Project created successfully:', project);

        res.status(201).json({
            success: true,
            message: 'Projet créé avec succès',
            data: project
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du projet',
            error: error.message
        });
    }
}; 