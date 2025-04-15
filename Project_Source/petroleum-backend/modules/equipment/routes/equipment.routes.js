const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Equipment routes
router.route('/')
    .get(equipmentController.getAllEquipment)
    .post(equipmentController.createEquipment);

router.route('/:id')
    .get(equipmentController.getEquipmentById)
    .put(equipmentController.updateEquipment)
    .delete(equipmentController.deleteEquipment);

// Equipment history routes
router.route('/:id/history')
    .get(equipmentController.getEquipmentHistory)
    .post(equipmentController.addHistoryEntry);

module.exports = router; 