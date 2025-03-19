import { renderWithProviders } from '../../../utils/test-utils';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDropdown from '../UserDropdown';

describe('UserDropdown', () => {
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

    it('displays user dropdown menu when clicked', async () => {
        renderWithProviders(<UserDropdown />, {
            preloadedState: mockState
        });

        const dropdownButton = screen.getByRole('button', { name: /D Doe/i });
        await act(async () => {
            await userEvent.click(dropdownButton);
        });

        expect(screen.getByText('Edit profile')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        // Use getAllByText and find the one with the correct class
        const dropdownName = screen.getAllByText('Doe').find(
            element => element.classList.contains('text-gray-700')
        );
        expect(dropdownName).toBeInTheDocument();
    });

    it('displays user initials correctly', () => {
        renderWithProviders(<UserDropdown />, {
            preloadedState: mockState
        });

        const initialsElement = screen.getByText('D');
        expect(initialsElement).toHaveClass('bg-brand-500');
        const nameElement = screen.getByText('Doe', { selector: '.mr-1' });
        expect(nameElement).toBeInTheDocument();
    });

    it('hides dropdown menu by default', () => {
        renderWithProviders(<UserDropdown />, {
            preloadedState: mockState
        });

        expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
    });
}); 