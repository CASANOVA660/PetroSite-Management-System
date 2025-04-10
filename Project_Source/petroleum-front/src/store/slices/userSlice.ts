import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

interface User {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    employeeId: string;
    telephone?: string;
    country?: string;
    city?: string;
    state?: string;
    estActif: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

interface UserState {
    users: User[];
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    success: string | null;
}

const initialState: UserState = {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
    success: null
};

// Create user
export const createUser = createAsyncThunk(
    'users/create',
    async (userData: Partial<User>, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/users', userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create user');
        }
    }
);

// List users
export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch users');
        }
    }
);

// Delete user
export const deleteUser = createAsyncThunk(
    'users/delete',
    async (userId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return userId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete user');
        }
    }
);

// Update user
export const updateUser = createAsyncThunk(
    'users/update',
    async ({ userId, userData }: { userId: string; userData: Partial<User> }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`http://localhost:5000/api/users/${userId}`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update user');
        }
    }
);

// Add activation thunk
export const activateAccount = createAsyncThunk(
    'user/activateAccount',
    async ({ token, newPassword }: { token: string; newPassword: string }) => {
        const response = await axios.post('http://localhost:5000/api/users/activate', { token, newPassword });
        return response.data;
    }
);

// Add this new thunk to userSlice.ts
export const getUserById = createAsyncThunk(
    'users/getById',
    async (id: string, { rejectWithValue }) => {
        try {
            // Ensure the ID is properly formatted
            const formattedId = id.trim();

            console.log('Making request for user:', formattedId);

            const response = await axios.get(`http://localhost:5000/api/users/${formattedId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Error in getUserById:', error.response?.data);
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to fetch user data'
            );
        }
    }
);

// Add this to your existing userSlice.ts
export const updateProfile = createAsyncThunk(
    'users/updateProfile',
    async ({ userId, userData }: { userId: string; userData: Partial<User> }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Updating profile with data:', { userId, userData });

            const response = await axios.put(`http://localhost:5000/api/users/${userId}/profile`, userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Update response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Profile update error:', error.response?.data);
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to update profile'
            );
        }
    }
);

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        clearMessages: (state) => {
            state.error = null;
            state.success = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create user cases
            .addCase(createUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = 'Utilisateur créé avec succès';
                state.error = null;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch users cases
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
                state.error = null;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Delete user cases
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(user => user._id !== action.payload);
                state.success = 'Utilisateur supprimé avec succès';
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Update user cases
            .addCase(updateUser.fulfilled, (state) => {
                state.success = 'Utilisateur mis à jour avec succès';
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Activate account cases
            .addCase(activateAccount.fulfilled, (state, action) => {
                // Handle successful activation if needed
            })
            .addCase(activateAccount.rejected, (state, action) => {
                // Handle activation error if needed
            })
            // Get user by ID cases
            .addCase(getUserById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
                state.error = null;
            })
            .addCase(getUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update profile cases
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.success = 'Profile updated successfully';
                if (action.payload.user) {
                    state.currentUser = action.payload.user;
                }
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearMessages } = userSlice.actions;
export default userSlice.reducer; 