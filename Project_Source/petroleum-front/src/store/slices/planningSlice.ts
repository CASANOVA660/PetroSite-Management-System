import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export interface Plan {
    _id: string;
    title: string;
    description?: string;
    type: 'placement' | 'maintenance';
    equipment: any; // Should match Equipment type
    responsible: string;
    route: string[];
    startDate: string;
    endDate: string;
    status: 'Upcoming' | 'In Progress' | 'Done';
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PlanningState {
    plans: Plan[];
    currentPlan: Plan | null;
    loading: boolean;
    error: string | null;
}

const initialState: PlanningState = {
    plans: [],
    currentPlan: null,
    loading: false,
    error: null
};

export const fetchPlans = createAsyncThunk(
    'planning/fetchPlans',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/plans');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch plans');
        }
    }
);

export const fetchPlanById = createAsyncThunk(
    'planning/fetchPlanById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/plans/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch plan');
        }
    }
);

export const createPlan = createAsyncThunk(
    'planning/createPlan',
    async (planData: Omit<Plan, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        try {
            const response = await axios.post('/plans', planData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create plan');
        }
    }
);

export const updatePlan = createAsyncThunk(
    'planning/updatePlan',
    async ({ id, data }: { id: string, data: Partial<Plan> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/plans/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update plan');
        }
    }
);

export const deletePlan = createAsyncThunk(
    'planning/deletePlan',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/plans/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete plan');
        }
    }
);

const planningSlice = createSlice({
    name: 'planning',
    initialState,
    reducers: {
        setCurrentPlan(state, action: PayloadAction<Plan | null>) {
            state.currentPlan = action.payload;
        },
        clearPlanningError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
            })
            .addCase(fetchPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchPlanById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlanById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;
            })
            .addCase(fetchPlanById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans.push(action.payload);
            })
            .addCase(createPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = state.plans.map(plan => plan._id === action.payload._id ? action.payload : plan);
            })
            .addCase(updatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deletePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = state.plans.filter(plan => plan._id !== action.payload);
            })
            .addCase(deletePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setCurrentPlan, clearPlanningError } = planningSlice.actions;
export default planningSlice.reducer; 