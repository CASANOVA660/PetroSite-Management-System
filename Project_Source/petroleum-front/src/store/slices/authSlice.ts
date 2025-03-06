import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

interface User {
    id: string;
    email: string;
    role: string;
    nom: string;
}

interface AuthState {
    user: {
        _id: string;
        nom: string;
        email: string;
        role: string;
    } | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    token: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    token: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; motDePasse: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

            // Store token and user in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Login failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 