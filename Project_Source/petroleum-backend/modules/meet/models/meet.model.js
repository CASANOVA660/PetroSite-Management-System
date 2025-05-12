const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma pour les participants externes
const ExternalParticipantSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    organization: {
        type: String
    }
});

// Schéma pour les notes
const NoteSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Schéma pour les pièces jointes
const AttachmentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    size: {
        type: String
    },
    type: {
        type: String
    },
    url: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Schéma principal pour les réunions
const MeetSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 60 // Durée par défaut en minutes
    },
    meetLink: {
        type: String,
        trim: true
    },
    googleCalendarEventId: {
        type: String,
        trim: true
    },
    calendarEventId: {
        type: String
    },
    calendarLink: {
        type: String
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    externalParticipants: [ExternalParticipantSchema],
    notes: [NoteSchema],
    attachments: [AttachmentSchema],
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Meet', MeetSchema); 