const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre de l\'action est requis'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description de l\'action est requise'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Le type d\'action est requis'],
        enum: ['document', 'administrative', 'technical', 'hr', 'hse', 'planning', 'requirement', 'traceability', 'status']
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Le projet est requis']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur qui a créé l\'action est requis']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dueDate: {
        type: Date
    },
    startDate: {
        type: Date
    },
    completionDate: {
        type: Date
    },
    attachments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],
    comments: [{
        text: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    relatedEquipment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
actionSchema.index({ project: 1, type: 1 });
actionSchema.index({ status: 1, priority: 1 });
actionSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Action', actionSchema); 