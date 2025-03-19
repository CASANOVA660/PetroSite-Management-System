import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import SignInForm from '../SignInForm';
import authReducer from '../../../store/slices/authSlice';

const renderSignInForm = () => {
    const store = configureStore({
        reducer: {
            auth: authReducer,
        },
    });

    return render(
        <Provider store={store}>
            <BrowserRouter>
                <SignInForm />
            </BrowserRouter>
        </Provider>
    );
};

describe('SignInForm', () => {
    it('renders sign in form correctly', () => {
        renderSignInForm();

        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email input', async () => {
        renderSignInForm();

        const emailInput = screen.getByPlaceholderText(/email/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await userEvent.type(emailInput, 'invalid-email');
        await userEvent.click(submitButton);

        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        renderSignInForm();

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(submitButton);

        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
        renderSignInForm();

        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.click(submitButton);

        // Note: We can't test the actual API call here as it's mocked in the component
        // We can only verify that the form submission was attempted
        expect(submitButton).toBeDisabled();
    });
}); 