const mongoose = require('mongoose');
const asyncHandler = require('../../../middleware/async');
const { Milestone } = require('../models/progressModel');
const OperationProgress = require('../models/OperationProgress');

/**
 * Get all milestones for a project
 * @route GET /api/projects/:projectId/milestones
 * @access Private
 */
const getProjectMilestones = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const milestones = await Milestone.find({ projectId })
        .sort({ plannedDate: 1 });

    res.status(200).json({
        success: true,
        count: milestones.length,
        data: milestones
    });
});

/**
 * Get a specific milestone
 * @route GET /api/projects/milestones/:milestoneId
 * @access Private
 */
const getMilestoneById = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;

    // Validate milestone ID
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
        res.status(400);
        throw new Error('Invalid milestone ID');
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    res.status(200).json({
        success: true,
        data: milestone
    });
});

/**
 * Create a new milestone
 * @route POST /api/projects/:projectId/milestones
 * @access Private
 */
const createMilestone = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description, plannedDate, tasks } = req.body;

    const milestone = await Milestone.create({
        projectId,
        name,
        description,
        plannedDate,
        tasks: tasks || [],
        createdBy: req.user.id,
        updatedBy: req.user.id
    });

    res.status(201).json({
        success: true,
        data: milestone
    });
});

/**
 * Update a milestone
 * @route PUT /api/projects/milestones/:milestoneId
 * @access Private
 */
const updateMilestone = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;

    // Validate milestone ID
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
        res.status(400);
        throw new Error('Invalid milestone ID');
    }

    let milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    // Update milestone
    milestone = await Milestone.findByIdAndUpdate(
        milestoneId,
        { ...req.body, updatedBy: req.user.id },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: milestone
    });
});

/**
 * Delete a milestone
 * @route DELETE /api/projects/milestones/:milestoneId
 * @access Private
 */
const deleteMilestone = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;

    // Validate milestone ID
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
        res.status(400);
        throw new Error('Invalid milestone ID');
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    await milestone.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * Create a task for a milestone
 * @route POST /api/projects/:projectId/milestones/:milestoneId/tasks
 * @access Private
 */
const createMilestoneTask = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;
    const { name, status, completionPercentage, startDate, endDate, dependsOn, notes } = req.body;

    // Validate milestone ID
    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
        res.status(400);
        throw new Error('Invalid milestone ID');
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    // Create task
    const task = {
        name,
        status: status || 'planned',
        completionPercentage: completionPercentage || 0,
        startDate,
        endDate,
        dependsOn,
        notes
    };

    milestone.tasks.push(task);
    milestone.updatedBy = req.user.id;

    // Update milestone status based on tasks
    milestone.updateStatus();

    await milestone.save();

    // Return the created task
    const createdTask = milestone.tasks[milestone.tasks.length - 1];

    res.status(201).json({
        success: true,
        data: createdTask
    });
});

/**
 * Update a task for a milestone
 * @route PUT /api/projects/:projectId/milestones/:milestoneId/tasks/:taskId
 * @access Private
 */
const updateMilestoneTask = asyncHandler(async (req, res) => {
    const { milestoneId, taskId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(milestoneId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        res.status(400);
        throw new Error('Invalid ID format');
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    // Find task
    const taskIndex = milestone.tasks.findIndex(task => task._id.toString() === taskId);

    if (taskIndex === -1) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Update task fields
    Object.keys(req.body).forEach(key => {
        milestone.tasks[taskIndex][key] = req.body[key];
    });

    milestone.updatedBy = req.user.id;

    // Update milestone status based on tasks
    milestone.updateStatus();

    await milestone.save();

    res.status(200).json({
        success: true,
        data: milestone.tasks[taskIndex]
    });
});

/**
 * Delete a task from a milestone
 * @route DELETE /api/projects/:projectId/milestones/:milestoneId/tasks/:taskId
 * @access Private
 */
const deleteMilestoneTask = asyncHandler(async (req, res) => {
    const { milestoneId, taskId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(milestoneId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        res.status(400);
        throw new Error('Invalid ID format');
    }

    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        res.status(404);
        throw new Error('Milestone not found');
    }

    // Find and remove task
    const taskIndex = milestone.tasks.findIndex(task => task._id.toString() === taskId);

    if (taskIndex === -1) {
        res.status(404);
        throw new Error('Task not found');
    }

    milestone.tasks.splice(taskIndex, 1);
    milestone.updatedBy = req.user.id;

    // Update milestone status based on tasks
    milestone.updateStatus();

    await milestone.save();

    res.status(200).json({
        success: true,
        data: {}
    });
});

/**
 * Get operation progress entries for a project
 * @route GET /api/projects/:projectId/progress
 * @access Private
 */
const getProjectProgress = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { date, status } = req.query;

    // Build query
    const query = { projectId, isDeleted: false };

    if (date) {
        // If date is provided, filter by it
        query.date = new Date(date);
    }

    if (status && status !== 'all') {
        query.status = status;
    }

    const progress = await OperationProgress.find(query)
        .sort({ date: -1 })
        .populate('updatedBy', 'name');

    res.status(200).json({
        success: true,
        count: progress.length,
        data: progress
    });
});

/**
 * Create a new progress entry
 * @route POST /api/projects/:projectId/progress
 * @access Private
 */
const createProgress = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const progress = await OperationProgress.create({
        ...req.body,
        projectId,
        updatedBy: req.user.id
    });

    res.status(201).json({
        success: true,
        data: progress
    });
});

/**
 * Update a progress entry
 * @route PUT /api/projects/progress/:progressId
 * @access Private
 */
const updateProgress = asyncHandler(async (req, res) => {
    const { progressId } = req.params;

    // Validate progress ID
    if (!mongoose.Types.ObjectId.isValid(progressId)) {
        res.status(400);
        throw new Error('Invalid progress ID');
    }

    let progress = await OperationProgress.findById(progressId);

    if (!progress) {
        res.status(404);
        throw new Error('Progress entry not found');
    }

    // Update progress
    progress = await OperationProgress.findByIdAndUpdate(
        progressId,
        { ...req.body, updatedBy: req.user.id },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: progress
    });
});

/**
 * Delete a progress entry
 * @route DELETE /api/projects/progress/:progressId
 * @access Private
 */
const deleteProgress = asyncHandler(async (req, res) => {
    const { progressId } = req.params;

    // Validate progress ID
    if (!mongoose.Types.ObjectId.isValid(progressId)) {
        res.status(400);
        throw new Error('Invalid progress ID');
    }

    const progress = await OperationProgress.findById(progressId);

    if (!progress) {
        res.status(404);
        throw new Error('Progress entry not found');
    }

    // Soft delete
    progress.isDeleted = true;
    await progress.save();

    res.status(200).json({
        success: true,
        data: {}
    });
});

module.exports = {
    // Milestones
    getProjectMilestones,
    getMilestoneById,
    createMilestone,
    updateMilestone,
    deleteMilestone,

    // Tasks
    createMilestoneTask,
    updateMilestoneTask,
    deleteMilestoneTask,

    // Progress
    getProjectProgress,
    createProgress,
    updateProgress,
    deleteProgress
}; 