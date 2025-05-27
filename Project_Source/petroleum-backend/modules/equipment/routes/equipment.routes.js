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

// Equipment status routes
router.route('/status/summary')
    .get(equipmentController.getStatusSummary);

router.route('/active')
    .get(equipmentController.getActiveEquipment);

router.route('/:id/status/history')
    .get(equipmentController.getStatusHistory);

// Equipment activity routes
router.route('/:id/activities')
    .post(equipmentController.scheduleActivity);

router.route('/:id/activities/:activityId/start')
    .put(equipmentController.startActivity);

router.route('/:id/activities/:activityId/complete')
    .put(equipmentController.completeActivity);

router.route('/:id/activities/:activityId/cancel')
    .put(equipmentController.cancelActivity);

router.route('/:id/availability')
    .get(equipmentController.checkAvailability);

// Test route to debug available equipment
router.route('/debug/status')
    .get(async (req, res) => {
        try {
            const Equipment = require('../models/equipment.model');
            const equipment = await Equipment.find().select('_id nom reference status activities').lean();

            // Count equipment by status
            const statusCounts = {};
            equipment.forEach(eq => {
                if (!statusCounts[eq.status]) {
                    statusCounts[eq.status] = 0;
                }
                statusCounts[eq.status]++;
            });

            res.status(200).json({
                success: true,
                totalCount: equipment.length,
                statusCounts,
                equipment: equipment.map(eq => ({
                    _id: eq._id,
                    nom: eq.nom,
                    reference: eq.reference,
                    status: eq.status,
                    activitiesCount: eq.activities ? eq.activities.length : 0
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

// Test route to create test equipment with AVAILABLE status
router.route('/debug/create-test')
    .get(async (req, res) => {
        try {
            const Equipment = require('../models/equipment.model');
            const { EQUIPMENT_STATUS } = Equipment;

            // Create a new equipment with AVAILABLE status
            const randomNum = Math.floor(Math.random() * 10000);

            const newEquipment = new Equipment({
                nom: `Test Equipment ${randomNum}`,
                reference: `TEST-${randomNum}`,
                matricule: `MAT-${randomNum}`,
                dimensions: {
                    height: 100,
                    width: 100,
                    length: 100,
                    weight: 100
                },
                operatingConditions: {
                    temperature: "20-30°C",
                    pressure: "1 atm"
                },
                location: "Test Location",
                status: EQUIPMENT_STATUS.AVAILABLE,
                activities: []
            });

            await newEquipment.save();

            res.status(200).json({
                success: true,
                message: "Test equipment created successfully",
                equipment: {
                    _id: newEquipment._id,
                    nom: newEquipment.nom,
                    reference: newEquipment.reference,
                    status: newEquipment.status
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

module.exports = router; 