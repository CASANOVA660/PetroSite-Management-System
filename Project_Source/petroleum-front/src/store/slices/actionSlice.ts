import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export interface Action {
    _id: string;
    content: string;
    responsible: {
        _id: string;
        nom: string;
        prenom: string;
    };
    startDate: string;
    endDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    category: string;
    projectId: string;
    createdAt: string;
}

interface ActionState {
    actions: Action[];
    loading: boolean;
    error: string | null;
}

const initialState: ActionState = {
    actions: [],
    loading: false,
    error: null
};

export const fetchProjectActions = createAsyncThunk(
    'actions/fetchProjectActions',
    async (projectId: string) => {
        const response = await axios.get(`/actions/project/${projectId}`);
        return response.data.data;
    }
);

export const fetchCategoryActions = createAsyncThunk(
    'actions/fetchCategoryActions',
    async ({ projectId, category }: { projectId: string; category: string }) => {
        const response = await axios.get(`/actions/project/${projectId}/category/${category}`);
        return response.data.data;
    }
);

export const createAction = createAsyncThunk(
    'actions/createAction',
    async (actionData: Omit<Action, '_id' | 'createdAt'>) => {
        const response = await axios.post('/actions', actionData);
        return response.data.data;
    }
);

export const updateActionStatus = createAsyncThunk(
    'actions/updateActionStatus',
    async ({ actionId, status }: { actionId: string; status: Action['status'] }) => {
        const response = await axios.patch(`/actions/${actionId}/status`, { status });
        return response.data.data;
    }
);

export const deleteAction = createAsyncThunk(
    'actions/deleteAction',
    async (actionId: string) => {
        await axios.delete(`/actions/${actionId}`);
        return actionId;
    }
);

const actionSlice = createSlice({
    name: 'actions',
    initialState,
    reducers: {
        addAction: (state, action) => {
            state.actions.push(action.payload);
        },
        updateAction: (state, action) => {
            const index = state.actions.findIndex(a => a._id === action.payload._id);
            if (index !== -1) {
                state.actions[index] = action.payload;
            }
        },
        removeAction: (state, action) => {
            state.actions = state.actions.filter(a => a._id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Project Actions
            .addCase(fetchProjectActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectActions.fulfilled, (state, action) => {
                state.loading = false;
                state.actions = action.payload;
            })
            .addCase(fetchProjectActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            })
            // Fetch Category Actions
            .addCase(fetchCategoryActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategoryActions.fulfilled, (state, action) => {
                state.loading = false;
                // Merge new actions with existing ones, avoiding duplicates
                const newActions = action.payload;
                const existingActions = state.actions.filter(
                    (existing: Action) => !newActions.some((newAction: Action) => newAction._id === existing._id)
                );
                state.actions = [...existingActions, ...newActions];
                state.error = null;
            })
            .addCase(fetchCategoryActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            })
            // Create Action
            .addCase(createAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAction.fulfilled, (state, action) => {
                state.loading = false;
                // Add new action to the beginning of the array
                state.actions.unshift(action.payload);
            })
            .addCase(createAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            })
            // Update Action Status
            .addCase(updateActionStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateActionStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.actions.findIndex(a => a._id === action.payload._id);
                if (index !== -1) {
                    state.actions[index] = action.payload;
                }
            })
            .addCase(updateActionStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            })
            // Delete Action
            .addCase(deleteAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAction.fulfilled, (state, action) => {
                state.loading = false;
                state.actions = state.actions.filter(a => a._id !== action.payload);
            })
            .addCase(deleteAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            });
    }
});

export const { addAction, updateAction, removeAction } = actionSlice.actions;
export default actionSlice.reducer;