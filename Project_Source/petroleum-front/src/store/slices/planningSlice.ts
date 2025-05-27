import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Match backend activity types
export enum PlanType {
    PLACEMENT = 'placement',
    MAINTENANCE = 'maintenance',
    REPAIR = 'repair',
    CUSTOM = 'custom'
}

// Match backend plan status
export enum PlanStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface Plan {
    _id: string;
    title: string;
    description?: string;
    type: PlanType;
    customTypeName?: string; // For storing custom plan type names
    equipmentId: string; // Reference to equipment
    activityId?: string; // Reference to activity in equipment
    status: PlanStatus;
    startDate: string;
    endDate: string;
    location?: string;
    responsiblePerson?: {
        name: string;
        email?: string;
        phone?: string;
        userId?: string;
    };
    notes?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean;
    projectId?: string;
}

export interface EquipmentData {
    _id: string;
    nom: string;
    reference: string;
    matricule: string;
    status: string;
}

export interface PlanWithEquipment extends Omit<Plan, 'equipmentId'> {
    equipmentId?: EquipmentData;
}

interface PlanningState {
    plans: PlanWithEquipment[];
    availableEquipment: EquipmentData[];
    currentPlan: PlanWithEquipment | null;
    loading: boolean;
    error: string | null;
}

const initialState: PlanningState = {
    plans: [],
    availableEquipment: [],
    currentPlan: null,
    loading: false,
    error: null
};

export const fetchPlans = createAsyncThunk(
    'planning/fetchPlans',
    async (filters: any = {}, { rejectWithValue }) => {
        try {
            console.log('Fetching plans with filters:', filters);
            // If we have a projectId filter, make sure it's included in the request
            const response = await axios.get('/plans', { params: filters });
            console.log('Fetched plans data:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching plans:', error.response?.data || error.message);
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
    async (planData: Partial<Plan>, { rejectWithValue }) => {
        try {
            console.log('Creating plan with data:', planData);

            // Basic validation for required fields
            if (!planData.title || !planData.startDate || !planData.endDate || !planData.type) {
                return rejectWithValue('Missing required fields: title, dates, and type are required');
            }

            // Equipment validation only for standard plan types
            const isCustomType = planData.type === PlanType.CUSTOM;
            if (!isCustomType && !planData.equipmentId) {
                return rejectWithValue('Equipment is required for standard plan types');
            }

            // Make sure custom plans are always associated with a project
            if (isCustomType && !planData.projectId) {
                return rejectWithValue('Custom plans must be associated with a project');
            }

            // Create the plan with all necessary data
            const response = await axios.post('/plans', planData);
            console.log('Plan created successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error creating plan:', error.response?.data || error.message);
            return rejectWithValue(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to create plan'
            );
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

export const getAvailableEquipment = createAsyncThunk(
    'planning/getAvailableEquipment',
    async ({ startDate, endDate, type }: { startDate: string, endDate: string, type: PlanType }, { rejectWithValue }) => {
        try {
            console.log('Sending request to get available equipment:', { startDate, endDate, type });
            const response = await axios.get('/plans/available-equipment', {
                params: { startDate, endDate, type }
            });
            console.log('Available equipment API response:', response.data);

            // Return data from the nested structure
            const equipment = response.data.data || [];
            console.log(`Parsed equipment data: ${equipment.length} items`, equipment);

            if (equipment.length === 0) {
                console.log('No equipment returned from API');
            } else {
                console.log('First equipment item:', equipment[0]);
            }

            return equipment;
        } catch (error: any) {
            console.error('Error fetching available equipment:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to get available equipment');
        }
    }
);

const planningSlice = createSlice({
    name: 'planning',
    initialState,
    reducers: {
        setCurrentPlan(state, action: PayloadAction<PlanWithEquipment | null>) {
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
                // Handle both direct data and nested data structure
                state.plans = action.payload.data || action.payload;
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
                // Handle both direct data and nested data structure
                state.currentPlan = action.payload.data || action.payload;
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
                if (!Array.isArray(state.plans)) {
                    state.plans = [];
                }
                state.plans.push(action.payload.data || action.payload);
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
                const updatedPlan = action.payload.data || action.payload;
                if (!Array.isArray(state.plans)) {
                    state.plans = [];
                }
                state.plans = state.plans.map(plan => plan._id === updatedPlan._id ? updatedPlan : plan);
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
                if (!Array.isArray(state.plans)) {
                    state.plans = [];
                    return;
                }
                state.plans = state.plans.filter(plan => plan._id !== action.payload);
            })
            .addCase(deletePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getAvailableEquipment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAvailableEquipment.fulfilled, (state, action) => {
                state.loading = false;
                state.availableEquipment = action.payload;
            })
            .addCase(getAvailableEquipment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setCurrentPlan, clearPlanningError } = planningSlice.actions;
export default planningSlice.reducer; 