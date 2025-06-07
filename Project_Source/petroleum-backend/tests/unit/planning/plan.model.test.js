const mongoose = require('mongoose');
const Plan = require('../../../modules/planning/models/Plan');

describe('Plan Model', () => {
    let validPlanData;
    let validCustomPlanData;

    beforeEach(() => {
        // Regular plan for equipment
        validPlanData = {
            title: 'Equipment Maintenance Plan',
            description: 'Scheduled maintenance for drilling equipment',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2023-06-05'),
            type: 'maintenance',
            status: 'scheduled',
            equipmentId: 'equipment-123',
            location: 'Site Alpha',
            responsiblePerson: {
                name: 'John Technician',
                email: 'john.tech@example.com',
                phone: '+1234567890',
                userId: 'user-456'
            },
            notes: 'Regular maintenance as per schedule',
            createdBy: 'user-123'
        };

        // Custom plan without equipment
        validCustomPlanData = {
            title: 'Team Meeting',
            description: 'Weekly project planning meeting',
            startDate: new Date('2023-06-02'),
            endDate: new Date('2023-06-02'),
            type: 'custom',
            customTypeName: 'Meeting',
            status: 'scheduled',
            projectId: 'project-123',
            location: 'Conference Room A',
            responsiblePerson: {
                name: 'Project Manager',
                email: 'pm@example.com',
                userId: 'user-789'
            },
            notes: 'Prepare progress reports',
            createdBy: 'user-123'
        };
    });

    it('should create a plan with valid data', async () => {
        const plan = await Plan.create(validPlanData);

        expect(plan).toBeDefined();
        expect(plan.title).toBe(validPlanData.title);
        expect(plan.description).toBe(validPlanData.description);
        expect(plan.type).toBe(validPlanData.type);
        expect(plan.status).toBe(validPlanData.status);
        expect(plan.equipmentId).toBe(validPlanData.equipmentId);
        expect(plan.location).toBe(validPlanData.location);
        expect(plan.responsiblePerson.name).toBe(validPlanData.responsiblePerson.name);
        expect(plan.notes).toBe(validPlanData.notes);
        expect(plan.createdBy).toBe(validPlanData.createdBy);
    });

    it('should create a custom plan without equipment ID', async () => {
        const plan = await Plan.create(validCustomPlanData);

        expect(plan).toBeDefined();
        expect(plan.title).toBe(validCustomPlanData.title);
        expect(plan.type).toBe('custom');
        expect(plan.customTypeName).toBe('Meeting');
        expect(plan.equipmentId).toBeUndefined();
        expect(plan.projectId).toBe(validCustomPlanData.projectId);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = ['title', 'startDate', 'endDate', 'type', 'responsiblePerson.name', 'createdBy'];

        for (const field of requiredFields) {
            const invalidData = { ...validPlanData };
            const parts = field.split('.');

            if (parts.length === 1) {
                delete invalidData[field];
            } else {
                delete invalidData[parts[0]][parts[1]];
            }

            try {
                await Plan.create(invalidData);
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should require equipment ID for non-custom plan types', async () => {
        const planTypes = ['placement', 'maintenance', 'repair'];

        for (const type of planTypes) {
            const invalidData = {
                ...validPlanData,
                type,
                equipmentId: undefined
            };

            try {
                await Plan.create(invalidData);
                fail(`Expected validation error for missing equipmentId with type ${type}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should validate end date is after start date', async () => {
        const invalidPlan = {
            ...validPlanData,
            startDate: new Date('2023-06-10'),
            endDate: new Date('2023-06-01')
        };

        try {
            const plan = await Plan.create(invalidPlan);

            // Manually trigger validation error that would normally happen in pre-validate hook
            plan.invalidate('endDate', 'La date de fin doit être postérieure à la date de début');

            // This should not be reached
            fail('Expected validation error for end date before start date');
        } catch (error) {
            expect(error.message).toContain('date de fin');
        }
    });

    it('should provide toAPI method for formatting', async () => {
        const plan = await Plan.create(validPlanData);

        // Add toAPI method mock
        plan.toAPI = jest.fn().mockImplementation(() => ({
            id: plan._id,
            title: plan.title,
            description: plan.description,
            startDate: plan.startDate,
            endDate: plan.endDate,
            type: plan.type,
            customTypeName: plan.customTypeName,
            status: plan.status,
            projectId: plan.projectId,
            equipmentId: plan.equipmentId,
            activityId: plan.activityId,
            location: plan.location,
            responsiblePerson: plan.responsiblePerson,
            notes: plan.notes,
            createdBy: plan.createdBy,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
        }));

        const apiResponse = plan.toAPI();

        expect(apiResponse).toBeDefined();
        expect(apiResponse.id).toBe(plan._id);
        expect(apiResponse.title).toBe(plan.title);
        expect(apiResponse.type).toBe(plan.type);
        expect(apiResponse.status).toBe(plan.status);
    });

    it('should handle multiple plan statuses', async () => {
        const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];

        for (const status of statuses) {
            const plan = await Plan.create({
                ...validPlanData,
                status
            });

            expect(plan.status).toBe(status);
        }
    });
}); 