const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    timeIn: {
        type: String,
        default: null
    },
    timeOut: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day', 'leave'],
        default: 'present'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Create a compound index to ensure uniqueness for employee attendance on a specific date
AttendanceSchema.index({ projectId: 1, employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema); 