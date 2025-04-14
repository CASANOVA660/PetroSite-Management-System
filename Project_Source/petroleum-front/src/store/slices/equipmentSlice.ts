import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';
import { Equipment, EquipmentHistoryEntry } from '../../types/equipment';
import { mockEquipment, mockEquipmentHistory } from '../../mocks/equipmentData';

// Use mock data for UI development
const USE_MOCK_DATA = true;

interface EquipmentState {
    equipment: Equipment[];
    selectedEquipment: Equipment | null;
    equipmentHistory: {
        placement: EquipmentHistoryEntry[];
        operation: EquipmentHistoryEntry[];
        maintenance: EquipmentHistoryEntry[];
    };
    loading: boolean;
    error: string | null;
}

const initialState: EquipmentState = {
    equipment: USE_MOCK_DATA ? mockEquipment : [],
    selectedEquipment: null,
    equipmentHistory: {
        placement: [],
        operation: [],
        maintenance: []
    },
    loading: false,
    error: null
};

export const fetchEquipment = createAsyncThunk(
    'equipment/fetchEquipment',
    async (_, { rejectWithValue }) => {
        // Return mock data if using mocks
        if (USE_MOCK_DATA) {
            return mockEquipment;
        }

        try {
            const response = await axios.get('/equipment');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment');
        }
    }
);

export const fetchEquipmentById = createAsyncThunk(
    'equipment/fetchEquipmentById',
    async (id: string, { rejectWithValue }) => {
        // Return mock data if using mocks
        if (USE_MOCK_DATA) {
            const equipment = mockEquipment.find(e => e._id === id);
            if (equipment) {
                return equipment;
            }
            return rejectWithValue('Equipment not found');
        }

        try {
            const response = await axios.get(`/equipment/${id}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment details');
        }
    }
);

export const fetchEquipmentHistory = createAsyncThunk(
    'equipment/fetchEquipmentHistory',
    async (id: string, { rejectWithValue }) => {
        // Return mock data if using mocks
        if (USE_MOCK_DATA) {
            const history = mockEquipmentHistory[id] || [];
            return {
                id,
                history
            };
        }

        try {
            const response = await axios.get(`/equipment/${id}/history`);
            return {
                id,
                history: response.data.data
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch equipment history');
        }
    }
);

export const addEquipment = createAsyncThunk(
    'equipment/addEquipment',
    async (equipmentData: Omit<Equipment, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
        // Mock add for UI development
        if (USE_MOCK_DATA) {
            const newEquipment: Equipment = {
                ...equipmentData,
                _id: `eq-${Math.floor(Math.random() * 1000)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return newEquipment;
        }

        try {
            const response = await axios.post('/equipment', equipmentData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add equipment');
        }
    }
);

export const updateEquipment = createAsyncThunk(
    'equipment/updateEquipment',
    async ({ id, data }: { id: string, data: Partial<Equipment> }, { rejectWithValue }) => {
        // Mock update for UI development
        if (USE_MOCK_DATA) {
            const equipmentIndex = mockEquipment.findIndex(e => e._id === id);
            if (equipmentIndex !== -1) {
                const updatedEquipment = {
                    ...mockEquipment[equipmentIndex],
                    ...data,
                    updatedAt: new Date().toISOString()
                };
                return updatedEquipment;
            }
            return rejectWithValue('Equipment not found');
        }

        try {
            const response = await axios.put(`/equipment/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update equipment');
        }
    }
);

export const addHistoryEntry = createAsyncThunk(
    'equipment/addHistoryEntry',
    async (historyData: Omit<EquipmentHistoryEntry, '_id' | 'createdAt'>, { rejectWithValue }) => {
        // Mock history addition for UI development
        if (USE_MOCK_DATA) {
            const newEntry: EquipmentHistoryEntry = {
                ...historyData,
                _id: `hist-${Math.floor(Math.random() * 1000)}`,
                createdAt: new Date().toISOString()
            };
            return newEntry;
        }

        try {
            const response = await axios.post(`/equipment/${historyData.equipmentId}/history`, historyData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add history entry');
        }
    }
);

const equipmentSlice = createSlice({
    name: 'equipment',
    initialState,
    reducers: {
        clearSelectedEquipment: (state) => {
            state.selectedEquipment = null;
            state.equipmentHistory = {
                placement: [],
                operation: [],
                maintenance: []
            };
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Equipment
            .addCase(fetchEquipment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEquipment.fulfilled, (state, action) => {
                state.loading = false;
                state.equipment = action.payload;
            })
            .addCase(fetchEquipment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Equipment by ID
            .addCase(fetchEquipmentById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEquipmentById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedEquipment = action.payload;
            })
            .addCase(fetchEquipmentById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Equipment History
            .addCase(fetchEquipmentHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEquipmentHistory.fulfilled, (state, action) => {
                state.loading = false;

                // Group history entries by type
                const history = action.payload.history as EquipmentHistoryEntry[];

                state.equipmentHistory = {
                    placement: history.filter(entry => entry.type === 'placement'),
                    operation: history.filter(entry => entry.type === 'operation'),
                    maintenance: history.filter(entry => entry.type === 'maintenance')
                };
            })
            .addCase(fetchEquipmentHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Add Equipment
            .addCase(addEquipment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addEquipment.fulfilled, (state, action) => {
                state.loading = false;
                state.equipment.push(action.payload);
            })
            .addCase(addEquipment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update Equipment
            .addCase(updateEquipment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateEquipment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.equipment.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.equipment[index] = action.payload;
                }
                if (state.selectedEquipment?._id === action.payload._id) {
                    state.selectedEquipment = action.payload;
                }
            })
            .addCase(updateEquipment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Add History Entry
            .addCase(addHistoryEntry.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addHistoryEntry.fulfilled, (state, action) => {
                state.loading = false;
                // Add to the appropriate history array based on type
                const entry = action.payload as EquipmentHistoryEntry;
                switch (entry.type) {
                    case 'placement':
                        state.equipmentHistory.placement.push(entry);
                        break;
                    case 'operation':
                        state.equipmentHistory.operation.push(entry);
                        break;
                    case 'maintenance':
                        state.equipmentHistory.maintenance.push(entry);
                        break;
                }
            })
            .addCase(addHistoryEntry.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearSelectedEquipment } = equipmentSlice.actions;
export default equipmentSlice.reducer; 