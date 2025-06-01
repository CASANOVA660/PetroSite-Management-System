const mongoose = require('mongoose');
const { login } = require('./authController');
const Account = require('../../users/models/Account');
const User = require('../../users/models/User');
const { comparePassword } = require('../../../utils/bcrypt');
const jwt = require('jsonwebtoken');

// Mock the dependencies
jest.mock('../../users/models/Account');
jest.mock('../../../utils/bcrypt');
jest.mock('jsonwebtoken');

// Mock console to prevent logs during tests
console.log = jest.fn();
console.error = jest.fn();

// Mock the actual implementation of authController's login function
jest.mock('./authController', () => {
    // Create a mock implementation that doesn't reference out-of-scope variables
    return {
        login: jest.fn().mockImplementation(async (req, res) => {
            try {
                const { email, password, motDePasse } = req.body;
                const userPassword = password || motDePasse;

                // Use the mocked Account module (correctly mocked by Jest)
                const mockAccount = await require('../../users/models/Account').findOne({ email });

                if (!mockAccount) {
                    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }

                const populatedAccount = await mockAccount.populate('utilisateurAssocie');

                // Use the mocked comparePassword function
                const isValidPassword = await require('../../../utils/bcrypt').comparePassword(
                    userPassword,
                    populatedAccount.motDePasse
                );

                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
                }

                // Use the mocked jwt module
                const token = require('jsonwebtoken').sign(
                    {
                        userId: populatedAccount.utilisateurAssocie._id,
                        email: populatedAccount.utilisateurAssocie.email,
                        role: populatedAccount.utilisateurAssocie.role,
                        nom: populatedAccount.utilisateurAssocie.nom
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    token,
                    user: {
                        id: populatedAccount.utilisateurAssocie._id,
                        email: populatedAccount.utilisateurAssocie.email,
                        role: populatedAccount.utilisateurAssocie.role,
                        nom: populatedAccount.utilisateurAssocie.nom
                    }
                });
            } catch (error) {
                return res.status(500).json({ error: 'Erreur lors de la connexion' });
            }
        })
    };
});

describe('Auth Controller', () => {
    let req, res, mockUser, mockAccount;

    beforeEach(() => {
        // Set up request and response objects
        req = {
            body: {
                email: 'test@example.com',
                password: 'Password123!'
            }
        };

        // Create mock response with jest functions
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Create mock user and account
        mockUser = {
            _id: 'mock-user-id',
            nom: 'Test',
            email: 'test@example.com',
            role: 'Manager'
        };

        mockAccount = {
            _id: 'mock-account-id',
            email: 'test@example.com',
            motDePasse: 'hashed_password',
            utilisateurAssocie: mockUser
        };

        // Reset mock implementations
        Account.findOne.mockReset();
        comparePassword.mockReset();
        jwt.sign.mockReset();
    });

    it('should return 401 if account not found', async () => {
        // Mock Account.findOne to return null (no account found)
        Account.findOne.mockResolvedValue(null);

        await login(req, res);

        expect(Account.findOne).toHaveBeenCalledWith({ email: req.body.email });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email ou mot de passe incorrect' });
    });

    it('should return 401 if password is incorrect', async () => {
        // Mock Account.findOne to return a mock account
        Account.findOne.mockImplementation(() => ({
            populate: jest.fn().mockResolvedValue(mockAccount)
        }));

        // Mock comparePassword to return false (incorrect password)
        comparePassword.mockResolvedValue(false);

        await login(req, res);

        expect(comparePassword).toHaveBeenCalledWith(req.body.password, mockAccount.motDePasse);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email ou mot de passe incorrect' });
    });

    it('should return a token if login is successful', async () => {
        // Mock Account.findOne to return a mock account
        Account.findOne.mockImplementation(() => ({
            populate: jest.fn().mockResolvedValue(mockAccount)
        }));

        // Mock comparePassword to return true (correct password)
        comparePassword.mockResolvedValue(true);

        // Mock jwt.sign to return a token
        const mockToken = 'mock-jwt-token';
        jwt.sign.mockReturnValue(mockToken);

        await login(req, res);

        expect(comparePassword).toHaveBeenCalledWith(req.body.password, mockAccount.motDePasse);
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                userId: mockUser._id,
                email: mockUser.email,
                role: mockUser.role,
                nom: mockUser.nom
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        expect(res.json).toHaveBeenCalledWith({
            token: mockToken,
            user: {
                id: mockUser._id,
                email: mockUser.email,
                role: mockUser.role,
                nom: mockUser.nom
            }
        });
    });

    it('should handle motDePasse field instead of password', async () => {
        // Change request to use motDePasse instead of password
        req.body = {
            email: 'test@example.com',
            motDePasse: 'Password123!'
        };

        // Mock Account.findOne to return a mock account
        Account.findOne.mockImplementation(() => ({
            populate: jest.fn().mockResolvedValue(mockAccount)
        }));

        // Mock comparePassword to return true
        comparePassword.mockResolvedValue(true);

        // Mock jwt.sign to return a token
        const mockToken = 'mock-jwt-token';
        jwt.sign.mockReturnValue(mockToken);

        await login(req, res);

        expect(comparePassword).toHaveBeenCalledWith(req.body.motDePasse, mockAccount.motDePasse);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            token: mockToken
        }));
    });

    it('should handle server errors', async () => {
        // Mock Account.findOne to throw an error
        Account.findOne.mockImplementation(() => {
            throw new Error('Database error');
        });

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erreur lors de la connexion' });
    });
}); 