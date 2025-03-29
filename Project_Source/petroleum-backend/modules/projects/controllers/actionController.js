const Action = require('../models/Action');
const Project = require('../models/Project');
const Equipment = require('../models/Equipment');
const User = require('../../users/models/User');
const { validationResult } = require('express-validator');

// Get all actions for a project
exports.getProjectActions = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { type, status, priority } = req.query;

        const query = { project: projectId, isDeleted: false };
        if (type) query.type = type;
        if (status) query.status = status;
        if (priority) query.priority = priority;

        const actions = await Action.find(query)
            .populate('createdBy', 'name surname')
            .populate('assignedTo', 'name surname')
            .populate('attachments')
            .populate('relatedEquipment')
            .sort({ createdAt: -1 });

        res.json(actions);
    } catch (error) {
        console.error('Error fetching project actions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des actions' });
    }
};

// Create a new action
exports.createAction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            type,
            priority,
            dueDate,
            startDate,
            assignedTo,
            attachments,
            relatedEquipment
        } = req.body;

        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }

        const action = new Action({
            title,
            description,
            type,
            priority,
            dueDate,
            startDate,
            project: req.params.projectId,
            createdBy: req.user._id,
            assignedTo,
            attachments,
            relatedEquipment
        });

        await action.save();

        // Populate references
        await action.populate([
            { path: 'createdBy', select: 'name surname' },
            { path: 'assignedTo', select: 'name surname' },
            { path: 'attachments' },
            { path: 'relatedEquipment' }
        ]);

        res.status(201).json(action);
    } catch (error) {
        console.error('Error creating action:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'action' });
    }
};

// Update an action
exports.updateAction = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const action = await Action.findById(req.params.actionId);
        if (!action) {
            return res.status(404).json({ message: 'Action non trouvée' });
        }

        // Check if user has permission to update
        if (action.createdBy.toString() !== req.user._id.toString() &&
            action.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à modifier cette action' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            action[key] = updates[key];
        });

        // If status is being updated to completed, set completion date
        if (updates.status === 'completed') {
            action.completionDate = new Date();
        }

        await action.save();

        // Populate references
        await action.populate([
            { path: 'createdBy', select: 'name surname' },
            { path: 'assignedTo', select: 'name surname' },
            { path: 'attachments' },
            { path: 'relatedEquipment' }
        ]);

        res.json(action);
    } catch (error) {
        console.error('Error updating action:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'action' });
    }
};

// Delete an action (soft delete)
exports.deleteAction = async (req, res) => {
    try {
        const action = await Action.findById(req.params.actionId);
        if (!action) {
            return res.status(404).json({ message: 'Action non trouvée' });
        }

        // Check if user has permission to delete
        if (action.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette action' });
        }

        action.isDeleted = true;
        await action.save();

        res.json({ message: 'Action supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting action:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'action' });
    }
};

// Add a comment to an action
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const action = await Action.findById(req.params.actionId);

        if (!action) {
            return res.status(404).json({ message: 'Action non trouvée' });
        }

        action.comments.push({
            text,
            createdBy: req.user._id
        });

        await action.save();

        // Populate the new comment's createdBy field
        const lastComment = action.comments[action.comments.length - 1];
        await lastComment.populate('createdBy', 'name surname');

        res.status(201).json(lastComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire' });
    }
}; 