const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Please provide activity description']
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
        default: 'inProgress'
    }
});

const equipmentUsedSchema = new mongoose.Schema({
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: [true, 'Please provide equipment ID']
    },
    hoursUsed: {
        type: Number,
        required: [true, 'Please provide hours used']
    },
    notes: {
        type: String
    }
});

const healthAndSafetySchema = new mongoose.Schema({
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
});

const attachmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide attachment name']
    },
    path: {
        type: String,
        required: [true, 'Please provide attachment path']
    },
    type: {
        type: String
    }
});

const dailyReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Please provide project ID']
    },
    date: {
        type: String,
        required: [true, 'Please provide report date']
    },
    title: {
        type: String
    },
    supervisor: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected'],
        default: 'draft'
    },
    submittedAt: {
        type: Date
    },
    activities: [activitySchema],
    equipmentUsed: [equipmentUsedSchema],
    healthAndSafety: healthAndSafetySchema,
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
    attachments: [attachmentSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Convert _id to id for frontend compatibility
dailyReportSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
    }
});

module.exports = mongoose.model('DailyReport', dailyReportSchema); 