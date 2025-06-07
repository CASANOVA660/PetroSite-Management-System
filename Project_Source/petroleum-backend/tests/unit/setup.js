const mongoose = require('mongoose');

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock mongoose
jest.mock('mongoose', () => {
    const mmongoose = jest.requireActual('mongoose');

    // Create mock documents with proper properties based on schema
    const createMockDoc = (schema, data) => {
        const doc = { ...data };

        // Add default values based on model definitions
        // This ensures default values like isDeleted=false get set
        doc.isDeleted = doc.isDeleted === undefined ? false : doc.isDeleted;

        // Add timestamps
        doc.createdAt = doc.createdAt || new Date();
        doc.updatedAt = doc.updatedAt || new Date();

        // Add mongoose document methods
        doc._id = doc._id || `mock-id-${Math.random().toString(36).substring(7)}`;
        doc.save = jest.fn().mockResolvedValue(doc);
        doc.populate = jest.fn().mockReturnValue(doc);
        doc.toObject = jest.fn().mockReturnValue(doc);
        doc.toJSON = jest.fn().mockReturnValue(doc);
        doc.toString = jest.fn().mockReturnValue(doc._id.toString());

        // Add validation methods
        doc.validate = jest.fn().mockResolvedValue(true);
        doc.invalidate = jest.fn((field, message) => {
            throw new Error(message);
        });

        return doc;
    };

    // Store schemas and models
    const schemas = {};
    const modelFunctions = {};

    // Default mock model implementation
    const createMockModel = (name) => {
        const modelFunctions = {
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
                const schema = schemas[name];

                // Apply defaults based on schema if available
                if (schema && schema.paths) {
                    Object.keys(schema.paths).forEach(path => {
                        if (path !== '_id' &&
                            schema.paths[path].defaultValue !== undefined &&
                            data[path] === undefined) {
                            data[path] = typeof schema.paths[path].defaultValue === 'function'
                                ? schema.paths[path].defaultValue()
                                : schema.paths[path].defaultValue;
                        }
                    });
                }

                return Promise.resolve(createMockDoc(schema, data));
            }),
            findByIdAndUpdate: jest.fn().mockImplementation((id, update, options = {}) => {
                const doc = createMockDoc(schemas[name], { _id: id, ...update });
                return options && options.new ? Promise.resolve(doc) : Promise.resolve(null);
            }),
            findOneAndUpdate: jest.fn().mockImplementation((filter, update, options = {}) => {
                const doc = createMockDoc(schemas[name], { ...filter, ...update });
                return options && options.new ? Promise.resolve(doc) : Promise.resolve(null);
            }),
            updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            countDocuments: jest.fn().mockResolvedValue(0),
            findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'deleted-id' })
        };

        return modelFunctions;
    };

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

            // Create model functions if they don't exist
            if (!modelFunctions[name]) {
                modelFunctions[name] = createMockModel(name);
            }

            return modelFunctions[name];
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

// Mock cloudinary
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test_public_id',
                secure_url: 'https://test-url.com/image.jpg',
                format: 'jpg',
                resource_type: 'image',
                width: 800,
                height: 600,
                size: 123456
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    }
}));

// Mock express response for controller tests
global.mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockImplementation(data => {
        res.data = data;
        return res;
    });
    return res;
};

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

// Error handling helper
global.simulateValidationError = (field, message) => {
    const error = new mongoose.Error.ValidationError();
    error.errors = {};
    error.errors[field] = {
        message,
        name: 'ValidatorError',
        properties: {
            message,
            type: 'required',
            path: field
        },
        kind: 'required',
        path: field
    };
    return error;
};

// Clean console output during tests
global.originalConsoleLog = console.log;
global.originalConsoleError = console.error;
console.log = jest.fn();
console.error = jest.fn();

afterAll(() => {
    console.log = global.originalConsoleLog;
    console.error = global.originalConsoleError;
}); 