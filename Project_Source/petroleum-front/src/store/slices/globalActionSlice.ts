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
    needsValidation?: boolean;
}

// Search params interface
export interface SearchParams {
    title?: string;
    responsible?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
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

export const searchGlobalActions = createAsyncThunk(
    'globalActions/searchGlobalActions',
    async (searchParams: SearchParams, { rejectWithValue }) => {
        try {
            console.log('Searching with params:', searchParams);
            const response = await axios.get('/global-actions/search', { params: searchParams });

            // Handle different response formats
            if (response.data && response.data.actions) {
                return response.data.actions;
            } else if (Array.isArray(response.data)) {
                return response.data;
            } else {
                console.warn('Unexpected response format:', response.data);
                return [];
            }
        } catch (error: any) {
            console.error('Search API error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la recherche des actions');
        }
    }
);

export const createGlobalAction = createAsyncThunk(
    'globalActions/createGlobalAction',
    async (actionData: any, { rejectWithValue }) => {
        try {
            console.log('Sending data to backend:', actionData);
            const response = await axios.post('/global-actions', actionData);
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

export const updateGlobalAction = createAsyncThunk(
    'globalActions/updateGlobalAction',
    async ({ actionId, actionData }: { actionId: string; actionData: any }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/global-actions/${actionId}`, actionData);
            return response.data;
        } catch (error: any) {
            console.error('Error updating action:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'action');
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
                // The backend returns data in a nested structure with actions array
                state.actions = action.payload.actions || [];
            })
            .addCase(fetchGlobalActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Search actions
            .addCase(searchGlobalActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchGlobalActions.fulfilled, (state, action) => {
                state.loading = false;
                // No need to update state.actions here as we handle it in the component
            })
            .addCase(searchGlobalActions.rejected, (state, action) => {
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

            // Update action
            .addCase(updateGlobalAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateGlobalAction.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.actions.findIndex(item => item._id === action.payload.data._id);
                if (index !== -1) {
                    state.actions[index] = action.payload.data;
                }
            })
            .addCase(updateGlobalAction.rejected, (state, action) => {
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