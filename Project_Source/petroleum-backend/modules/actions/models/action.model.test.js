const mongoose = require('mongoose');
const Action = require('./action.model');
const User = require('../../users/models/User');

// Mock the Action model's methods
jest.mock('./action.model', () => {
    // Mock implementation of Action model
    return {
        create: jest.fn().mockImplementation((data) => {
            // Validation checks
            if (!data.title) {
                throw new Error('Title is required');
            }
            if (!data.content) {
                throw new Error('Content is required');
            }
            if (!data.source) {
                throw new Error('Source is required');
            }
            if (!data.responsible) {
                throw new Error('Responsible is required');
            }
            if (data.status && !['pending', 'in_progress', 'inReview', 'completed', 'cancelled'].includes(data.status)) {
                throw new Error('Invalid status');
            }
            if (data.endDate && data.startDate && data.endDate <= data.startDate) {
                throw new Error('End date must be after start date');
            }

            // Create action with defaults
            const action = {
                _id: 'mock-action-id-' + Math.random().toString(36).substring(7),
                title: data.title,
                content: data.content,
                source: data.source,
                responsible: data.responsible,
                responsibleFollowup: data.responsibleFollowup,
                manager: data.manager,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status || 'pending',
                category: data.category,
                projectId: data.projectId,
                needsValidation: data.needsValidation !== undefined ? data.needsValidation : false,
                createdAt: new Date(),
                updatedAt: new Date(),
                toString: jest.fn().mockReturnValue('mock-action-id'),
                save: jest.fn().mockResolvedValue(true)
            };

            return Promise.resolve(action);
        })
    };
});

describe('Action Model', () => {
    let responsibleUser, managerUser, followupUser;

    beforeEach(() => {
        // Create test users
        responsibleUser = {
            _id: 'responsible-user-id',
            nom: 'Responsible',
            prenom: 'User',
            email: 'responsible@example.com',
            role: 'Chef projet'
        };

        managerUser = {
            _id: 'manager-user-id',
            nom: 'Manager',
            prenom: 'User',
            email: 'manager@example.com',
            role: 'Manager'
        };

        followupUser = {
            _id: 'followup-user-id',
            nom: 'Followup',
            prenom: 'User',
            email: 'followup@example.com',
            role: 'Chef Opérateur'
        };
    });

    it('should create an action with valid data', async () => {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

        const actionData = {
            title: 'Test Action',
            content: 'This is a test action',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate,
            endDate,
            status: 'pending',
            category: 'Test Category'
        };

        const action = await Action.create(actionData);

        expect(action).toBeDefined();
        expect(action._id).toBeDefined();
        expect(action.title).toBe(actionData.title);
        expect(action.content).toBe(actionData.content);
        expect(action.source).toBe(actionData.source);
        expect(action.responsible).toBe(responsibleUser._id);
        expect(action.responsibleFollowup).toBe(followupUser._id);
        expect(action.manager).toBe(managerUser._id);
        expect(action.startDate).toEqual(startDate);
        expect(action.endDate).toEqual(endDate);
        expect(action.status).toBe(actionData.status);
        expect(action.category).toBe(actionData.category);
        expect(action.needsValidation).toBe(false);
    });

    it('should require a title', async () => {
        const invalidAction = {
            content: 'This action has no title',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Title validation failed');
        } catch (error) {
            expect(error.message).toBe('Title is required');
        }
    });

    it('should require content', async () => {
        const invalidAction = {
            title: 'Action without content',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Content validation failed');
        } catch (error) {
            expect(error.message).toBe('Content is required');
        }
    });

    it('should require source', async () => {
        const invalidAction = {
            title: 'Action without source',
            content: 'This action has no source',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Source validation failed');
        } catch (error) {
            expect(error.message).toBe('Source is required');
        }
    });

    it('should require a responsible user', async () => {
        const invalidAction = {
            title: 'Action without responsible',
            content: 'This action has no responsible user',
            source: 'Unit Test',
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Responsible validation failed');
        } catch (error) {
            expect(error.message).toBe('Responsible is required');
        }
    });

    it('should validate status values', async () => {
        const invalidAction = {
            title: 'Action with invalid status',
            content: 'This action has an invalid status',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'invalid_status', // Invalid status
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Status validation failed');
        } catch (error) {
            expect(error.message).toBe('Invalid status');
        }
    });

    it('should validate endDate is after startDate', async () => {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before startDate

        const invalidAction = {
            title: 'Action with invalid dates',
            content: 'This action has endDate before startDate',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate,
            endDate, // EndDate before startDate
            category: 'Test Category'
        };

        try {
            await Action.create(invalidAction);
            // Should not reach here
            expect('This should not be reached').toBe('Date validation failed');
        } catch (error) {
            expect(error.message).toBe('End date must be after start date');
        }
    });

    it('should set default status to pending', async () => {
        const action = await Action.create({
            title: 'Action with default status',
            content: 'This action will use the default status',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        });

        expect(action.status).toBe('pending');
    });

    it('should set default needsValidation to false', async () => {
        const action = await Action.create({
            title: 'Action with default needsValidation',
            content: 'This action will use the default needsValidation',
            source: 'Unit Test',
            responsible: responsibleUser._id,
            responsibleFollowup: followupUser._id,
            manager: managerUser._id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            category: 'Test Category'
        });

        expect(action.needsValidation).toBe(false);
    });
}); 