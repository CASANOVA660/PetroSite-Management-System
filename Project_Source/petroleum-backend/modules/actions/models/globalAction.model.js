const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const globalActionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Auto-filled with current user
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Person who will execute the action
    responsibleForRealization: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Person who will track/follow up
    responsibleForFollowUp: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Free text category by manager
    category: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Optional fields
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    projectCategory: {
        type: String,
        required: false
    },
    // For nested actions
    parentActionId: {
        type: Schema.Types.ObjectId,
        ref: 'GlobalAction',
        required: false
    },
    subActions: [{
        type: Schema.Types.ObjectId,
        ref: 'GlobalAction'
    }]
}, {
    timestamps: true
});

// Indexes
globalActionSchema.index({ manager: 1 });
globalActionSchema.index({ responsibleForRealization: 1 });
globalActionSchema.index({ responsibleForFollowUp: 1 });
globalActionSchema.index({ status: 1 });
globalActionSchema.index({ projectId: 1 });
globalActionSchema.index({ parentActionId: 1 });

// Validations
globalActionSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

module.exports = mongoose.model('GlobalAction', globalActionSchema);