import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export interface Action {
    _id: string;
    title: string;
    content: string;
    source: string;
    manager: {
        _id: string;
        nom: string;
        prenom: string;
    };
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
    needsValidation?: boolean;
}

interface ActionState {
    actions: Action[];
    loading: boolean;
    error: string | null;
    currentProjectId: string | null;
}

export interface CreateActionPayload {
    title: string;
    content: string;
    source: string;
    manager: string;
    responsible: string;
    startDate: string;
    endDate: string;
    category: string;
    projectId?: string;
    needsValidation?: boolean;
}

const initialState: ActionState = {
    actions: [],
    loading: false,
    error: null,
    currentProjectId: null
};

export const fetchAllActions = createAsyncThunk(
    'actions/fetchAllActions',
    async () => {
        const response = await axios.get('/actions');
        return response.data.data;
    }
);

export const fetchProjectActions = createAsyncThunk(
    'actions/fetchProjectActions',
    async (projectId: string) => {
        const response = await axios.get(`/actions/project/${projectId}`);
        return {
            projectId,
            actions: response.data.data
        };
    }
);

export const fetchCategoryActions = createAsyncThunk(
    'actions/fetchCategoryActions',
    async ({ projectId, category }: { projectId: string; category: string }) => {
        const response = await axios.get(`/actions/project/${projectId}/category/${category}`);
        return {
            projectId,
            category,
            actions: response.data.data
        };
    }
);

export const createAction = createAsyncThunk(
    'actions/createAction',
    async (actionData: CreateActionPayload) => {
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
            state.actions.unshift(action.payload);
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
        clearProjectActions: (state, action) => {
            if (!action.payload || action.payload === state.currentProjectId) {
                state.actions = [];
                state.currentProjectId = action.payload || null;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch All Actions
            .addCase(fetchAllActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllActions.fulfilled, (state, action) => {
                state.loading = false;
                state.actions = action.payload;
                state.error = null;
            })
            .addCase(fetchAllActions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
            })
            // Fetch Project Actions
            .addCase(fetchProjectActions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectActions.fulfilled, (state, action) => {
                state.loading = false;

                if (state.currentProjectId !== action.payload.projectId) {
                    state.actions = [];
                    state.currentProjectId = action.payload.projectId;
                }

                state.actions = action.payload.actions;
                state.error = null;
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

                if (state.currentProjectId !== action.payload.projectId) {
                    state.actions = [];
                    state.currentProjectId = action.payload.projectId;
                }

                const otherCategoryActions = state.actions.filter(
                    (existing: Action) => existing.category !== action.payload.category
                );

                state.actions = [...otherCategoryActions, ...action.payload.actions];
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
                state.actions.unshift(action.payload);
                state.error = null;
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

export const { addAction, updateAction, removeAction, clearProjectActions } = actionSlice.actions;
export default actionSlice.reducer;