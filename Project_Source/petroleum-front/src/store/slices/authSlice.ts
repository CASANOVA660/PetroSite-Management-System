import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

interface User {
    _id: string;
    id?: string;
    email: string;
    role: string;
    nom: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    token: string | null;
}

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const normalizeUser = (user: any) => {
    if (!user) return null;
    return {
        ...user,
        _id: user._id || user.id,
    };
};

const initialState: AuthState = {
    user: storedUser ? normalizeUser(JSON.parse(storedUser)) : null,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
    token: storedToken,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; motDePasse: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', credentials);

            const normalizedUser = normalizeUser(response.data.user);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(normalizedUser));

            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            return {
                ...response.data,
                user: normalizedUser,
            };
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