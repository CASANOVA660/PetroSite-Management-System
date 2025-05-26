import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Define the Budget item type
export interface BudgetItem {
    _id?: string;
    id?: string;
    projectId: string;
    type: string;
    description: string;
    amount: number;
    currency: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    isDeleted?: boolean;
}

// Define budget totals interface
export interface BudgetTotal {
    currency: string;
    total: number;
}

// Define budget stats interface
export interface BudgetStats {
    totalCount: number;
    byType: Record<string, number>;
    totalByCurrency: Record<string, number>;
}

// Define the state structure
interface BudgetState {
    items: BudgetItem[];
    totals: BudgetTotal[];
    stats: BudgetStats | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: BudgetState = {
    items: [],
    totals: [],
    stats: null,
    loading: false,
    error: null
};

// Async thunks for API operations
export const fetchProjectBudgets = createAsyncThunk(
    'budget/fetchProjectBudgets',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/budgets/project/${projectId}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch budgets');
        }
    }
);

export const fetchProjectBudgetTotals = createAsyncThunk(
    'budget/fetchProjectBudgetTotals',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/budgets/project/${projectId}/totals`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch budget totals');
        }
    }
);

export const fetchProjectBudgetStats = createAsyncThunk(
    'budget/fetchProjectBudgetStats',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/budgets/project/${projectId}/stats`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch budget statistics');
        }
    }
);

export const addBudgetItem = createAsyncThunk(
    'budget/addBudgetItem',
    async (budgetData: Omit<BudgetItem, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isDeleted'>, { rejectWithValue }) => {
        try {
            const response = await axios.post('/budgets', budgetData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add budget item');
        }
    }
);

export const updateBudgetItem = createAsyncThunk(
    'budget/updateBudgetItem',
    async ({ id, data }: { id: string, data: Partial<BudgetItem> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/budgets/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update budget item');
        }
    }
);

export const deleteBudgetItem = createAsyncThunk(
    'budget/deleteBudgetItem',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/budgets/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete budget item');
        }
    }
);

// Create the slice
const budgetSlice = createSlice({
    name: 'budget',
    initialState,
    reducers: {
        clearBudgetItems: (state) => {
            state.items = [];
            state.totals = [];
            state.stats = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch project budgets
            .addCase(fetchProjectBudgets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectBudgets.fulfilled, (state, action: PayloadAction<BudgetItem[]>) => {
                state.loading = false;
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchProjectBudgets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch project budget totals
            .addCase(fetchProjectBudgetTotals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectBudgetTotals.fulfilled, (state, action: PayloadAction<BudgetTotal[]>) => {
                state.loading = false;
                state.totals = action.payload;
                state.error = null;
            })
            .addCase(fetchProjectBudgetTotals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch project budget stats
            .addCase(fetchProjectBudgetStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectBudgetStats.fulfilled, (state, action: PayloadAction<BudgetStats>) => {
                state.loading = false;
                state.stats = action.payload;
                state.error = null;
            })
            .addCase(fetchProjectBudgetStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Add budget item
            .addCase(addBudgetItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addBudgetItem.fulfilled, (state, action: PayloadAction<BudgetItem>) => {
                state.loading = false;
                state.items.unshift(action.payload);
                state.error = null;
            })
            .addCase(addBudgetItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update budget item
            .addCase(updateBudgetItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBudgetItem.fulfilled, (state, action: PayloadAction<BudgetItem>) => {
                state.loading = false;
                const index = state.items.findIndex(item =>
                    item._id === action.payload._id || item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                state.error = null;
            })
            .addCase(updateBudgetItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete budget item
            .addCase(deleteBudgetItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBudgetItem.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.items = state.items.filter(item =>
                    item._id !== action.payload && item.id !== action.payload);
                state.error = null;
            })
            .addCase(deleteBudgetItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    }
});

export const { clearBudgetItems } = budgetSlice.actions;
export default budgetSlice.reducer;