const meetService = require('../services/meetService');
const ApiError = require('../../../utils/ApiError');
const catchAsync = require('../../../utils/catchAsync');
const logger = require('../../../utils/logger');

/**
 * Crée une nouvelle réunion
 * @route POST /api/meetings
 */
const createMeeting = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const meetData = {
        ...req.body,
        creator: userId
    };

    const meeting = await meetService.createMeeting(meetData);
    res.status(201).json({
        success: true,
        data: meeting
    });
});

/**
 * Récupère une réunion par son ID
 * @route GET /api/meetings/:id
 */
const getMeetingById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const meeting = await meetService.getMeetingById(id);

    if (!meeting) {
        throw new ApiError(404, 'Réunion non trouvée');
    }

    res.status(200).json({
        success: true,
        data: meeting
    });
});

/**
 * Récupère les réunions pour l'utilisateur connecté
 * @route GET /api/meetings
 */
const getMeetingsForUser = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const filters = {
        type: req.query.type, // 'upcoming' ou 'past'
        projectId: req.query.projectId,
        status: req.query.status
    };

    const meetings = await meetService.getMeetingsForUser(userId, filters);

    res.status(200).json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

/**
 * Récupère les réunions pour un projet spécifique
 * @route GET /api/projects/:projectId/meetings
 */
const getMeetingsForProject = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const filters = {
        type: req.query.type, // 'upcoming' ou 'past'
        status: req.query.status
    };

    const meetings = await meetService.getMeetingsForProject(projectId, filters);

    res.status(200).json({
        success: true,
        count: meetings.length,
        data: meetings
    });
});

/**
 * Met à jour une réunion
 * @route PUT /api/meetings/:id
 */
const updateMeeting = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier si l'utilisateur est le créateur de la réunion
    const meeting = await meetService.getMeetingById(id);

    if (!meeting) {
        throw new ApiError(404, 'Réunion non trouvée');
    }

    if (meeting.creator._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Vous n\'êtes pas autorisé à modifier cette réunion');
    }

    const updatedMeeting = await meetService.updateMeeting(id, updateData);

    res.status(200).json({
        success: true,
        data: updatedMeeting
    });
});

/**
 * Annule une réunion (change son statut à 'cancelled')
 * @route PATCH /api/meetings/:id/cancel
 */
const cancelMeeting = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Vérifier si l'utilisateur est le créateur de la réunion
    const meeting = await meetService.getMeetingById(id);

    if (!meeting) {
        throw new ApiError(404, 'Réunion non trouvée');
    }

    if (meeting.creator._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Vous n\'êtes pas autorisé à annuler cette réunion');
    }

    const cancelledMeeting = await meetService.cancelMeeting(id);

    res.status(200).json({
        success: true,
        data: cancelledMeeting
    });
});

/**
 * Supprime une réunion
 * @route DELETE /api/meetings/:id
 */
const deleteMeeting = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Vérifier si l'utilisateur est le créateur de la réunion
    const meeting = await meetService.getMeetingById(id);

    if (!meeting) {
        throw new ApiError(404, 'Réunion non trouvée');
    }

    if (meeting.creator._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Vous n\'êtes pas autorisé à supprimer cette réunion');
    }

    await meetService.deleteMeeting(id);

    res.status(200).json({
        success: true,
        message: 'Réunion supprimée avec succès'
    });
});

/**
 * Ajoute une note à une réunion
 * @route POST /api/meetings/:id/notes
 */
const addNoteToMeeting = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const noteData = {
        ...req.body,
        author: userId,
        createdAt: new Date()
    };

    const meeting = await meetService.addNoteToMeeting(id, noteData);

    res.status(200).json({
        success: true,
        data: meeting
    });
});

/**
 * Ajoute une pièce jointe à une réunion
 * @route POST /api/meetings/:id/attachments
 */
const addAttachmentToMeeting = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    // Si un fichier a été téléchargé via multer ou un autre middleware
    if (!req.file) {
        throw new ApiError(400, 'Aucun fichier n\'a été téléchargé');
    }

    const attachmentData = {
        filename: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: userId,
        uploadedAt: new Date()
    };

    const meeting = await meetService.addAttachmentToMeeting(id, attachmentData);

    res.status(200).json({
        success: true,
        data: meeting
    });
});

/**
 * Génère un lien Google Meet pour une réunion existante
 * @route POST /api/meetings/:id/generate-meet-link
 */
const generateMeetLink = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Vérifier si l'utilisateur est le créateur de la réunion
    const meeting = await meetService.getMeetingById(id);

    if (!meeting) {
        throw new ApiError(404, 'Réunion non trouvée');
    }

    if (meeting.creator._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Vous n\'êtes pas autorisé à modifier cette réunion');
    }

    // Si un lien existe déjà, retourner celui-ci
    if (meeting.meetLink) {
        return res.status(200).json({
            success: true,
            data: {
                meetLink: meeting.meetLink
            }
        });
    }

    // Sinon, générer un nouveau lien via le service Google Calendar
    // En pratique, on utiliserait meetService.updateMeeting avec un flag spécial
    const updatedMeeting = await meetService.updateMeeting(id, { regenerateMeetLink: true });

    res.status(200).json({
        success: true,
        data: {
            meetLink: updatedMeeting.meetLink
        }
    });
});

module.exports = {
    createMeeting,
    getMeetingById,
    getMeetingsForUser,
    getMeetingsForProject,
    updateMeeting,
    cancelMeeting,
    deleteMeeting,
    addNoteToMeeting,
    addAttachmentToMeeting,
    generateMeetLink
}; 