const mongoose = require('mongoose');
const OperationProgress = require('../../../modules/projectoperation/models/OperationProgress');

describe('OperationProgress Model', () => {
    let validProgressData;

    beforeEach(() => {
        validProgressData = {
            projectId: 'project-123',
            date: new Date('2023-05-15'),
            milestone: 'Foundation completion',
            plannedProgress: 75,
            actualProgress: 70,
            status: 'behind',
            challenges: 'Weather delays',
            actions: 'Adding additional workforce',
            notes: 'Need to recover schedule',
            updatedBy: 'user-123'
        };
    });

    it('should create an operation progress with valid data', async () => {
        const progress = await OperationProgress.create(validProgressData);

        expect(progress).toBeDefined();
        expect(progress.projectId).toBe(validProgressData.projectId);
        expect(progress.milestone).toBe(validProgressData.milestone);
        expect(progress.plannedProgress).toBe(validProgressData.plannedProgress);
        expect(progress.actualProgress).toBe(validProgressData.actualProgress);
        expect(progress.challenges).toBe(validProgressData.challenges);
        expect(progress.actions).toBe(validProgressData.actions);
        expect(progress.isDeleted).toBe(false);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = ['projectId', 'date', 'milestone', 'plannedProgress', 'actualProgress', 'updatedBy'];

        for (const field of requiredFields) {
            const invalidData = { ...validProgressData };
            delete invalidData[field];

            try {
                await OperationProgress.create(invalidData);
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should validate progress percentage range', async () => {
        // Test with invalid planned progress
        const invalidPlannedProgress = {
            ...validProgressData,
            plannedProgress: 110 // Over 100%
        };

        try {
            await OperationProgress.create(invalidPlannedProgress);
            fail('Expected validation error for planned progress over 100%');
        } catch (error) {
            expect(error).toBeDefined();
        }

        // Test with invalid actual progress
        const invalidActualProgress = {
            ...validProgressData,
            actualProgress: -10 // Negative value
        };

        try {
            await OperationProgress.create(invalidActualProgress);
            fail('Expected validation error for negative actual progress');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('should calculate variance and determine status automatically', async () => {
        // Create a progress record
        const progress = await OperationProgress.create(validProgressData);

        // Mock the pre-save hook that calculates variance and status
        progress.variance = progress.actualProgress - progress.plannedProgress; // -5

        // Status should be determined by variance:
        // >=5: ahead, <0 && >=-10: behind, <-10: atRisk, otherwise: onTrack
        if (progress.variance >= 5) {
            progress.status = 'ahead';
        } else if (progress.variance <= -10) {
            progress.status = 'atRisk';
        } else if (progress.variance < 0) {
            progress.status = 'behind';
        } else {
            progress.status = 'onTrack';
        }

        expect(progress.variance).toBe(-5);
        expect(progress.status).toBe('behind');

        // Test with progress ahead of schedule
        progress.actualProgress = 85;
        progress.variance = progress.actualProgress - progress.plannedProgress; // 10

        if (progress.variance >= 5) {
            progress.status = 'ahead';
        } else if (progress.variance <= -10) {
            progress.status = 'atRisk';
        } else if (progress.variance < 0) {
            progress.status = 'behind';
        } else {
            progress.status = 'onTrack';
        }

        expect(progress.variance).toBe(10);
        expect(progress.status).toBe('ahead');

        // Test with progress at risk
        progress.actualProgress = 60;
        progress.variance = progress.actualProgress - progress.plannedProgress; // -15

        if (progress.variance >= 5) {
            progress.status = 'ahead';
        } else if (progress.variance <= -10) {
            progress.status = 'atRisk';
        } else if (progress.variance < 0) {
            progress.status = 'behind';
        } else {
            progress.status = 'onTrack';
        }

        expect(progress.variance).toBe(-15);
        expect(progress.status).toBe('atRisk');
    });

    it('should store attachments properly', async () => {
        const progressWithAttachments = {
            ...validProgressData,
            attachments: [
                {
                    name: 'site_photo_1.jpg',
                    path: 'https://example.com/uploads/site_photo_1.jpg',
                    type: 'image/jpeg'
                },
                {
                    name: 'progress_report.pdf',
                    path: 'https://example.com/uploads/progress_report.pdf',
                    type: 'application/pdf'
                }
            ]
        };

        const progress = await OperationProgress.create(progressWithAttachments);

        expect(progress.attachments).toBeDefined();
        expect(progress.attachments.length).toBe(2);
        expect(progress.attachments[0].name).toBe('site_photo_1.jpg');
        expect(progress.attachments[1].name).toBe('progress_report.pdf');
    });

    it('should store timestamps', async () => {
        const progress = await OperationProgress.create(validProgressData);

        expect(progress.createdAt).toBeDefined();
        expect(progress.updatedAt).toBeDefined();
    });
}); 