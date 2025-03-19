import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../Dashboard/Home';
import authReducer from '../../store/slices/authSlice';

const mockUser = {
    _id: '123',
    nom: 'John Doe',
    email: 'john@example.com',
    role: 'user'
};

const mockDashboardData = {
    totalUsers: 150,
    totalProjects: 25,
    totalTasks: 100,
    recentActivities: [
        {
            id: 1,
            type: 'login',
            user: 'John Doe',
            timestamp: '2024-03-17T10:00:00Z'
        },
        {
            id: 2,
            type: 'project_created',
            user: 'Jane Smith',
            timestamp: '2024-03-17T09:30:00Z'
        }
    ],
    chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Users',
                data: [100, 120, 130, 140, 145, 150]
            }
        ]
    }
};

// Mock the API calls
jest.mock('../../utils/axios', () => ({
    get: jest.fn(() => Promise.resolve({ data: mockDashboardData }))
}));

const renderDashboard = () => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
        },
        preloadedState: {
            auth: {
                user: mockUser,
                isAuthenticated: true,
                loading: false,
                error: null,
                token: 'mock-token'
            }
        }
    });

    return render(
        <Provider store={store}>
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        </Provider>
    );
};

describe('Dashboard', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('renders dashboard title', () => {
        renderDashboard();
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        renderDashboard();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays dashboard data after loading', async () => {
        renderDashboard();

        // Wait for the data to be loaded
        await waitFor(() => {
            expect(screen.getByText('150')).toBeInTheDocument(); // Total Users
            expect(screen.getByText('25')).toBeInTheDocument();  // Total Projects
            expect(screen.getByText('100')).toBeInTheDocument(); // Total Tasks
        });

        // Check for recent activities
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('displays error message when data fetch fails', async () => {
        // Mock API error
        jest.spyOn(require('../../utils/axios'), 'get').mockRejectedValueOnce(new Error('Failed to fetch'));

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });

    it('renders charts when data is loaded', async () => {
        renderDashboard();

        await waitFor(() => {
            // Check for chart container
            expect(screen.getByTestId('users-chart')).toBeInTheDocument();
        });
    });

    it('updates data periodically', async () => {
        jest.useFakeTimers();
        renderDashboard();

        // Initial data load
        await waitFor(() => {
            expect(screen.getByText('150')).toBeInTheDocument();
        });

        // Update mock data
        const updatedData = {
            ...mockDashboardData,
            totalUsers: 160
        };
        jest.spyOn(require('../../utils/axios'), 'get').mockResolvedValueOnce({ data: updatedData });

        // Fast forward time
        jest.advanceTimersByTime(30000); // 30 seconds

        // Check for updated data
        await waitFor(() => {
            expect(screen.getByText('160')).toBeInTheDocument();
        });

        jest.useRealTimers();
    });
}); 