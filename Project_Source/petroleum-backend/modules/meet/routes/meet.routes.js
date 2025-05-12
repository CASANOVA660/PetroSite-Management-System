const express = require('express');
const router = express.Router();
const meetController = require('../controllers/meet.controller');
const auth = require('../../../middleware/auth');

// Public routes
router.get('/meetings/upcoming', meetController.getUpcomingMeetings);
router.get('/meetings/past', meetController.getPastMeetings);
router.get('/meetings/:id', meetController.getMeetingById);

// Protected routes
router.get('/meetings', auth, meetController.getAllMeetings);
router.post('/meetings', auth, meetController.createMeeting);
router.put('/meetings/:id', auth, meetController.updateMeeting);
router.delete('/meetings/:id', auth, meetController.deleteMeeting);
router.get('/projects/:projectId/meetings', auth, meetController.getMeetingsByProject);

module.exports = router; 