const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    assignee: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    status: {
        type: String,
        enum: ['todo', 'inProgress', 'done'],
        default: 'todo'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tags: [String],
    actionId: {
        type: Schema.Types.ObjectId,
        ref: 'Action'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema); 