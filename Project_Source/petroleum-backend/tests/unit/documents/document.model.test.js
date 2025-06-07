const mongoose = require('mongoose');
const Document = require('../../../modules/documents/models/document.model');

describe('Document Model', () => {
    let validDocumentData;

    beforeEach(() => {
        validDocumentData = {
            name: 'Test Document.pdf',
            url: 'https://test-url.com/document.pdf',
            publicId: 'test_public_id',
            category: 'Dossier Technique',
            projectId: 'project-123',
            uploadedBy: 'user-123',
            format: 'pdf',
            resourceType: 'document',
            size: 12345,
            width: null,
            height: null
        };
    });

    it('should create a document with valid data', async () => {
        const document = await Document.create(validDocumentData);

        expect(document).toBeDefined();
        expect(document.name).toBe(validDocumentData.name);
        expect(document.url).toBe(validDocumentData.url);
        expect(document.publicId).toBe(validDocumentData.publicId);
        expect(document.category).toBe(validDocumentData.category);
        expect(document.projectId).toBe(validDocumentData.projectId);
        expect(document.uploadedBy).toBe(validDocumentData.uploadedBy);
    });

    it('should require mandatory fields', async () => {
        const requiredFields = ['name', 'url', 'publicId', 'category', 'projectId', 'uploadedBy'];

        for (const field of requiredFields) {
            const invalidData = { ...validDocumentData };
            delete invalidData[field];

            try {
                await Document.create(invalidData);
                // Should not reach here
                fail(`Expected validation error for missing ${field}`);
            } catch (error) {
                expect(error).toBeDefined();
            }
        }
    });

    it('should validate document category', async () => {
        const invalidCategory = {
            ...validDocumentData,
            category: 'Invalid Category'
        };

        try {
            await Document.create(invalidCategory);
            fail('Expected validation error for invalid category');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('should handle different document types', async () => {
        // Test image document
        const imageDocument = {
            ...validDocumentData,
            name: 'Test Image.jpg',
            url: 'https://test-url.com/image.jpg',
            format: 'jpg',
            resourceType: 'image',
            width: 800,
            height: 600,
        };

        const image = await Document.create(imageDocument);
        expect(image.resourceType).toBe('image');
        expect(image.width).toBe(800);
        expect(image.height).toBe(600);

        // Test PDF document
        const pdfDocument = {
            ...validDocumentData,
            name: 'Test PDF.pdf',
            url: 'https://test-url.com/document.pdf',
            format: 'pdf',
            resourceType: 'raw',
            width: null,
            height: null,
        };

        const pdf = await Document.create(pdfDocument);
        expect(pdf.resourceType).toBe('raw');
        expect(pdf.width).toBeNull();
        expect(pdf.height).toBeNull();
    });

    it('should store document size', async () => {
        const largeDocument = {
            ...validDocumentData,
            size: 5242880 // 5MB
        };

        const document = await Document.create(largeDocument);
        expect(document.size).toBe(5242880);
    });

    it('should store timestamps', async () => {
        const document = await Document.create(validDocumentData);

        expect(document.createdAt).toBeDefined();
        expect(document.updatedAt).toBeDefined();
    });
}); 