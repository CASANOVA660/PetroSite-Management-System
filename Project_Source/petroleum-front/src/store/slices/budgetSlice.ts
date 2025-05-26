import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

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
}

// Define the state structure
interface BudgetState {
    items: BudgetItem[];
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: BudgetState = {
    items: [],
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

export const addBudgetItem = createAsyncThunk(
    'budget/addBudgetItem',
    async (budgetData: Omit<BudgetItem, '_id' | 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
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