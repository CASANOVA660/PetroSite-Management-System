import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AppSidebar from '../AppSidebar';
import authReducer from '../../store/slices/authSlice';

const mockUser = {
    _id: '123',
    nom: 'John Doe',
    email: 'john@example.com',
    role: 'user'
};

const renderAppSidebar = (isAuthenticated = true) => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
        },
        preloadedState: {
            auth: {
                user: isAuthenticated ? mockUser : null,
                isAuthenticated,
                loading: false,
                error: null,
                token: isAuthenticated ? 'mock-token' : null
            }
        }
    });

    return render(
        <Provider store={store}>
            <BrowserRouter>
                <AppSidebar />
            </BrowserRouter>
        </Provider>
    );
};

describe('AppSidebar', () => {
    it('renders sidebar with logo', () => {
        renderAppSidebar();
        expect(screen.getByAltText('Italfluid Petroconnect')).toBeInTheDocument();
    });

    it('shows navigation menu items', () => {
        renderAppSidebar();

        // Check for main navigation items
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
        expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('expands sidebar when hovered', async () => {
        renderAppSidebar();
        const sidebar = screen.getByRole('navigation');

        await userEvent.hover(sidebar);

        // Check if the sidebar has expanded class
        expect(sidebar).toHaveClass('expanded');
    });

    it('shows user info when expanded', async () => {
        renderAppSidebar();
        const sidebar = screen.getByRole('navigation');

        await userEvent.hover(sidebar);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('collapses sidebar when mouse leaves', async () => {
        renderAppSidebar();
        const sidebar = screen.getByRole('navigation');

        // First expand
        await userEvent.hover(sidebar);
        expect(sidebar).toHaveClass('expanded');

        // Then collapse
        await userEvent.unhover(sidebar);
        expect(sidebar).not.toHaveClass('expanded');
    });

    it('shows mobile menu when toggle button is clicked', async () => {
        // Mock window.innerWidth for mobile view
        global.innerWidth = 500;
        global.dispatchEvent(new Event('resize'));

        renderAppSidebar();
        const toggleButton = screen.getByRole('button', { name: /toggle menu/i });

        await userEvent.click(toggleButton);

        // Check if the sidebar has mobile-open class
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toHaveClass('mobile-open');
    });

    it('hides sidebar when not authenticated', () => {
        renderAppSidebar(false);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
}); 