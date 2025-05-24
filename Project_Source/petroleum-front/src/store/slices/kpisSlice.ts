import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export const fetchKpis = createAsyncThunk('kpis/fetchKpis', async (_, thunkAPI) => {
    try {
        const res = await axios.get('/kpis');
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const fetchKpi = createAsyncThunk('kpis/fetchKpi', async (id: string, thunkAPI) => {
    try {
        const res = await axios.get(`/kpis/${id}`);
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const createKpi = createAsyncThunk('kpis/createKpi', async (kpi: any, thunkAPI) => {
    try {
        const res = await axios.post('/kpis', kpi);
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const updateKpi = createAsyncThunk('kpis/updateKpi', async ({ id, kpi }: { id: string, kpi: any }, thunkAPI) => {
    try {
        const res = await axios.put(`/kpis/${id}`, kpi);
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const deleteKpi = createAsyncThunk('kpis/deleteKpi', async (id: string, thunkAPI) => {
    try {
        await axios.delete(`/kpis/${id}`);
        return id;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

export const fetchKpiFields = createAsyncThunk('kpis/fetchKpiFields', async (_, thunkAPI) => {
    try {
        const res = await axios.get('/kpis/fields');
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
});

const kpisSlice = createSlice({
    name: 'kpis',
    initialState: {
        kpis: [] as any[],
        fields: [] as any[],
        loading: false,
        error: null as string | null,
        selectedKpi: null as any,
    },
    reducers: {
        setSelectedKpi(state, action) {
            state.selectedKpi = action.payload;
        },
        clearError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchKpis.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchKpis.fulfilled, (state, action) => { state.loading = false; state.kpis = action.payload; })
            .addCase(fetchKpis.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(fetchKpi.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchKpi.fulfilled, (state, action) => { state.loading = false; state.selectedKpi = action.payload; })
            .addCase(fetchKpi.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(createKpi.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(createKpi.fulfilled, (state, action) => { state.loading = false; state.kpis.push(action.payload); })
            .addCase(createKpi.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(updateKpi.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(updateKpi.fulfilled, (state, action) => {
                state.loading = false;
                state.kpis = state.kpis.map(kpi => kpi._id === action.payload._id ? action.payload : kpi);
                if (state.selectedKpi && state.selectedKpi._id === action.payload._id) {
                    state.selectedKpi = action.payload;
                }
            })
            .addCase(updateKpi.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(deleteKpi.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(deleteKpi.fulfilled, (state, action) => {
                state.loading = false;
                state.kpis = state.kpis.filter(kpi => kpi._id !== action.payload);
                if (state.selectedKpi && state.selectedKpi._id === action.payload) {
                    state.selectedKpi = null;
                }
            })
            .addCase(deleteKpi.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(fetchKpiFields.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchKpiFields.fulfilled, (state, action) => { state.loading = false; state.fields = action.payload; })
            .addCase(fetchKpiFields.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
    }
});

export const { setSelectedKpi, clearError } = kpisSlice.actions;
export default kpisSlice.reducer; 