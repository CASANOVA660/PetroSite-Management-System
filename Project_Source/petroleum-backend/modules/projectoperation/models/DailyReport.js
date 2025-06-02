const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Report date is required'],
        default: Date.now
    },
    activities: [{
        description: {
            type: String,
            required: [true, 'Activity description is required']
        },
        startTime: {
            type: String
        },
        endTime: {
            type: String
        },
        status: {
            type: String,
            enum: ['completed', 'inProgress', 'delayed', 'cancelled'],
            default: 'completed'
        }
    }],
    equipmentUsed: [{
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            required: true
        },
        hoursUsed: {
            type: Number,
            default: 0
        },
        notes: {
            type: String
        }
    }],
    healthAndSafety: {
        incidents: {
            type: Number,
            default: 0
        },
        nearMisses: {
            type: Number,
            default: 0
        },
        safetyMeetingHeld: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String
        }
    },
    weatherConditions: {
        type: String
    },
    challenges: {
        type: String
    },
    solutions: {
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
dailyReportSchema.index({ projectId: 1, date: 1 });
dailyReportSchema.index({ date: 1 });
dailyReportSchema.index({ createdBy: 1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema); 