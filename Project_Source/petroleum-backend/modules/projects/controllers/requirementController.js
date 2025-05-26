const Requirement = require('../models/Requirement');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

/**
 * Get all requirements for a specific project
 */
exports.getProjectRequirements = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Get requirements for the project
        const requirements = await Requirement.find({
            projectId: projectId,
            isDeleted: false
        }).sort({ createdAt: -1 });

        // Format requirements for API response
        const formattedRequirements = requirements.map(req => req.toAPI());

        res.status(200).json({
            success: true,
            data: formattedRequirements
        });
    } catch (error) {
        logger.error('Error in getProjectRequirements:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la récupération des exigences'
        });
    }
};

/**
 * Get a specific requirement by ID
 */
exports.getRequirementById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate requirement ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID d\'exigence invalide'
            });
        }

        // Find requirement
        const requirement = await Requirement.findOne({
            _id: id,
            isDeleted: false
        });

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message: 'Exigence non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: requirement.toAPI()
        });
    } catch (error) {
        logger.error('Error in getRequirementById:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la récupération de l\'exigence'
        });
    }
};

/**
 * Create a new requirement for a project
 */
exports.createRequirement = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { projectId } = req.params;
        const { content, type } = req.body;
        const userId = req.user.id;

        // Validate projectId format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Create new requirement
        const requirement = new Requirement({
            content,
            type,
            projectId,
            createdBy: userId
        });

        await requirement.save();

        // Notify about new requirement (optional)
        if (global.io) {
            global.io.to(projectId).emit('requirement-update', {
                action: 'created',
                requirement: requirement.toAPI()
            });
        }

        res.status(201).json({
            success: true,
            data: requirement.toAPI(),
            message: 'Exigence créée avec succès'
        });
    } catch (error) {
        logger.error('Error in createRequirement:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de l\'exigence'
        });
    }
};

/**
 * Update a requirement
 */
exports.updateRequirement = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { id, projectId } = req.params;
        const { content, type } = req.body;
        const userId = req.user.id;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        // Find requirement
        const requirement = await Requirement.findOne({
            _id: id,
            projectId: projectId,
            isDeleted: false
        });

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message: 'Exigence non trouvée'
            });
        }

        // Update requirement
        requirement.content = content;
        requirement.type = type;
        requirement.updatedBy = userId;
        await requirement.save();

        // Notify about update (optional)
        if (global.io) {
            global.io.to(projectId).emit('requirement-update', {
                action: 'updated',
                requirement: requirement.toAPI()
            });
        }

        res.status(200).json({
            success: true,
            data: requirement.toAPI(),
            message: 'Exigence mise à jour avec succès'
        });
    } catch (error) {
        logger.error('Error in updateRequirement:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour de l\'exigence'
        });
    }
};

/**
 * Delete a requirement (soft delete)
 */
exports.deleteRequirement = async (req, res) => {
    try {
        const { id, projectId } = req.params;
        const userId = req.user.id;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        // Find requirement
        const requirement = await Requirement.findOne({
            _id: id,
            projectId: projectId,
            isDeleted: false
        });

        if (!requirement) {
            return res.status(404).json({
                success: false,
                message: 'Exigence non trouvée'
            });
        }

        // Soft delete
        requirement.isDeleted = true;
        requirement.updatedBy = userId;
        await requirement.save();

        // Notify about deletion (optional)
        if (global.io) {
            global.io.to(projectId).emit('requirement-update', {
                action: 'deleted',
                requirementId: id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Exigence supprimée avec succès'
        });
    } catch (error) {
        logger.error('Error in deleteRequirement:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression de l\'exigence'
        });
    }
}; 