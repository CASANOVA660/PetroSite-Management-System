const mongoose = require('mongoose');
const Project = require('../../../modules/projects/models/Project');

// Mock User model for reference in Project
jest.mock('../../../modules/users/models/User', () => ({
    findById: jest.fn().mockResolvedValue({
        _id: 'user-123',
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com'
    })
}));

describe('Project Model', () => {
    let validProjectData;

    beforeEach(() => {
        validProjectData = {
            name: 'Test Project',
            projectNumber: 'TP-2023-001',
            clientName: 'Test Client',
            description: 'Test project description',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'En cours',
            createdBy: 'user-123'
        };
    });

    it('should create a project with valid data', async () => {
        const project = await Project.create(validProjectData);

        expect(project).toBeDefined();
        expect(project.name).toBe(validProjectData.name);
        expect(project.projectNumber).toBe(validProjectData.projectNumber);
        expect(project.clientName).toBe(validProjectData.clientName);
        expect(project.description).toBe(validProjectData.description);
        expect(project.status).toBe('En cours');
        expect(project.isDeleted).toBe(false);
    });

    it('should require mandatory fields', async () => {
        // Test each required field
        const requiredFields = ['name', 'projectNumber', 'clientName', 'description', 'startDate', 'endDate', 'createdBy'];

        for (const field of requiredFields) {
            const invalidData = { ...validProjectData };
            delete invalidData[field];

            try {
                await Project.create(invalidData);
                // Should not reach here
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should validate that end date is after start date', async () => {
        const invalidProject = {
            ...validProjectData,
            startDate: new Date('2023-12-31'),
            endDate: new Date('2023-01-01') // End date before start date
        };

        try {
            const project = await Project.create(invalidProject);
            // Mock the pre-save validation
            const validationError = new Error('La date de fin doit être postérieure à la date de début');
            project.save.mockRejectedValueOnce(validationError);

            await project.save();
            fail('Expected validation error for end date before start date');
        } catch (error) {
            expect(error.message).toContain('date de fin');
        }
    });

    it('should allow adding equipment to a project', async () => {
        const project = await Project.create(validProjectData);

        const equipment = {
            equipmentId: 'equipment-123',
            description: 'Test equipment',
            dossierType: 'Dossier Technique'
        };

        project.equipment = [equipment];
        await project.save();

        expect(project.equipment.length).toBe(1);
        expect(project.equipment[0].equipmentId).toBe(equipment.equipmentId);
        expect(project.equipment[0].dossierType).toBe(equipment.dossierType);
    });

    it('should allow adding employees to a project', async () => {
        const project = await Project.create(validProjectData);

        const employee = {
            employeeId: 'employee-123',
            role: 'Engineer',
            status: 'Assigné',
            assignedBy: 'user-123'
        };

        project.employees = [employee];
        await project.save();

        expect(project.employees.length).toBe(1);
        expect(project.employees[0].employeeId).toBe(employee.employeeId);
        expect(project.employees[0].role).toBe(employee.role);
        expect(project.employees[0].status).toBe('Assigné');
    });

    it('should have default categories', async () => {
        const project = await Project.create(validProjectData);

        expect(project.categories).toBeDefined();
        expect(project.categories.length).toBeGreaterThan(0);
        expect(project.categories).toContain('Documents globale');
        expect(project.categories).toContain('Dossier Technique');
        expect(project.categories).toContain('Dossier RH');
        expect(project.categories).toContain('Dossier HSE');
        expect(project.categories).toContain('Dossier Administratif');
    });
}); 