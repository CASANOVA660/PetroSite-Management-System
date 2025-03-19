import React, { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { HelmetProvider } from 'react-helmet-async';
import { SidebarProvider } from '../context/SidebarContext';
import userReducer from '../store/slices/userSlice';
import authReducer from '../store/slices/authSlice';
import notificationReducer from '../store/slices/notificationSlice';
import { ThemeProvider } from '../context/ThemeContext';

// Mock user data for testing
export const mockUser1 = {
    _id: '1',
    nom: 'Doe',
    prenom: 'John',
    email: 'john@example.com',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
};

export const mockUser2 = {
    _id: '2',
    nom: 'Smith',
    prenom: 'Jane',
    email: 'jane@example.com',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
};

// Default initial state for testing
export const defaultInitialState = {
    users: {
        users: [mockUser1, mockUser2],
        currentUser: mockUser1,
        loading: false,
        error: null
    },
    auth: {
        isAuthenticated: true,
        user: mockUser1,
        loading: false,
        error: null
    },
    notification: {
        notifications: [],
        loading: false,
        error: null
    }
};

// Create root reducer
const rootReducer = {
    users: userReducer,
    auth: authReducer,
    notification: notificationReducer
};

// Create a custom renderer that includes providers
export function renderWithProviders(
    ui: React.ReactElement,
    {
        preloadedState = defaultInitialState,
        store = configureStore({
            reducer: rootReducer,
            preloadedState
        }),
        ...renderOptions
    } = {}
) {
    function Wrapper({ children }: PropsWithChildren<{}>) {
        return (
            <Provider store={store}>
                <BrowserRouter>
                    <HelmetProvider>
                        <ThemeProvider>
                            <SidebarProvider>
                                {children}
                            </SidebarProvider>
                        </ThemeProvider>
                    </HelmetProvider>
                </BrowserRouter>
            </Provider>
        );
    }

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render }; 