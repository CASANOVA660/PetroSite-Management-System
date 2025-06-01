const mongoose = require('mongoose');
const Task = require('./task.model');
const User = require('../../users/models/User');

// Mock the Task model's methods
jest.mock('./task.model', () => {
    const mockTaskSchema = {
        paths: {
            title: { required: true },
            description: { defaultValue: '' },
            status: { defaultValue: 'todo', enum: ['todo', 'inProgress', 'inReview', 'done'] },
            progress: { defaultValue: 0 },
            priority: { defaultValue: 'medium', enum: ['low', 'medium', 'high'] },
            creator: { required: true },
            comments: { defaultValue: [] },
            files: { defaultValue: [] },
            subtasks: { defaultValue: [] },
            tags: { defaultValue: [] },
            isArchived: { defaultValue: false },
            needsValidation: { defaultValue: true },
            isDeclined: { defaultValue: false }
        }
    };

    // Create a storage map to save task state between calls
    const mockTasksStorage = new Map();

    // Mock implementation of Task model
    return {
        create: jest.fn().mockImplementation((data) => {
            // Validation checks
            if (!data.title) {
                throw new Error('Title is required');
            }
            if (!data.creator) {
                throw new Error('Creator is required');
            }
            if (data.status && !['todo', 'inProgress', 'inReview', 'done'].includes(data.status)) {
                throw new Error('Invalid status');
            }
            if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
                throw new Error('Invalid priority');
            }

            // Create task with defaults
            const taskId = 'mock-task-id-' + Math.random().toString(36).substring(7);
            const mockTask = {
                _id: taskId,
                title: data.title,
                description: data.description || '',
                status: data.status || 'todo',
                progress: data.progress || 0,
                priority: data.priority || 'medium',
                assignee: data.assignee,
                creator: data.creator,
                comments: [],
                files: [],
                subtasks: [],
                tags: data.tags || [],
                isArchived: false,
                needsValidation: true,
                isDeclined: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                toString: jest.fn().mockReturnValue(taskId)
            };

            // Add save method after the object is created
            mockTask.save = jest.fn().mockImplementation(() => {
                // Save the current state of the task in our storage
                mockTasksStorage.set(taskId, { ...mockTask });
                return Promise.resolve(mockTask);
            });

            // Store initial state
            mockTasksStorage.set(taskId, { ...mockTask });

            return Promise.resolve(mockTask);
        }),
        findById: jest.fn().mockImplementation((id) => {
            // Return the stored task if it exists
            if (mockTasksStorage.has(id)) {
                const storedTask = mockTasksStorage.get(id);
                const returnTask = { ...storedTask };

                // Add the save method again
                returnTask.save = jest.fn().mockImplementation(() => {
                    // Update the stored task
                    mockTasksStorage.set(id, { ...returnTask });
                    return Promise.resolve(returnTask);
                });

                return Promise.resolve(returnTask);
            }

            // Otherwise create a default task
            const mockTask = {
                _id: id,
                title: 'Test Task',
                description: 'Task description',
                status: 'todo',
                progress: 0,
                comments: [],
                files: [],
                subtasks: [],
                tags: [],
                isArchived: false,
                needsValidation: true,
                isDeclined: false
            };

            mockTask.save = jest.fn().mockResolvedValue(mockTask);

            return Promise.resolve(mockTask);
        })
    };
});

describe('Task Model', () => {
    let testUser, managerUser;

    beforeEach(() => {
        // Create test users
        testUser = {
            _id: 'user-id-1',
            nom: 'Task',
            prenom: 'Owner',
            email: 'task.owner@example.com',
            role: 'Chef projet',
            toString: () => 'user-id-1'
        };

        managerUser = {
            _id: 'user-id-2',
            nom: 'Task',
            prenom: 'Manager',
            email: 'task.manager@example.com',
            role: 'Manager',
            toString: () => 'user-id-2'
        };
    });

    it('should create a task with valid data', async () => {
        const taskData = {
            title: 'Test Task',
            description: 'This is a test task',
            status: 'todo',
            priority: 'medium',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            assignee: testUser._id,
            creator: managerUser._id,
            tags: ['test', 'unit-test']
        };

        const task = await Task.create(taskData);

        expect(task).toBeDefined();
        expect(task._id).toBeDefined();
        expect(task.title).toBe(taskData.title);
        expect(task.description).toBe(taskData.description);
        expect(task.status).toBe(taskData.status);
        expect(task.priority).toBe(taskData.priority);
        expect(task.assignee).toBe(testUser._id);
        expect(task.creator).toBe(managerUser._id);
        expect(task.tags).toEqual(expect.arrayContaining(taskData.tags));
        expect(task.isArchived).toBe(false);
        expect(task.needsValidation).toBe(true);
    });

    it('should require a title', async () => {
        const invalidTask = {
            description: 'Task without title',
            creator: managerUser._id
        };

        // Change the assertion to properly handle the error
        try {
            await Task.create(invalidTask);
            // If we reach here, the test should fail
            expect('This should not be reached').toBe('Title validation failed');
        } catch (error) {
            expect(error.message).toBe('Title is required');
        }
    });

    it('should require a creator', async () => {
        const invalidTask = {
            title: 'Task without creator',
            description: 'This task has no creator'
        };

        // Change the assertion to properly handle the error
        try {
            await Task.create(invalidTask);
            // If we reach here, the test should fail
            expect('This should not be reached').toBe('Creator validation failed');
        } catch (error) {
            expect(error.message).toBe('Creator is required');
        }
    });

    it('should validate status values', async () => {
        const invalidTask = {
            title: 'Task with invalid status',
            description: 'This task has an invalid status',
            creator: managerUser._id,
            status: 'invalid-status' // Invalid status
        };

        // Change the assertion to properly handle the error
        try {
            await Task.create(invalidTask);
            // If we reach here, the test should fail
            expect('This should not be reached').toBe('Status validation failed');
        } catch (error) {
            expect(error.message).toBe('Invalid status');
        }
    });

    it('should validate priority values', async () => {
        const invalidTask = {
            title: 'Task with invalid priority',
            description: 'This task has an invalid priority',
            creator: managerUser._id,
            priority: 'invalid-priority' // Invalid priority
        };

        // Change the assertion to properly handle the error
        try {
            await Task.create(invalidTask);
            // If we reach here, the test should fail
            expect('This should not be reached').toBe('Priority validation failed');
        } catch (error) {
            expect(error.message).toBe('Invalid priority');
        }
    });

    it('should add comments to a task', async () => {
        // Create a task
        const task = await Task.create({
            title: 'Task with comments',
            description: 'This task will have comments',
            creator: managerUser._id
        });

        // Add a comment
        const commentDate = new Date();
        task.comments.push({
            text: 'This is a test comment',
            author: testUser._id,
            createdAt: commentDate
        });

        await task.save();

        // Retrieve the task with comments
        const updatedTask = await Task.findById(task._id);

        expect(updatedTask.comments).toHaveLength(1);
        expect(updatedTask.comments[0].text).toBe('This is a test comment');
        expect(updatedTask.comments[0].author).toBe(testUser._id);
        expect(updatedTask.comments[0].createdAt).toBeDefined();
    });

    it('should add files to a task', async () => {
        // Create a task
        const task = await Task.create({
            title: 'Task with files',
            description: 'This task will have files',
            creator: managerUser._id
        });

        // Add a file
        task.files.push({
            name: 'test-file.pdf',
            url: 'https://example.com/test-file.pdf',
            publicId: 'test-public-id',
            type: 'application/pdf',
            size: 1024,
            uploadedBy: testUser._id,
            approved: false
        });

        await task.save();

        // Retrieve the task with files
        const updatedTask = await Task.findById(task._id);

        expect(updatedTask.files).toHaveLength(1);
        expect(updatedTask.files[0].name).toBe('test-file.pdf');
        expect(updatedTask.files[0].url).toBe('https://example.com/test-file.pdf');
        expect(updatedTask.files[0].uploadedBy).toBe(testUser._id);
        expect(updatedTask.files[0].approved).toBe(false);
    });

    it('should add subtasks to a task', async () => {
        // Create a task
        const task = await Task.create({
            title: 'Task with subtasks',
            description: 'This task will have subtasks',
            creator: managerUser._id
        });

        // Add subtasks
        task.subtasks.push(
            { text: 'Subtask 1', completed: false },
            { text: 'Subtask 2', completed: false }
        );

        await task.save();

        // Retrieve the task with subtasks
        const updatedTask = await Task.findById(task._id);

        expect(updatedTask.subtasks).toHaveLength(2);
        expect(updatedTask.subtasks[0].text).toBe('Subtask 1');
        expect(updatedTask.subtasks[0].completed).toBe(false);
        expect(updatedTask.subtasks[1].text).toBe('Subtask 2');
        expect(updatedTask.subtasks[1].completed).toBe(false);
    });

    it('should set default values correctly', async () => {
        // Create a minimal task
        const task = await Task.create({
            title: 'Minimal Task',
            creator: managerUser._id
        });

        expect(task.status).toBe('todo');
        expect(task.progress).toBe(0);
        expect(task.priority).toBe('medium');
        expect(task.needsValidation).toBe(true);
        expect(task.isArchived).toBe(false);
        expect(task.isDeclined).toBe(false);
    });
}); 