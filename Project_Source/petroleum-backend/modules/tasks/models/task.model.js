const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const fileSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    approved: {
        type: Boolean,
        default: false
    }
});

const subtaskSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
});

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'inProgress', 'inReview', 'done'],
        default: 'todo'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    assignee: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    needsValidation: {
        type: Boolean,
        default: true
    },
    comments: [commentSchema],
    files: [fileSchema],
    subtasks: [subtaskSchema],
    tags: [{
        type: String
    }],
    // Fields for action-generated tasks
    actionId: {
        type: Schema.Types.ObjectId,
        ref: 'Action'
    },
    globalActionId: {
        type: Schema.Types.ObjectId,
        ref: 'GlobalAction'
    },
    // For project association
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project'
    },
    category: {
        type: String
    },
    // For history/archiving
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },
    // For declined tasks
    isDeclined: {
        type: Boolean,
        default: false
    },
    declineReason: {
        type: String
    },
    declinedAt: {
        type: Date
    },
    // For feedback when returning to inProgress
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ creator: 1 });
taskSchema.index({ actionId: 1 }, { sparse: true });
taskSchema.index({ globalActionId: 1 }, { sparse: true });
taskSchema.index({ status: 1, completedAt: 1 }, { sparse: true });
taskSchema.index({ isArchived: 1 });

module.exports = mongoose.model('Task', taskSchema); 