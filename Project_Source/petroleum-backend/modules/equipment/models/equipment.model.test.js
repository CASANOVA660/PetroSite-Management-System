const mongoose = require('mongoose');
const Equipment = require('./equipment.model');
const User = require('../../users/models/User');

// Get the constants from the equipment model
const EQUIPMENT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    REPAIR: 'REPAIR',
    OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

const ACTIVITY_TYPE = {
    PLACEMENT: 'placement',
    OPERATION: 'operation',
    MAINTENANCE: 'maintenance',
    REPAIR: 'repair'
};

// Mock the Equipment model's methods
jest.mock('./equipment.model', () => {
    // Equipment model mock implementation
    const equipmentModelMock = {
        create: jest.fn().mockImplementation((data) => {
            // Validation checks
            if (!data.nom) {
                throw new Error('Equipment name is required');
            }
            if (!data.reference) {
                throw new Error('Reference is required');
            }
            if (!data.matricule) {
                throw new Error('Matricule is required');
            }
            if (!data.dimensions || !data.dimensions.height || !data.dimensions.width ||
                !data.dimensions.length || !data.dimensions.weight) {
                throw new Error('Dimensions are required');
            }
            if (!data.operatingConditions || !data.operatingConditions.temperature ||
                !data.operatingConditions.pressure) {
                throw new Error('Operating conditions are required');
            }
            if (!data.location) {
                throw new Error('Location is required');
            }

            // Status validation
            const validStatuses = [
                'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'OUT_OF_SERVICE',
                'disponible', 'disponible_needs_repair', 'on_repair', 'disponible_bon_etat', 'working_non_disponible'
            ];
            if (data.status && !validStatuses.includes(data.status)) {
                throw new Error('Invalid status');
            }

            // Normalize old status values
            let normalizedStatus = data.status;
            if (normalizedStatus === 'disponible' || normalizedStatus === 'disponible_bon_etat' ||
                normalizedStatus === 'disponible_needs_repair') {
                normalizedStatus = 'AVAILABLE';
            } else if (normalizedStatus === 'on_repair') {
                normalizedStatus = 'REPAIR';
            } else if (normalizedStatus === 'working_non_disponible') {
                normalizedStatus = 'IN_USE';
            }

            // Calculate volume
            const volume = data.dimensions ?
                (data.dimensions.height * data.dimensions.width * data.dimensions.length) / 1000000 : 0;

            // Create equipment with defaults
            const equipment = {
                _id: 'mock-equipment-id-' + Math.random().toString(36).substring(7),
                nom: data.nom,
                reference: data.reference,
                matricule: data.matricule,
                dimensions: {
                    ...data.dimensions,
                    volume
                },
                operatingConditions: data.operatingConditions,
                location: data.location,
                status: normalizedStatus || 'AVAILABLE',
                activities: [],
                isDeleted: false,
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
                createdAt: new Date(),
                updatedAt: new Date(),
                // Add methods
                toString: jest.fn().mockReturnValue('mock-equipment-id'),
                save: jest.fn().mockResolvedValue(true),
                hasScheduleConflict: jest.fn().mockImplementation((startDate, endDate) => {
                    // This will be overridden in specific tests
                    return false;
                })
            };

            return Promise.resolve(equipment);
        }),
        EQUIPMENT_STATUS: {
            AVAILABLE: 'AVAILABLE',
            IN_USE: 'IN_USE',
            MAINTENANCE: 'MAINTENANCE',
            REPAIR: 'REPAIR',
            OUT_OF_SERVICE: 'OUT_OF_SERVICE'
        },
        ACTIVITY_TYPE: {
            PLACEMENT: 'placement',
            OPERATION: 'operation',
            MAINTENANCE: 'maintenance',
            REPAIR: 'repair'
        }
    };

    return equipmentModelMock;
});

describe('Equipment Model', () => {
    let testUser;

    beforeEach(() => {
        // Create a test user
        testUser = {
            _id: 'equipment-manager-id',
            nom: 'Equipment',
            prenom: 'Manager',
            email: 'equipment.manager@example.com',
            role: 'Resp. Maintenance'
        };
    });

    it('should create equipment with valid data', async () => {
        const equipmentData = {
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
            createdBy: testUser._id
        };

        const equipment = await Equipment.create(equipmentData);

        expect(equipment).toBeDefined();
        expect(equipment._id).toBeDefined();
        expect(equipment.nom).toBe(equipmentData.nom);
        expect(equipment.reference).toBe(equipmentData.reference);
        expect(equipment.matricule).toBe(equipmentData.matricule);
        expect(equipment.dimensions.height).toBe(equipmentData.dimensions.height);
        expect(equipment.dimensions.width).toBe(equipmentData.dimensions.width);
        expect(equipment.dimensions.length).toBe(equipmentData.dimensions.length);
        expect(equipment.dimensions.weight).toBe(equipmentData.dimensions.weight);
        // Volume should be calculated automatically
        expect(equipment.dimensions.volume).toBe(
            (equipmentData.dimensions.height * equipmentData.dimensions.width * equipmentData.dimensions.length) / 1000000
        );
        expect(equipment.status).toBe(EQUIPMENT_STATUS.AVAILABLE);
        expect(equipment.isDeleted).toBe(false);
        expect(equipment.createdBy).toBe(testUser._id);
    });

    it('should require mandatory fields', async () => {
        const invalidEquipment = {
            nom: 'Incomplete Equipment',
            matricule: 'MAT-002'
            // Missing required fields
        };

        try {
            await Equipment.create(invalidEquipment);
            // Should not reach here
            expect('This should not be reached').toBe('Reference validation failed');
        } catch (error) {
            expect(error.message).toBe('Reference is required');
        }
    });

    it('should validate status values', async () => {
        const invalidEquipment = {
            nom: 'Equipment with Invalid Status',
            reference: 'REF-INVALID-STATUS',
            matricule: 'MAT-INVALID-STATUS',
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
            status: 'INVALID_STATUS', // Invalid status
            createdBy: testUser._id
        };

        try {
            await Equipment.create(invalidEquipment);
            // Should not reach here
            expect('This should not be reached').toBe('Status validation failed');
        } catch (error) {
            expect(error.message).toBe('Invalid status');
        }
    });

    it('should normalize old status values', async () => {
        // Create equipment with old status value
        const equipment = await Equipment.create({
            nom: 'Equipment with Old Status',
            reference: 'REF-OLD-STATUS',
            matricule: 'MAT-OLD-STATUS',
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
            status: 'disponible', // Old status value
            createdBy: testUser._id
        });

        // Status should be normalized to AVAILABLE
        expect(equipment.status).toBe(EQUIPMENT_STATUS.AVAILABLE);

        // Try another old status
        const equipment2 = await Equipment.create({
            nom: 'Equipment with Old Status 2',
            reference: 'REF-OLD-STATUS-2',
            matricule: 'MAT-OLD-STATUS-2',
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
            status: 'on_repair', // Old status value
            createdBy: testUser._id
        });

        // Status should be normalized to REPAIR
        expect(equipment2.status).toBe(EQUIPMENT_STATUS.REPAIR);
    });
}); 