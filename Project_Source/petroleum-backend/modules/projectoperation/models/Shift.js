const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Shift date is required']
    },
    type: {
        type: String,
        enum: ['day', 'night'],
        required: [true, 'Shift type is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required']
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'absent'],
        default: 'scheduled'
    },
    notes: {
        type: String,
        default: ''
    },
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
shiftSchema.index({ projectId: 1, date: 1 });
shiftSchema.index({ employeeId: 1 });
shiftSchema.index({ date: 1, type: 1 });

module.exports = mongoose.model('Shift', shiftSchema); 