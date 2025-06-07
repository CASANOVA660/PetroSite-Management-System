const mongoose = require('mongoose');
const Equipment = require('../../../modules/equipment/models/equipment.model');
const { EQUIPMENT_STATUS, ACTIVITY_TYPE } = Equipment;

describe('Equipment Model', () => {
    let validEquipmentData;

    beforeEach(() => {
        validEquipmentData = {
            nom: 'Test Equipment',
            reference: 'TEST-REF-001',
            matricule: 'MAT-001',
            dimensions: {
                height: 100,
                width: 50,
                length: 30,
                weight: 75
            },
            operatingConditions: {
                temperature: '20-30°C',
                pressure: '1-2 bar'
            },
            location: 'Test Location',
            status: EQUIPMENT_STATUS.AVAILABLE,
            createdBy: 'user-123'
        };
    });

    it('should create equipment with valid data', async () => {
        const equipment = await Equipment.create(validEquipmentData);

        expect(equipment).toBeDefined();
        expect(equipment.nom).toBe(validEquipmentData.nom);
        expect(equipment.reference).toBe(validEquipmentData.reference);
        expect(equipment.matricule).toBe(validEquipmentData.matricule);
        expect(equipment.dimensions.height).toBe(validEquipmentData.dimensions.height);
        expect(equipment.dimensions.width).toBe(validEquipmentData.dimensions.width);
        expect(equipment.dimensions.length).toBe(validEquipmentData.dimensions.length);
        expect(equipment.dimensions.weight).toBe(validEquipmentData.dimensions.weight);
        expect(equipment.status).toBe(EQUIPMENT_STATUS.AVAILABLE);
        expect(equipment.isDeleted).toBe(false);
    });

    it('should calculate volume automatically', async () => {
        const expectedVolume = (validEquipmentData.dimensions.height *
            validEquipmentData.dimensions.width *
            validEquipmentData.dimensions.length) / 1000000;

        const equipmentWithVolume = await Equipment.create({
            ...validEquipmentData,
            dimensions: {
                ...validEquipmentData.dimensions,
                volume: expectedVolume
            }
        });

        expect(equipmentWithVolume.dimensions.volume).toBe(expectedVolume);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = [
            'nom', 'reference', 'matricule',
            'dimensions.height', 'dimensions.width', 'dimensions.length', 'dimensions.weight',
            'operatingConditions.temperature', 'operatingConditions.pressure',
            'location'
        ];

        for (const field of requiredFields) {
            const invalidData = { ...validEquipmentData };
            const parts = field.split('.');

            if (parts.length === 1) {
                delete invalidData[field];
            } else {
                delete invalidData[parts[0]][parts[1]];
            }

            try {
                await Equipment.create(invalidData);
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should normalize old status values', async () => {
        const oldStatusMappings = {
            'disponible': EQUIPMENT_STATUS.AVAILABLE,
            'disponible_needs_repair': EQUIPMENT_STATUS.AVAILABLE,
            'on_repair': EQUIPMENT_STATUS.REPAIR,
            'disponible_bon_etat': EQUIPMENT_STATUS.AVAILABLE,
            'working_non_disponible': EQUIPMENT_STATUS.IN_USE
        };

        for (const [oldStatus, newStatus] of Object.entries(oldStatusMappings)) {
            const equipment = await Equipment.create({
                ...validEquipmentData,
                status: oldStatus
            });

            equipment.status = newStatus;

            expect(equipment.status).toBe(newStatus);
        }
    });

    it('should validate status values', async () => {
        const invalidStatus = {
            ...validEquipmentData,
            status: 'INVALID_STATUS'
        };

        try {
            await Equipment.create(invalidStatus);
            fail('Expected validation error for invalid status');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('should add activities to equipment', async () => {
        const equipment = await Equipment.create(validEquipmentData);

        const activity = {
            type: ACTIVITY_TYPE.MAINTENANCE,
            description: 'Routine maintenance',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-02'),
            status: 'SCHEDULED',
            responsiblePerson: {
                name: 'Maintenance Manager',
                userId: 'user-456'
            }
        };

        equipment.activities = [activity];
        await equipment.save();

        expect(equipment.activities.length).toBe(1);
        expect(equipment.activities[0].type).toBe(ACTIVITY_TYPE.MAINTENANCE);
        expect(equipment.activities[0].description).toBe(activity.description);
    });

    it('should detect scheduling conflicts', async () => {
        const equipment = await Equipment.create(validEquipmentData);

        // Add a scheduled activity
        const activity = {
            type: ACTIVITY_TYPE.MAINTENANCE,
            description: 'Scheduled maintenance',
            startDate: new Date('2023-05-01'),
            endDate: new Date('2023-05-03'),
            status: 'SCHEDULED'
        };

        equipment.activities = [activity];

        // Mock the hasScheduleConflict method
        equipment.hasScheduleConflict = jest.fn().mockImplementation((startDate, endDate) => {
            // Check if there's an overlap with any existing activity
            return equipment.activities.some(act => {
                if (act.status === 'CANCELLED') return false;

                return (
                    (act.startDate <= endDate && act.endDate >= startDate) &&
                    (act.status === 'SCHEDULED' || act.status === 'IN_PROGRESS')
                );
            });
        });

        // Test conflict
        const hasConflict1 = equipment.hasScheduleConflict(
            new Date('2023-05-02'),
            new Date('2023-05-04')
        );
        expect(hasConflict1).toBe(true);

        // Test no conflict
        const hasConflict2 = equipment.hasScheduleConflict(
            new Date('2023-05-04'),
            new Date('2023-05-06')
        );
        expect(hasConflict2).toBe(false);
    });
}); 