const mongoose = require('mongoose');

// Schema for milestone tasks
const milestoneTaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Task name is required']
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'planned', 'delayed'],
        default: 'planned'
    },
    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    startDate: {
        type: String,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: String,
        required: [true, 'End date is required']
    },
    dependsOn: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MilestoneTask'
    }],
    notes: {
        type: String
    }
}, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

// Schema for project milestones
const milestoneSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    name: {
        type: String,
        required: [true, 'Milestone name is required']
    },
    description: {
        type: String
    },
    plannedDate: {
        type: String,
        required: [true, 'Planned completion date is required']
    },
    actualDate: {
        type: String
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'planned', 'delayed'],
        default: 'planned'
    },
    tasks: [milestoneTaskSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id.toString();
            return ret;
        }
    }
});

// Calculate overall progress based on tasks
milestoneSchema.methods.calculateProgress = function () {
    if (!this.tasks || this.tasks.length === 0) {
        return 0;
    }

    const totalTasks = this.tasks.length;
    const completedTasksWeight = this.tasks.reduce((sum, task) => {
        return sum + (task.completionPercentage / 100);
    }, 0);

    return Math.round((completedTasksWeight / totalTasks) * 100);
};

// Update milestone status based on tasks
milestoneSchema.methods.updateStatus = function () {
    if (!this.tasks || this.tasks.length === 0) {
        return this.status;
    }

    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    const delayedTasks = this.tasks.filter(task => task.status === 'delayed').length;

    if (completedTasks === this.tasks.length) {
        this.status = 'completed';
    } else if (delayedTasks > 0) {
        this.status = 'delayed';
    } else if (completedTasks > 0) {
        this.status = 'in-progress';
    } else {
        this.status = 'planned';
    }

    return this.status;
};

// Indexes for faster queries
milestoneSchema.index({ projectId: 1 });
milestoneSchema.index({ status: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = { Milestone, milestoneSchema, milestoneTaskSchema }; 