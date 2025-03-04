const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/notify-manager', notificationController.notifyManager);

module.exports = router;