const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    responsible: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    responsibleFollowup: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
        enum: ['pending', 'in_progress', 'inReview', 'completed', 'cancelled'],
        default: 'pending'
    },
    category: {
        type: String,
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    needsValidation: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add index for faster queries
actionSchema.index({ projectId: 1 });
actionSchema.index({ responsible: 1 });
actionSchema.index({ responsibleFollowup: 1 });
actionSchema.index({ manager: 1 });
actionSchema.index({ status: 1 });

// Add validation for endDate to be after startDate
actionSchema.pre('save', function (next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

const Action = mongoose.model('Action', actionSchema);

module.exports = Action; 