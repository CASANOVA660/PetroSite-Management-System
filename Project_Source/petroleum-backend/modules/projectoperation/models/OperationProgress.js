const mongoose = require('mongoose');

const operationProgressSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Progress date is required'],
        default: Date.now
    },
    milestone: {
        type: String,
        required: [true, 'Milestone is required']
    },
    plannedProgress: {
        type: Number,
        required: [true, 'Planned progress percentage is required'],
        min: 0,
        max: 100
    },
    actualProgress: {
        type: Number,
        required: [true, 'Actual progress percentage is required'],
        min: 0,
        max: 100
    },
    variance: {
        type: Number
    },
    status: {
        type: String,
        enum: ['onTrack', 'behind', 'ahead', 'atRisk'],
        default: 'onTrack'
    },
    challenges: {
        type: String
    },
    actions: {
        type: String
    },
    notes: {
        type: String
    },
    attachments: [{
        name: String,
        path: String,
        type: String
    }],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Updater ID is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Pre-save hook to calculate variance automatically
operationProgressSchema.pre('save', function (next) {
    this.variance = this.actualProgress - this.plannedProgress;

    // Automatically determine status based on variance
    if (this.variance >= 5) {
        this.status = 'ahead';
    } else if (this.variance <= -10) {
        this.status = 'atRisk';
    } else if (this.variance < 0) {
        this.status = 'behind';
    } else {
        this.status = 'onTrack';
    }

    next();
});

// Indexes for faster queries
operationProgressSchema.index({ projectId: 1, date: 1 });
operationProgressSchema.index({ status: 1 });

module.exports = mongoose.model('OperationProgress', operationProgressSchema); 