// Setup test environment before running tests
const mongoose = require('mongoose');

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock all external dependencies
jest.mock('mongoose', () => {
    const mmongoose = jest.requireActual('mongoose');

    // Create mock documents with proper properties based on schema
    const createMockDoc = (schema, data) => {
        const doc = { ...data };

        // Add default values from schema
        if (schema) {
            Object.keys(schema.paths).forEach(path => {
                if (path !== '_id' && schema.paths[path].defaultValue !== undefined && doc[path] === undefined) {
                    doc[path] = typeof schema.paths[path].defaultValue === 'function'
                        ? schema.paths[path].defaultValue()
                        : schema.paths[path].defaultValue;
                }
            });
        }

        // Add mongoose document methods
        doc._id = doc._id || `mock-id-${Math.random().toString(36).substring(7)}`;
        doc.save = jest.fn().mockResolvedValue(doc);
        doc.populate = jest.fn().mockReturnValue(doc);
        doc.toObject = jest.fn().mockReturnValue(doc);
        doc.toString = jest.fn().mockReturnValue(doc._id.toString());

        return doc;
    };

    // Store schemas
    const schemas = {};

    return {
        ...mmongoose,
        Schema: class MockSchema extends mmongoose.Schema {
            constructor(definition, options) {
                super(definition, options);
                this.paths = {};

                // Extract paths and default values
                Object.keys(definition).forEach(key => {
                    const path = definition[key];
                    this.paths[key] = {
                        defaultValue: path.default,
                        required: path.required,
                        enum: path.enum
                    };

                    // Handle sub-documents
                    if (path instanceof Object && !(path instanceof Array) && !path.type) {
                        Object.keys(path).forEach(subKey => {
                            this.paths[`${key}.${subKey}`] = {
                                defaultValue: path[subKey].default,
                                required: path[subKey].required
                            };
                        });
                    }
                });
            }

            pre() {
                return this;
            }

            index() {
                return this;
            }
        },
        model: jest.fn().mockImplementation((name, schema) => {
            schemas[name] = schema;

            return {
                find: jest.fn().mockReturnThis(),
                findOne: jest.fn().mockReturnThis(),
                findById: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
                create: jest.fn().mockImplementation((data) => {
                    return Promise.resolve(createMockDoc(schemas[name], data));
                }),
                findByIdAndUpdate: jest.fn().mockResolvedValue(null),
                findOneAndUpdate: jest.fn().mockResolvedValue(null),
                updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
                deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
                countDocuments: jest.fn().mockResolvedValue(0)
            };
        }),
        connect: jest.fn().mockResolvedValue({}),
        connection: {
            collections: {},
            createCollection: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
        },
        Types: {
            ...mmongoose.Types,
            ObjectId: jest.fn((id) => id || `mock-id-${Math.random().toString(36).substring(7)}`),
        }
    };
});

// Mock Redis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
    }));
});

// Mock cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_public_id',
                secure_url: 'https://test-url.com/image.jpg'
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    }
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockImplementation((token, secret) => {
        if (token === 'valid-token') {
            return { userId: 'test-user-id', role: 'Manager' };
        } else {
            throw new Error('Invalid token');
        }
    })
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
}));

// Mock file upload utilities
jest.mock('multer', () => ({
    diskStorage: jest.fn(),
    memoryStorage: jest.fn(),
    single: jest.fn().mockReturnValue((req, res, next) => next()),
    array: jest.fn().mockReturnValue((req, res, next) => next()),
    fields: jest.fn().mockReturnValue((req, res, next) => next()),
}));

// Global test helper
global.createTestUser = async (User, userData = {}) => {
    const defaultUser = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com',
        role: 'Manager',
        telephone: '12345678',
        city: 'Test City',
        state: 'Test State',
        estActif: true,
        employeeId: 'ITAL-MAG-0001'
    };

    return await User.create({ ...defaultUser, ...userData });
};

// Mock console methods for clean test output
global.originalConsoleLog = console.log;
global.originalConsoleError = console.error;
console.log = jest.fn();
console.error = jest.fn();

// Restore console after all tests
afterAll(() => {
    console.log = global.originalConsoleLog;
    console.error = global.originalConsoleError;
}); 