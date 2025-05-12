const Meeting = require('../models/meet.model');
const User = require('../../users/models/User');
const Project = require('../../projects/models/Project');
const emailService = require('./meetEmailService');
const logger = require('../../../utils/logger');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

/**
 * Crée une nouvelle réunion
 * @param {Object} meetData - Données de la réunion
 * @returns {Promise<Object>} - La réunion créée
 */
const createMeeting = async (meetData) => {
    try {
        // Vérifier si le projet existe si un projectId est fourni
        if (meetData.projectId) {
            const project = await Project.findById(meetData.projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }
            meetData.projectName = project.name; // Stocker le nom du projet pour les emails
        }

        // Créer l'événement dans Google Calendar et récupérer le lien Google Meet
        const calendarResult = await emailService.createGoogleCalendarEvent(meetData);

        if (calendarResult) {
            meetData.meetLink = calendarResult.meetLink;
            meetData.calendarEventId = calendarResult.calendarEventId;
        }

        // Créer la réunion dans la base de données
        const meeting = new Meeting(meetData);
        await meeting.save();

        // Collecter les emails des participants pour l'envoi des invitations
        const recipients = [];

        // Ajouter les emails des participants internes
        if (meeting.participants && meeting.participants.length > 0) {
            const participantIds = meeting.participants.map(p => p.toString());
            const users = await User.find({ _id: { $in: participantIds } }, 'email');

            users.forEach(user => {
                if (user.email) {
                    recipients.push(user.email);
                }
            });
        }

        // Ajouter les emails des participants externes
        if (meeting.externalParticipants && meeting.externalParticipants.length > 0) {
            meeting.externalParticipants.forEach(ext => {
                if (ext.email) {
                    recipients.push(ext.email);
                }
            });
        }

        // Envoyer les invitations par email
        if (recipients.length > 0) {
            await emailService.sendMeetingInvitation(meeting, recipients);
        }

        return meeting;
    } catch (error) {
        logger.error(`Error creating meeting: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère une réunion par son ID
 * @param {string} meetingId - ID de la réunion
 * @returns {Promise<Object>} - La réunion
 */
const getMeetingById = async (meetingId) => {
    try {
        const meeting = await Meeting.findById(meetingId)
            .populate('creator', 'firstName lastName email')
            .populate('participants', 'firstName lastName email')
            .populate('projectId', 'name');

        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        return meeting;
    } catch (error) {
        logger.error(`Error getting meeting by ID: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère les réunions pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} filters - Filtres (passées, à venir, projet spécifique...)
 * @returns {Promise<Array>} - Liste des réunions
 */
const getMeetingsForUser = async (userId, filters = {}) => {
    try {
        const query = {
            $or: [
                { creator: userId },
                { participants: userId }
            ]
        };

        // Filtre par projet
        if (filters.projectId) {
            query.projectId = filters.projectId;
        }

        // Filtre par date
        const now = new Date();
        if (filters.type === 'upcoming') {
            query.date = { $gte: now };
        } else if (filters.type === 'past') {
            query.date = { $lt: now };
        }

        // Filtre par statut
        if (filters.status) {
            query.status = filters.status;
        }

        const meetings = await Meeting.find(query)
            .populate('creator', 'firstName lastName email')
            .populate('participants', 'firstName lastName email')
            .populate('projectId', 'name')
            .sort({ date: filters.type === 'past' ? -1 : 1 }); // Tri par date, décroissant pour les réunions passées

        return meetings;
    } catch (error) {
        logger.error(`Error getting meetings for user: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère les réunions pour un projet
 * @param {string} projectId - ID du projet
 * @param {Object} filters - Filtres additionnels
 * @returns {Promise<Array>} - Liste des réunions
 */
const getMeetingsForProject = async (projectId, filters = {}) => {
    try {
        const query = { projectId };

        // Filtre par date
        const now = new Date();
        if (filters.type === 'upcoming') {
            query.date = { $gte: now };
        } else if (filters.type === 'past') {
            query.date = { $lt: now };
        }

        // Filtre par statut
        if (filters.status) {
            query.status = filters.status;
        }

        const meetings = await Meeting.find(query)
            .populate('creator', 'firstName lastName email')
            .populate('participants', 'firstName lastName email')
            .sort({ date: filters.type === 'past' ? -1 : 1 });

        return meetings;
    } catch (error) {
        logger.error(`Error getting meetings for project: ${error.message}`);
        throw error;
    }
};

/**
 * Met à jour une réunion
 * @param {string} meetingId - ID de la réunion
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - La réunion mise à jour
 */
const updateMeeting = async (meetingId, updateData) => {
    try {
        // Récupérer la réunion actuelle
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        // Vérifier si le projet existe si un nouveau projectId est fourni
        if (updateData.projectId && updateData.projectId !== meeting.projectId.toString()) {
            const project = await Project.findById(updateData.projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }
            updateData.projectName = project.name;
        }

        // Mise à jour de l'événement dans Google Calendar si nécessaire
        // (si date, titre, description, participants ont changé)
        const needsCalendarUpdate = updateData.date ||
            updateData.title ||
            updateData.description ||
            updateData.participants ||
            updateData.externalParticipants ||
            updateData.duration;

        if (needsCalendarUpdate && meeting.calendarEventId) {
            // Préparer les données de mise à jour pour Google Calendar
            const meetDataForCalendar = {
                ...meeting.toObject(),
                ...updateData
            };

            // Mettre à jour l'événement Google Calendar
            // Note: Ici, vous pourriez implémenter une méthode updateGoogleCalendarEvent dans meetEmailService
            const calendarResult = await emailService.createGoogleCalendarEvent(meetDataForCalendar);

            if (calendarResult) {
                updateData.meetLink = calendarResult.meetLink;
                updateData.calendarEventId = calendarResult.calendarEventId;
            }
        }

        // Mettre à jour la réunion dans la base de données
        const updatedMeeting = await Meeting.findByIdAndUpdate(
            meetingId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('creator', 'firstName lastName email')
            .populate('participants', 'firstName lastName email')
            .populate('projectId', 'name');

        // Collecter les emails des participants pour l'envoi des notifications
        const recipients = [];

        // Ajouter les emails des participants internes
        if (updatedMeeting.participants && updatedMeeting.participants.length > 0) {
            updatedMeeting.participants.forEach(p => {
                if (p.email) {
                    recipients.push(p.email);
                }
            });
        }

        // Ajouter les emails des participants externes
        if (updatedMeeting.externalParticipants && updatedMeeting.externalParticipants.length > 0) {
            updatedMeeting.externalParticipants.forEach(ext => {
                if (ext.email) {
                    recipients.push(ext.email);
                }
            });
        }

        // Envoyer les notifications de mise à jour par email
        if (recipients.length > 0) {
            await emailService.sendMeetingUpdateNotification(updatedMeeting, recipients, 'update');
        }

        return updatedMeeting;
    } catch (error) {
        logger.error(`Error updating meeting: ${error.message}`);
        throw error;
    }
};

/**
 * Annule une réunion (change son statut à 'cancelled')
 * @param {string} meetingId - ID de la réunion
 * @returns {Promise<Object>} - La réunion annulée
 */
const cancelMeeting = async (meetingId) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        // Mettre à jour le statut de la réunion
        meeting.status = 'cancelled';
        await meeting.save();

        // Collecter les emails des participants
        const recipients = [];

        // Ajouter les emails des participants internes
        if (meeting.participants && meeting.participants.length > 0) {
            const participantIds = meeting.participants.map(p => p.toString());
            const users = await User.find({ _id: { $in: participantIds } }, 'email');

            users.forEach(user => {
                if (user.email) {
                    recipients.push(user.email);
                }
            });
        }

        // Ajouter les emails des participants externes
        if (meeting.externalParticipants && meeting.externalParticipants.length > 0) {
            meeting.externalParticipants.forEach(ext => {
                if (ext.email) {
                    recipients.push(ext.email);
                }
            });
        }

        // Envoyer les notifications d'annulation par email
        if (recipients.length > 0) {
            await emailService.sendMeetingUpdateNotification(meeting, recipients, 'cancel');
        }

        return meeting;
    } catch (error) {
        logger.error(`Error cancelling meeting: ${error.message}`);
        throw error;
    }
};

/**
 * Supprime une réunion
 * @param {string} meetingId - ID de la réunion
 * @returns {Promise<boolean>} - Succès de la suppression
 */
const deleteMeeting = async (meetingId) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        // Supprimer l'événement du calendrier Google si nécessaire
        if (meeting.calendarEventId) {
            // Note: Vous pourriez implémenter une méthode deleteGoogleCalendarEvent dans meetEmailService
            // await emailService.deleteGoogleCalendarEvent(meeting.calendarEventId);
        }

        // Supprimer la réunion de la base de données
        await Meeting.findByIdAndDelete(meetingId);

        return true;
    } catch (error) {
        logger.error(`Error deleting meeting: ${error.message}`);
        throw error;
    }
};

/**
 * Ajoute une note à une réunion
 * @param {string} meetingId - ID de la réunion
 * @param {Object} noteData - Données de la note
 * @returns {Promise<Object>} - La réunion mise à jour
 */
const addNoteToMeeting = async (meetingId, noteData) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        meeting.notes.push(noteData);
        await meeting.save();

        return meeting;
    } catch (error) {
        logger.error(`Error adding note to meeting: ${error.message}`);
        throw error;
    }
};

/**
 * Ajoute une pièce jointe à une réunion
 * @param {string} meetingId - ID de la réunion
 * @param {Object} attachmentData - Données de la pièce jointe
 * @returns {Promise<Object>} - La réunion mise à jour
 */
const addAttachmentToMeeting = async (meetingId, attachmentData) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error('Réunion non trouvée');
        }

        meeting.attachments.push(attachmentData);
        await meeting.save();

        return meeting;
    } catch (error) {
        logger.error(`Error adding attachment to meeting: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createMeeting,
    getMeetingById,
    getMeetingsForUser,
    getMeetingsForProject,
    updateMeeting,
    cancelMeeting,
    deleteMeeting,
    addNoteToMeeting,
    addAttachmentToMeeting
}; 