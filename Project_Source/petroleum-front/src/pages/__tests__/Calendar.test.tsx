import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Calendar from '../Calendar';
import authReducer from '../../store/slices/authSlice';

const mockEvents = [
    {
        id: '1',
        title: 'Team Meeting',
        start: '2024-03-20T10:00:00Z',
        end: '2024-03-20T11:00:00Z',
        color: '#4CAF50'
    },
    {
        id: '2',
        title: 'Project Deadline',
        start: '2024-03-25T15:00:00Z',
        end: '2024-03-25T16:00:00Z',
        color: '#F44336'
    }
];

// Mock the API calls
jest.mock('../../utils/axios', () => ({
    get: jest.fn(() => Promise.resolve({ data: mockEvents })),
    post: jest.fn(() => Promise.resolve({ data: mockEvents[0] })),
    put: jest.fn(() => Promise.resolve({ data: mockEvents[0] })),
    delete: jest.fn(() => Promise.resolve({ data: { message: 'Event deleted successfully' } }))
}));

const renderCalendar = () => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
        },
        preloadedState: {
            auth: {
                user: {
                    _id: '1',
                    nom: 'John Doe',
                    email: 'john@example.com',
                    role: 'user'
                },
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
                <Calendar />
            </BrowserRouter>
        </Provider>
    );
};

describe('Calendar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders calendar page', () => {
        renderCalendar();
        expect(screen.getByText(/calendar/i)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        renderCalendar();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays events after loading', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText('Team Meeting')).toBeInTheDocument();
            expect(screen.getByText('Project Deadline')).toBeInTheDocument();
        });
    });

    it('allows adding new events', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: /add event/i });
        await userEvent.click(addButton);

        const titleInput = screen.getByLabelText(/title/i);
        const startInput = screen.getByLabelText(/start/i);
        const endInput = screen.getByLabelText(/end/i);

        await userEvent.type(titleInput, 'New Event');
        await userEvent.type(startInput, '2024-03-30T10:00:00Z');
        await userEvent.type(endInput, '2024-03-30T11:00:00Z');

        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('New Event')).toBeInTheDocument();
        });
    });

    it('allows editing existing events', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        });

        const event = screen.getByText('Team Meeting');
        await userEvent.click(event);

        const titleInput = screen.getByLabelText(/title/i);
        await userEvent.clear(titleInput);
        await userEvent.type(titleInput, 'Updated Meeting');

        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Updated Meeting')).toBeInTheDocument();
        });
    });

    it('allows deleting events', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        });

        const event = screen.getByText('Team Meeting');
        await userEvent.click(event);

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        await userEvent.click(confirmButton);

        await waitFor(() => {
            expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument();
        });
    });

    it('allows switching between calendar views', async () => {
        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        });

        const monthViewButton = screen.getByRole('button', { name: /month/i });
        const weekViewButton = screen.getByRole('button', { name: /week/i });
        const dayViewButton = screen.getByRole('button', { name: /day/i });

        await userEvent.click(weekViewButton);
        expect(screen.getByText('Week')).toBeInTheDocument();

        await userEvent.click(dayViewButton);
        expect(screen.getByText('Day')).toBeInTheDocument();

        await userEvent.click(monthViewButton);
        expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('displays error message when data fetch fails', async () => {
        // Mock API error
        jest.spyOn(require('../../utils/axios'), 'get').mockRejectedValueOnce(new Error('Failed to fetch'));

        renderCalendar();

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
}); 