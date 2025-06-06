const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const axios = require('axios');
const taskService = require('../../tasks/services/task.service');
const logger = require('../../../utils/logger');
const Notification = require('../../notifications/models/Notification');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name surname');

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des projets'
        });
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    try {
        console.log(`[getProjectById] Request to fetch project with ID: ${req.params.id}`);
        console.log(`[getProjectById] Request params:`, req.params);

        // Check if ID is valid MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[getProjectById] Invalid MongoDB ObjectId format: ${req.params.id}`);
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }

        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name surname');

        if (!project) {
            console.log(`[getProjectById] Project not found with ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        console.log(`[getProjectById] Project found:`, {
            id: project._id,
            name: project.name,
            clientName: project.clientName,
            createdBy: project.createdBy
        });

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('[getProjectById] Error fetching project:', error);

        // Check if error is related to invalid ID format
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Format d\'ID de projet invalide'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du projet'
        });
    }
};

// Create new project
exports.createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, clientName, description, startDate, endDate, status, createdBy } = req.body;

        // Get the user ID from either the request body or the authenticated user
        const userId = createdBy || req.user.id;

        if (!userId) {
            console.error('No user ID available for project creation');
            return res.status(400).json({
                success: false,
                message: 'User ID is required to create a project'
            });
        }

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
            createdBy: userId
        });

        await project.save();
        await project.populate('createdBy', 'name surname');

        // Return a consistent response format with success flag and data
        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du projet'
        });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        console.log(`[updateProject] Request to update project with ID: ${req.params.id}`);
        console.log(`[updateProject] Request body:`, req.body);
        console.log(`[updateProject] User:`, req.user ? { id: req.user._id, name: req.user.name } : 'Not authenticated');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(`[updateProject] Validation errors:`, errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Verify authentication first
        if (!req.user || !req.user._id) {
            console.log(`[updateProject] Authentication required`);
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        // Check if ID is valid MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[updateProject] Invalid MongoDB ObjectId format: ${req.params.id}`);
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            console.log(`[updateProject] Project not found with ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        console.log(`[updateProject] Project found:`, {
            id: project._id,
            name: project.name,
            createdBy: project.createdBy
        });

        // Check if user has permission to update
        if (project.createdBy && req.user._id && project.createdBy.toString() !== req.user._id.toString()) {
            console.log(`[updateProject] User ${req.user._id} not authorized to update project ${project._id}`);
            console.log(`[updateProject] Project createdBy: ${project.createdBy}`);
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier ce projet'
            });
        }

        const updates = req.body;
        console.log(`[updateProject] Applying updates:`, updates);

        Object.keys(updates).forEach(key => {
            project[key] = updates[key];
        });

        await project.save();
        await project.populate('createdBy', 'name surname');

        console.log(`[updateProject] Project updated successfully:`, {
            id: project._id,
            name: project.name
        });

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('[updateProject] Error updating project:', error);

        // Check if error is related to invalid ID format
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Format d\'ID de projet invalide'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du projet'
        });
    }
};

// Delete project (soft delete)
exports.deleteProject = async (req, res) => {
    try {
        // Verify authentication first
        if (!req.user || !req.user._id) {
            console.log('Authentication required for delete operation');
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        console.log(`Attempting to delete project ${req.params.id} by user ${req.user._id}`);

        const project = await Project.findById(req.params.id);
        if (!project) {
            console.log(`Project with ID ${req.params.id} not found`);
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        console.log(`Project found: ${project._id}`);
        console.log(`Project creator: ${project.createdBy}`);
        console.log(`Current user: ${req.user._id}`);

        // Check if user has permission to delete
        if (project.createdBy && req.user._id && project.createdBy.toString() !== req.user._id.toString()) {
            console.log('User not authorized to delete project');
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer ce projet'
            });
        }

        project.isDeleted = true;
        await project.save();
        console.log(`Project ${project._id} marked as deleted`);

        res.json({
            success: true,
            message: 'Projet supprimé avec succès'
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du projet'
        });
    }
};

// Add equipment to project
exports.addProjectEquipment = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { equipment: equipmentList, needsValidation, validationReason, chefDeBaseId, projectName } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Process each equipment item
        for (const item of equipmentList) {
            const existingIndex = project.equipment.findIndex(
                eq => eq.equipmentId.toString() === item.equipment._id
            );

            if (existingIndex !== -1) {
                // Update existing equipment
                project.equipment[existingIndex] = {
                    equipmentId: item.equipment._id,
                    description: item.description,
                    dossierType: item.dossierType
                };
            } else {
                // Add new equipment
                project.equipment.push({
                    equipmentId: item.equipment._id,
                    description: item.description,
                    dossierType: item.dossierType
                });
            }
        }

        await project.save();

        // If validation is needed, create a task
        if (needsValidation && chefDeBaseId) {
            try {
                const taskData = {
                    title: `Validation d'équipement pour ${projectName || project.nom}`,
                    description: `Validation demandée pour les équipements suivants:\n${equipmentList.map(e => `- ${e.equipment.nom} (${e.equipment.reference})`).join('\n')}\n\nRaison: ${validationReason}`,
                    status: 'todo',
                    priority: 'high',
                    assignee: chefDeBaseId,
                    creator: req.user._id,
                    needsValidation: true,
                    tags: ['Equipment Validation', 'Project'],
                    projectId: project._id,
                    category: 'equipment_validation'
                };

                const task = await taskService.createTask(taskData);

                // Create notification for Chef de Base
                const notification = await Notification.create({
                    type: 'EQUIPMENT_VALIDATION_REQUESTED',
                    message: `Une demande de validation d'équipement a été créée pour le projet "${projectName || project.nom}"`,
                    userId: chefDeBaseId,
                    isRead: false,
                    metadata: {
                        taskId: task._id,
                        projectId: project._id,
                        equipmentCount: equipmentList.length
                    }
                });

                // Send real-time notification via socket
                if (global.io) {
                    const socketId = global.userSockets?.get(String(chefDeBaseId));
                    if (socketId) {
                        global.io.to(socketId).emit('notification', {
                            type: 'NEW_NOTIFICATION',
                            payload: {
                                _id: notification._id,
                                type: 'EQUIPMENT_VALIDATION_REQUESTED',
                                message: `Une demande de validation d'équipement a été créée pour le projet "${projectName || project.nom}"`,
                                userId: chefDeBaseId,
                                metadata: {
                                    taskId: task._id,
                                    projectId: project._id,
                                    equipmentCount: equipmentList.length
                                },
                                isRead: false,
                                createdAt: new Date()
                            }
                        });
                        logger.info(`Socket notification sent to Chef de Base (${chefDeBaseId}) for equipment validation task`);
                    } else {
                        logger.warn(`Chef de Base (${chefDeBaseId}) not connected to socket for equipment validation notification`);
                    }
                }

                logger.info(`Created equipment validation task and notification for project ${project._id}`);
            } catch (error) {
                logger.error('Error creating validation task or notification:', error);
                // Don't fail the whole request if task creation fails
            }
        }

        res.status(200).json({
            success: true,
            data: project.equipment
        });
    } catch (error) {
        logger.error('Error adding equipment to project:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'ajout des équipements au projet'
        });
    }
};

// Get project equipment
exports.getProjectEquipment = async (req, res) => {
    try {
        const { projectId, dossierType } = req.params;

        const project = await Project.findById(projectId)
            .populate('equipment.equipmentId');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        const equipment = project.equipment.filter(e => e.dossierType === dossierType);

        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        console.error('Error fetching project equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'équipement'
        });
    }
};

// Remove equipment from project
exports.removeProjectEquipment = async (req, res) => {
    try {
        const { projectId, equipmentId, dossierType } = req.params;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Remove equipment from the array
        project.equipment = project.equipment.filter(
            e => !(e.equipmentId.toString() === equipmentId && e.dossierType === dossierType)
        );

        await project.save();

        res.json({
            success: true,
            message: 'Équipement supprimé avec succès'
        });
    } catch (error) {
        console.error('Error removing project equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'équipement'
        });
    }
};

// Update project status
exports.updateProjectStatus = async (req, res) => {
    try {
        console.log(`[updateProjectStatus] Request to update status of project with ID: ${req.params.id}`);
        console.log(`[updateProjectStatus] Request body:`, req.body);
        console.log(`[updateProjectStatus] User:`, req.user ? { id: req.user._id, name: req.user.name } : 'Not authenticated');

        const { status, statusNote } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Le statut est requis'
            });
        }

        // Verify authentication first
        if (!req.user || !req.user._id) {
            console.log(`[updateProjectStatus] Authentication required`);
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        // Check if user role is Manager
        if (req.user.role !== 'Manager') {
            console.log(`[updateProjectStatus] User ${req.user._id} is not a Manager`);
            return res.status(403).json({
                success: false,
                message: 'Seul un Manager peut modifier le statut du projet'
            });
        }

        // Check if ID is valid MongoDB ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.log(`[updateProjectStatus] Invalid MongoDB ObjectId format: ${req.params.id}`);
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            console.log(`[updateProjectStatus] Project not found with ID: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Update status and statusNote
        project.status = status;
        project.statusNote = statusNote || '';

        await project.save();
        await project.populate('createdBy', 'name surname');

        console.log(`[updateProjectStatus] Project status updated successfully:`, {
            id: project._id,
            name: project.name,
            status: project.status,
            statusNote: project.statusNote
        });

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('[updateProjectStatus] Error updating project status:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut du projet'
        });
    }
}; 