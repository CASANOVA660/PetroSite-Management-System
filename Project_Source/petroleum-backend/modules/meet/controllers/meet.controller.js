const MeetingService = require('../services/meet.service');
const logger = require('../../../utils/logger');

class MeetController {
    constructor() {
        this.meetingService = new MeetingService();
    }

    /**
     * Get all meetings
     */
    getAllMeetings = async (req, res) => {
        try {
            const meetings = await this.meetingService.getAllMeetings();
            return res.status(200).json(meetings);
        } catch (error) {
            logger.error(`Error fetching all meetings: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réunions' });
        }
    };

    /**
     * Get upcoming meetings
     */
    getUpcomingMeetings = async (req, res) => {
        try {
            const meetings = await this.meetingService.getUpcomingMeetings();
            return res.status(200).json(meetings);
        } catch (error) {
            logger.error(`Error fetching upcoming meetings: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réunions' });
        }
    };

    /**
     * Get past meetings
     */
    getPastMeetings = async (req, res) => {
        try {
            const meetings = await this.meetingService.getPastMeetings();
            return res.status(200).json(meetings);
        } catch (error) {
            logger.error(`Error fetching past meetings: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réunions' });
        }
    };

    /**
     * Get meeting by ID
     */
    getMeetingById = async (req, res) => {
        try {
            const { id } = req.params;
            const meeting = await this.meetingService.getMeetingById(id);

            if (!meeting) {
                return res.status(404).json({ error: 'Réunion non trouvée' });
            }

            return res.status(200).json(meeting);
        } catch (error) {
            logger.error(`Error fetching meeting by ID: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la réunion' });
        }
    };

    /**
     * Create a new meeting
     */
    createMeeting = async (req, res) => {
        try {
            const meetingData = req.body;

            // Set creator to current user if not specified
            if (!meetingData.creator && req.user) {
                meetingData.creator = req.user._id;
            }

            const meeting = await this.meetingService.createMeeting(meetingData);
            return res.status(201).json(meeting);
        } catch (error) {
            logger.error(`Error creating meeting: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la création de la réunion' });
        }
    };

    /**
     * Update a meeting
     */
    updateMeeting = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const meeting = await this.meetingService.updateMeeting(id, updateData);

            if (!meeting) {
                return res.status(404).json({ error: 'Réunion non trouvée' });
            }

            return res.status(200).json(meeting);
        } catch (error) {
            logger.error(`Error updating meeting: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la réunion' });
        }
    };

    /**
     * Delete a meeting
     */
    deleteMeeting = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.meetingService.deleteMeeting(id);

            if (!result) {
                return res.status(404).json({ error: 'Réunion non trouvée' });
            }

            return res.status(200).json({ message: 'Réunion supprimée avec succès' });
        } catch (error) {
            logger.error(`Error deleting meeting: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de la réunion' });
        }
    };

    /**
     * Get meetings by project ID
     */
    getMeetingsByProject = async (req, res) => {
        try {
            const { projectId } = req.params;
            const meetings = await this.meetingService.getMeetingsByProject(projectId);
            return res.status(200).json(meetings);
        } catch (error) {
            logger.error(`Error fetching meetings by project: ${error.message}`);
            return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des réunions du projet' });
        }
    };
}

module.exports = new MeetController(); 