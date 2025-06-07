const Attendance = require('../models/Attendance');
const Project = require('../../projects/models/Project');
const Employee = require('../../gestion-rh/models/employee.model');
const mongoose = require('mongoose');

// Local validation functions instead of importing from utils
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Local authorization function
const isUserAuthorized = (user, project) => {
    if (!user) return false;

    // Project owner always has access
    if (user._id && project.owner && user._id.toString() === project.owner.toString()) return true;

    // Check if user is in project members
    if (project.team && project.team.some(member => member.toString() === user._id.toString())) {
        return true;
    }

    // If user is manager, they have access to all projects
    if (user.role === 'Manager') return true;

    return false;
};

/**
 * Get attendance records for a project with optional date filter
 * @route GET /api/projects/:projectId/attendance
 */
exports.getProjectAttendance = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { date } = req.query;

        console.log('Get attendance for project:', projectId, 'date:', date);

        // Validate projectId
        if (!validateObjectId(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid project ID format' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check user authorization
        if (!isUserAuthorized(req.user, project)) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
        }

        // Build query
        const query = { projectId };
        if (date) {
            query.date = date;
        }

        // Get attendance records
        const attendanceRecords = await Attendance.find(query)
            .populate('employeeId', 'name role photo')
            .sort({ date: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: attendanceRecords,
            count: attendanceRecords.length
        });
    } catch (error) {
        console.error('Error getting attendance records:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Create a new attendance record
 * @route POST /api/projects/:projectId/attendance
 */
exports.createAttendance = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { employeeId, date, timeIn, timeOut, status, notes } = req.body;

        console.log('Creating attendance record:', { projectId, employeeId, date, timeIn, timeOut, status, notes });

        // Validate projectId
        if (!validateObjectId(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid project ID format' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check user authorization
        if (!isUserAuthorized(req.user, project)) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
        }

        // Validate required fields
        if (!employeeId || !date) {
            return res.status(400).json({ success: false, message: 'Employee ID and date are required' });
        }

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Check if attendance record already exists for this employee and date
        const existingRecord = await Attendance.findOne({ projectId, employeeId, date });
        if (existingRecord) {
            return res.status(400).json({ success: false, message: 'Attendance record already exists for this employee and date' });
        }

        // Create attendance record
        const attendance = new Attendance({
            projectId,
            employeeId,
            date,
            timeIn: timeIn || null,
            timeOut: timeOut || null,
            status: status || 'present',
            notes: notes || ''
        });

        // Save attendance record
        const savedAttendance = await attendance.save();

        // Populate employee details
        const populatedAttendance = await Attendance.findById(savedAttendance._id)
            .populate('employeeId', 'name role photo');

        return res.status(201).json({
            success: true,
            message: 'Attendance record created successfully',
            data: populatedAttendance
        });
    } catch (error) {
        console.error('Error creating attendance record:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Update an attendance record
 * @route PUT /api/projects/attendance/:attendanceId
 */
exports.updateAttendance = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const updateData = req.body;

        // Validate attendanceId
        if (!validateObjectId(attendanceId)) {
            return res.status(400).json({ success: false, message: 'Invalid attendance ID format' });
        }

        // Find attendance record
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        // Get project to check authorization
        const project = await Project.findById(attendance.projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check user authorization
        if (!isUserAuthorized(req.user, project)) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this attendance record' });
        }

        // Calculate total hours if both timeIn and timeOut are provided
        if (updateData.timeOut && attendance.timeIn) {
            // Logic for calculating hours could be added here if needed
        }

        // Update attendance record
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            attendanceId,
            { $set: updateData },
            { new: true }
        ).populate('employeeId', 'name role photo');

        return res.status(200).json({
            success: true,
            message: 'Attendance record updated successfully',
            data: updatedAttendance
        });
    } catch (error) {
        console.error('Error updating attendance record:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * Delete an attendance record
 * @route DELETE /api/projects/:projectId/attendance/:attendanceId
 */
exports.deleteAttendance = async (req, res) => {
    try {
        const { projectId, attendanceId } = req.params;

        // Validate IDs
        if (!validateObjectId(projectId) || !validateObjectId(attendanceId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check user authorization
        if (!isUserAuthorized(req.user, project)) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this attendance record' });
        }

        // Find and delete attendance record
        const attendance = await Attendance.findOneAndDelete({ _id: attendanceId, projectId });
        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Attendance record deleted successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}; 