import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfiles from '../UserProfiles';
import { renderWithProviders } from '../../utils/test-utils';
import axios from 'axios';
import { getUserById } from '../../store/slices/userSlice';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock axios instance
jest.mock('../../utils/axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        interceptors: {
            request: {
                use: jest.fn(),
                eject: jest.fn()
            },
            response: {
                use: jest.fn(),
                eject: jest.fn()
            }
        }
    }
}));

// Mock the getUserById thunk
const mockGetUserById = jest.fn();
jest.mock('../../store/slices/userSlice', () => ({
    ...jest.requireActual('../../store/slices/userSlice'),
    getUserById: () => mockGetUserById()
}));

describe('UserProfiles', () => {
    const mockUser = {
        _id: '1',
        nom: 'Doe',
        prenom: 'John',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
    };

    const mockState = {
        users: {
            users: [],
            currentUser: mockUser,
            loading: false,
            error: null
        },
        auth: {
            isAuthenticated: true,
            user: mockUser,
            loading: false,
            error: null
        },
        notification: {
            notifications: [],
            loading: false,
            error: null
        }
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        // Mock the getUserById thunk to return the mock user
        mockGetUserById.mockResolvedValue(mockUser);
    });

    it('renders profile page correctly', async () => {
        renderWithProviders(<UserProfiles />, {
            preloadedState: mockState
        });

        // Wait for the API call to complete
        await waitFor(() => {
            expect(mockGetUserById).toHaveBeenCalled();
        });

        // Check if the user info is displayed
        expect(screen.getByText('Doe')).toBeInTheDocument();
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('switches between personal info and documents tabs', async () => {
        renderWithProviders(<UserProfiles />, {
            preloadedState: mockState
        });

        // Wait for the API call to complete
        await waitFor(() => {
            expect(mockGetUserById).toHaveBeenCalled();
        });

        const documentsButton = screen.getByRole('button', { name: /documents/i });
        await act(async () => {
            await userEvent.click(documentsButton);
        });

        // Check if the documents section is visible
        expect(screen.getByRole('button', { name: /documents/i })).toHaveClass('border-primary');
    });

    it('displays error message when data fetch fails', async () => {
        // Mock the API call to fail
        mockGetUserById.mockRejectedValue(new Error('Failed to fetch user data'));

        renderWithProviders(<UserProfiles />, {
            preloadedState: mockState
        });

        // Wait for the error message to appear
        await waitFor(() => {
            expect(screen.getByText('Not specified')).toBeInTheDocument();
        });
    });
}); 