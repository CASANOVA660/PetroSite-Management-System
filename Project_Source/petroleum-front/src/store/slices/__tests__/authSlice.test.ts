import '@testing-library/jest-dom';
import authReducer, {
    loginUser,
    logoutUser,
    clearError
} from '../authSlice';

describe('authSlice', () => {
    const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
    };

    it('should handle initial state', () => {
        expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('loginUser', () => {
        it('should set loading to true when login is pending', () => {
            const action = { type: loginUser.pending.type };
            const state = authReducer(initialState, action);
            expect(state.loading).toBe(true);
            expect(state.error).toBe(null);
        });

        it('should handle successful login', () => {
            const mockUser = {
                _id: '123',
                nom: 'John Doe',
                email: 'john@example.com',
                role: 'user'
            };
            const mockToken = 'mock-token';

            const action = {
                type: loginUser.fulfilled.type,
                payload: { user: mockUser, token: mockToken }
            };

            const state = authReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(mockUser);
            expect(state.token).toBe(mockToken);
            expect(state.error).toBe(null);
        });

        it('should handle login failure', () => {
            const errorMessage = 'Invalid credentials';
            const action = {
                type: loginUser.rejected.type,
                payload: errorMessage
            };

            const state = authReducer(initialState, action);
            expect(state.loading).toBe(false);
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBe(null);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('logoutUser', () => {
        it('should clear user state on logout', () => {
            const loggedInState = {
                user: { _id: '123', nom: 'John Doe', email: 'john@example.com', role: 'user' },
                token: 'mock-token',
                isAuthenticated: true,
                loading: false,
                error: null
            };

            const action = { type: logoutUser.fulfilled.type };
            const state = authReducer(loggedInState, action);
            expect(state.user).toBe(null);
            expect(state.token).toBe(null);
        });
    });

    describe('clearError', () => {
        it('should clear error state', () => {
            const stateWithError = {
                ...initialState,
                error: 'Some error message'
            };

            const state = authReducer(stateWithError, { type: 'auth/clearError' });
            expect(state.error).toBe(null);
        });
    });

    describe('persistence', () => {
        beforeEach(() => {
            // Clear localStorage before each test
            localStorage.clear();
        });

        it('should load initial state from localStorage', () => {
            const storedUser = {
                _id: '123',
                nom: 'John Doe',
                email: 'john@example.com',
                role: 'user'
            };
            const storedToken = 'mock-token';

            localStorage.setItem('user', JSON.stringify(storedUser));
            localStorage.setItem('token', storedToken);

            const state = authReducer(undefined, { type: 'unknown' });
            expect(state.user).toEqual(storedUser);
            expect(state.token).toBe(storedToken);
            expect(state.isAuthenticated).toBe(true);
        });

        it('should handle invalid stored data', () => {
            localStorage.setItem('user', 'invalid-json');
            localStorage.setItem('token', 'mock-token');

            const state = authReducer(undefined, { type: 'unknown' });
            expect(state.user).toBe(null);
            expect(state.token).toBe(null);
            expect(state.isAuthenticated).toBe(false);
        });
    });
}); 