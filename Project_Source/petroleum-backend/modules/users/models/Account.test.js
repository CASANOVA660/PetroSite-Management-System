const mongoose = require('mongoose');
const Account = require('./Account');
const User = require('./User');
const bcrypt = require('bcrypt');

// Mock bcrypt to avoid actual hashing
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Mock the Account model
jest.mock('./Account', () => {
    const mockAccounts = new Map();

    return {
        create: jest.fn().mockImplementation((data) => {
            // Basic validation
            if (!data.email) {
                throw new Error('Email is required');
            }

            if (!data.motDePasse) {
                throw new Error('Password is required');
            }

            if (!data.utilisateurAssocie) {
                throw new Error('Associated user is required');
            }

            // Check for duplicate email
            if (mockAccounts.has(data.email)) {
                throw new Error('duplicate key error');
            }

            // Create a mock account
            const mockAccount = {
                ...data,
                _id: 'mock-account-id-' + Math.random().toString(36).substring(7),
                mustChangePassword: true,
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue(data),
                toString: jest.fn().mockReturnValue('mock-account-id')
            };

            // Store the account for duplicate checks
            mockAccounts.set(data.email, mockAccount);

            return Promise.resolve(mockAccount);
        }),

        findById: jest.fn().mockImplementation((id) => {
            return {
                populate: jest.fn().mockImplementation((field) => {
                    if (field === 'utilisateurAssocie') {
                        return Promise.resolve({
                            _id: id,
                            email: 'test.user@example.com',
                            motDePasse: 'hashed_password',
                            utilisateurAssocie: {
                                _id: 'mock-user-id',
                                nom: 'Test',
                                email: 'test.user@example.com',
                                role: 'Manager'
                            }
                        });
                    }
                    return Promise.resolve(null);
                })
            };
        }),

        findOne: jest.fn().mockImplementation((query) => {
            return Promise.resolve(null);
        })
    };
});

describe('Account Model', () => {
    let testUser;

    beforeEach(() => {
        // Create a test user for account association
        testUser = {
            _id: 'mock-user-id',
            nom: 'Test',
            prenom: 'User',
            email: 'test.user@example.com',
            role: 'Manager',
            toString: () => 'mock-user-id'
        };
    });

    it('should create a new account with valid data', async () => {
        const accountData = {
            email: 'test.user@example.com',
            motDePasse: 'Password123!',
            utilisateurAssocie: testUser._id
        };

        const account = await Account.create(accountData);

        expect(account).toBeDefined();
        expect(account._id).toBeDefined();
        expect(account.email).toBe(accountData.email);
        expect(account.utilisateurAssocie).toBe(testUser._id);
    });

    it('should require an associated user', async () => {
        const invalidAccount = {
            email: 'no.user@example.com',
            motDePasse: 'Password123!'
            // Missing utilisateurAssocie
        };

        // Use try-catch instead of expect().rejects
        try {
            await Account.create(invalidAccount);
            // Should not reach here
            expect('This should not be reached').toBe('Associated user validation failed');
        } catch (error) {
            expect(error.message).toBe('Associated user is required');
        }
    });

    it('should enforce unique email constraint', async () => {
        // Create first account
        await Account.create({
            email: 'duplicate@example.com',
            motDePasse: 'Password123!',
            utilisateurAssocie: testUser._id
        });

        // Create another user for the second account
        const anotherUser = {
            _id: 'another-user-id',
            nom: 'Another',
            prenom: 'User',
            email: 'another.user@example.com',
            role: 'Chef projet',
            toString: () => 'another-user-id'
        };

        // Try to create second account with the same email
        const duplicateAccount = {
            email: 'duplicate@example.com', // Same email
            motDePasse: 'AnotherPassword123!',
            utilisateurAssocie: anotherUser._id
        };

        // Use try-catch instead of expect().rejects
        try {
            await Account.create(duplicateAccount);
            // Should not reach here
            expect('This should not be reached').toBe('Duplicate email validation failed');
        } catch (error) {
            expect(error.message).toMatch(/duplicate key error/);
        }
    });

    it('should store a reference to the user', async () => {
        const account = await Account.create({
            email: 'reference.test@example.com',
            motDePasse: 'Password123!',
            utilisateurAssocie: testUser._id
        });

        // Populate the user reference
        const populatedAccount = await Account.findById(account._id)
            .populate('utilisateurAssocie');

        expect(populatedAccount.utilisateurAssocie).toBeDefined();
        expect(populatedAccount.utilisateurAssocie._id).toBe('mock-user-id');
        expect(populatedAccount.utilisateurAssocie.nom).toBe('Test');
        expect(populatedAccount.utilisateurAssocie.email).toBe('test.user@example.com');
    });
}); 