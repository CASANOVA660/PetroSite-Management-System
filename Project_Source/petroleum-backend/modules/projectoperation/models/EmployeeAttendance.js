const mongoose = require('mongoose');

const employeeAttendanceSchema = new mongoose.Schema({
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
        required: [true, 'Attendance date is required']
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused'],
        default: 'present'
    },
    checkInTime: {
        type: String
    },
    checkOutTime: {
        type: String
    },
    totalHours: {
        type: Number
    },
    notes: {
        type: String
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recorder ID is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
employeeAttendanceSchema.index({ projectId: 1, date: 1 });
employeeAttendanceSchema.index({ employeeId: 1 });
employeeAttendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('EmployeeAttendance', employeeAttendanceSchema); 