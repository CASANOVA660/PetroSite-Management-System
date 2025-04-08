import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Define the action interface
export interface GlobalAction {
    _id: string;
    title: string;
    content: string;
    manager: {
        _id: string;
        nom: string;
        prenom: string;
    };
    responsibleForRealization: {
        _id: string;
        nom: string;
        prenom: string;
    };
    responsibleForFollowUp: {
        _id: string;
        nom: string;
        prenom: string;
    };
    category: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    projectId?: {
        _id: string;
        name: string;
    };
    projectCategory?: string;
    source?: string;
    createdAt: string;
    updatedAt: string;
}

// Define the state interface
interface GlobalActionState {
    actions: GlobalAction[];
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: GlobalActionState = {
    actions: [],
    loading: false,
    error: null
};

// Async thunks
export const fetchGlobalActions = createAsyncThunk(
    'globalActions/fetchGlobalActions',
    async (params: any = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get('/global-actions/search', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des actions');
        }
    }
);

export const createGlobalAction = createAsyncThunk(
    'globalActions/createGlobalAction',
    async (actionData: any, { rejectWithValue }) => {
        try {
            console.log('Sending data to backend:', actionData);
            const response = await axios.post('/global-actions', actionData);
            console.log('Backend response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error creating action:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création de l\'action');
        }
    }
);

export const updateGlobalActionStatus = createAsyncThunk(
    'globalActions/updateGlobalActionStatus',
    async ({ actionId, status }: { actionId: string; status: string }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/global-actions/${actionId}/status`, { status });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
        }
    }
);

export const deleteGlobalAction = createAsyncThunk(
    'globalActions/deleteGlobalAction',
    async (actionId: string, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`/global-actions/${actionId}`);
            return { actionId, ...response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression de l\'action');
        }
    }
);

// Create the slice
const globalActionSlice = createSlice({
    name: 'globalActions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch actions
            .addCase(fetchGlobalActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGlobalActions.fulfilled, (state, action) => {
                state.loading = false;
                console.log('Fetched actions response:', action.payload);
                // The backend returns data in a nested structure
                state.actions = action.payload.data || [];
            })
            .addCase(fetchGlobalActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create action
            .addCase(createGlobalAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGlobalAction.fulfilled, (state, action) => {
                state.loading = false;
                // Ensure actions is an array before using unshift
                if (!Array.isArray(state.actions)) {
                    state.actions = [];
                }
                state.actions.unshift(action.payload.data);
            })
            .addCase(createGlobalAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue lors de la création de l\'action';
            })

            // Update action status
            .addCase(updateGlobalActionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGlobalActionStatus.fulfilled, (state, action: PayloadAction<GlobalAction>) => {
                state.loading = false;
                const index = state.actions.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.actions[index] = action.payload;
                }
            })
            .addCase(updateGlobalActionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete action
            .addCase(deleteGlobalAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteGlobalAction.fulfilled, (state, action: PayloadAction<{ actionId: string }>) => {
                state.loading = false;
                state.actions = state.actions.filter(item => item._id !== action.payload.actionId);
            })
            .addCase(deleteGlobalAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export default globalActionSlice.reducer; 