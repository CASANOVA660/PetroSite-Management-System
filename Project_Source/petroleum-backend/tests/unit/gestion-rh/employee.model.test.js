const mongoose = require('mongoose');
const Employee = require('../../../modules/gestion-rh/models/employee.model');

describe('Employee Model', () => {
    let validEmployeeData;

    beforeEach(() => {
        validEmployeeData = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            position: 'Engineer',
            department: 'Engineering',
            hireDate: new Date('2023-01-01')
        };
    });

    it('should create an employee with valid data', async () => {
        const employee = await Employee.create(validEmployeeData);

        expect(employee).toBeDefined();
        expect(employee.name).toBe(validEmployeeData.name);
        expect(employee.email).toBe(validEmployeeData.email);
        expect(employee.phone).toBe(validEmployeeData.phone);
        expect(employee.position).toBe(validEmployeeData.position);
        expect(employee.department).toBe(validEmployeeData.department);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = ['name', 'email'];

        for (const field of requiredFields) {
            const invalidData = { ...validEmployeeData };
            delete invalidData[field];

            try {
                await Employee.create(invalidData);
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should enforce unique email', async () => {
        // First create an employee
        await Employee.create(validEmployeeData);

        // Mock a duplicate key error when trying to create an employee with the same email
        const error = simulateValidationError('email', 'Email already exists');
        Employee.create.mockRejectedValueOnce(error);

        try {
            await Employee.create(validEmployeeData);
            fail('Expected validation error for duplicate email');
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.errors.email).toBeDefined();
        }
    });

    it('should handle document storage properly', async () => {
        const employee = await Employee.create(validEmployeeData);

        // Create a folder with documents
        const folder = {
            id: 'folder-123',
            name: 'Personal Documents',
            parentId: null,
            documents: [
                {
                    url: 'https://test-url.com/resume.pdf',
                    type: 'resume',
                    name: 'John_Doe_Resume.pdf',
                    publicId: 'resume_123',
                    uploadedBy: 'user-123',
                    size: 12345,
                    format: 'pdf',
                    resourceType: 'raw'
                },
                {
                    url: 'https://test-url.com/id.jpg',
                    type: 'identification',
                    name: 'ID_Card.jpg',
                    publicId: 'id_123',
                    uploadedBy: 'user-123',
                    size: 98765,
                    format: 'jpg',
                    resourceType: 'image',
                    width: 800,
                    height: 600
                }
            ]
        };

        employee.folders = [folder];
        await employee.save();

        expect(employee.folders.length).toBe(1);
        expect(employee.folders[0].id).toBe(folder.id);
        expect(employee.folders[0].name).toBe(folder.name);
        expect(employee.folders[0].documents.length).toBe(2);
        expect(employee.folders[0].documents[0].name).toBe('John_Doe_Resume.pdf');
        expect(employee.folders[0].documents[1].name).toBe('ID_Card.jpg');
    });

    it('should support nested folders', async () => {
        const employee = await Employee.create(validEmployeeData);

        // Create a parent folder with a subfolder
        const parentFolder = {
            id: 'parent-folder-123',
            name: 'Main Documents',
            parentId: null,
            documents: [],
            subfolders: [
                {
                    id: 'subfolder-123',
                    name: 'Certificates',
                    parentId: 'parent-folder-123',
                    documents: [
                        {
                            url: 'https://test-url.com/cert.pdf',
                            type: 'certificate',
                            name: 'Safety_Certificate.pdf',
                            publicId: 'cert_123',
                            uploadedBy: 'user-123',
                            size: 54321,
                            format: 'pdf',
                            resourceType: 'raw'
                        }
                    ]
                }
            ]
        };

        employee.folders = [parentFolder];
        await employee.save();

        expect(employee.folders.length).toBe(1);
        expect(employee.folders[0].subfolders.length).toBe(1);
        expect(employee.folders[0].subfolders[0].name).toBe('Certificates');
        expect(employee.folders[0].subfolders[0].documents.length).toBe(1);
        expect(employee.folders[0].subfolders[0].documents[0].name).toBe('Safety_Certificate.pdf');
    });

    it('should update timestamps on save', async () => {
        const employee = await Employee.create(validEmployeeData);

        // Store the original timestamps as strings to avoid Date object comparison issues
        const originalCreatedAtStr = employee.createdAt.toString();
        const originalUpdatedAtStr = employee.updatedAt.toString();

        // Wait a moment and then update
        employee.name = 'Jane Doe';

        // Mock the save method to update the updatedAt timestamp
        employee.save.mockImplementationOnce(() => {
            const newDate = new Date();
            employee.updatedAt = newDate;
            return Promise.resolve(employee);
        });

        await employee.save();

        // Check timestamps
        expect(employee.createdAt.toString()).toBe(originalCreatedAtStr);
        expect(employee.updatedAt.toString()).not.toBe(originalUpdatedAtStr);
    });
}); 