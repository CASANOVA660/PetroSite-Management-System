import { renderWithProviders } from '../../utils/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppHeader from '../AppHeader';

describe('AppHeader', () => {
    beforeEach(() => {
        // Reset window dimensions before each test
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024
        });
    });

    it('renders header with logo', () => {
        renderWithProviders(<AppHeader />);
        expect(screen.getByAltText('Italfluid Petroconnect')).toBeInTheDocument();
    });

    it('shows user dropdown when authenticated', () => {
        renderWithProviders(<AppHeader />, {
            preloadedState: {
                users: {
                    users: [],
                    currentUser: {
                        _id: '1',
                        nom: 'Doe',
                        prenom: 'John',
                        email: 'john@example.com',
                        role: 'user',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    },
                    loading: false,
                    error: null
                },
                auth: {
                    isAuthenticated: true,
                    user: {
                        _id: '1',
                        nom: 'Doe',
                        prenom: 'John',
                        email: 'john@example.com',
                        role: 'user',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    },
                    loading: false,
                    error: null
                },
                notification: {
                    notifications: [],
                    loading: false,
                    error: null
                }
            }
        });
        expect(screen.getByRole('button', { name: /D Doe/i })).toBeInTheDocument();
    });

    it('hides user dropdown when not authenticated', () => {
        const emptyUser = {
            _id: '',
            nom: '',
            prenom: '',
            email: '',
            role: '',
            createdAt: '',
            updatedAt: ''
        };

        renderWithProviders(<AppHeader />, {
            preloadedState: {
                users: {
                    users: [],
                    currentUser: emptyUser,
                    loading: false,
                    error: null
                },
                auth: {
                    isAuthenticated: false,
                    user: emptyUser,
                    loading: false,
                    error: null
                },
                notification: {
                    notifications: [],
                    loading: false,
                    error: null
                }
            }
        });
        expect(screen.queryByRole('button', { name: /D Doe/i })).not.toBeInTheDocument();
    });

    it('toggles sidebar when menu button is clicked', async () => {
        renderWithProviders(<AppHeader />);
        const menuButton = screen.getByRole('button', { name: /Toggle Sidebar/i });
        await userEvent.click(menuButton);
        // Add assertions for sidebar state if needed
    });

    it('shows responsive logo for different screen sizes', () => {
        renderWithProviders(<AppHeader />);
        const logo = screen.getByAltText('Italfluid Petroconnect');
        expect(logo).toHaveClass('h-10');
    });

    it('opens user dropdown when clicked', async () => {
        renderWithProviders(<AppHeader />, {
            preloadedState: {
                users: {
                    users: [],
                    currentUser: {
                        _id: '1',
                        nom: 'Doe',
                        prenom: 'John',
                        email: 'john@example.com',
                        role: 'user',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    },
                    loading: false,
                    error: null
                },
                auth: {
                    isAuthenticated: true,
                    user: {
                        _id: '1',
                        nom: 'Doe',
                        prenom: 'John',
                        email: 'john@example.com',
                        role: 'user',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        updatedAt: '2024-01-01T00:00:00.000Z'
                    },
                    loading: false,
                    error: null
                },
                notification: {
                    notifications: [],
                    loading: false,
                    error: null
                }
            }
        });
        const userButton = screen.getByRole('button', { name: /D Doe/i });
        await userEvent.click(userButton);
        expect(screen.getByText('Edit profile')).toBeInTheDocument();
    });

    it('shows search input with keyboard shortcut', () => {
        renderWithProviders(<AppHeader />);
        const searchInput = screen.getByPlaceholderText('Search or type command...');
        expect(searchInput).toBeInTheDocument();
        expect(screen.getByText('⌘')).toBeInTheDocument();
        expect(screen.getByText('K')).toBeInTheDocument();
    });
}); 