import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

// Types
export interface AttendanceRecord {
    _id: string;
    projectId: string;
    employeeId: {
        _id: string;
        name: string;
        role: string;
        photo?: string;
    } | string;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
    notes: string;
    createdAt?: string;
    updatedAt?: string;
}

interface AttendanceState {
    records: AttendanceRecord[];
    loading: boolean;
    error: string | null;
}

const initialState: AttendanceState = {
    records: [],
    loading: false,
    error: null
};

// Async thunks
export const fetchAttendance = createAsyncThunk(
    'attendance/fetchAttendance',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/attendance`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
        }
    }
);

export const createAttendance = createAsyncThunk(
    'attendance/createAttendance',
    async ({ projectId, attendanceData }: { projectId: string, attendanceData: Partial<AttendanceRecord> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/attendance`, attendanceData);
            toast.success('Attendance record created successfully');
            return response.data.data;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create attendance record');
            return rejectWithValue(error.response?.data?.message || 'Failed to create attendance record');
        }
    }
);

export const updateAttendance = createAsyncThunk(
    'attendance/updateAttendance',
    async ({ attendanceId, attendanceData }: { attendanceId: string, attendanceData: Partial<AttendanceRecord> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/projects/attendance/${attendanceId}`, attendanceData);
            toast.success('Attendance record updated successfully');
            return response.data.data;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update attendance record');
            return rejectWithValue(error.response?.data?.message || 'Failed to update attendance record');
        }
    }
);

export const deleteAttendance = createAsyncThunk(
    'attendance/deleteAttendance',
    async ({ projectId, attendanceId }: { projectId: string, attendanceId: string }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`/projects/${projectId}/attendance/${attendanceId}`);
            toast.success('Attendance record deleted successfully');
            return attendanceId;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete attendance record');
            return rejectWithValue(error.response?.data?.message || 'Failed to delete attendance record');
        }
    }
);

// Slice
const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        clearAttendanceError: (state) => {
            state.error = null;
        },
        resetAttendanceState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // Fetch attendance
            .addCase(fetchAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
                state.loading = false;
                state.records = action.payload;
            })
            .addCase(fetchAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create attendance
            .addCase(createAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord>) => {
                state.loading = false;
                state.records.push(action.payload);
            })
            .addCase(createAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update attendance
            .addCase(updateAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord>) => {
                state.loading = false;
                const index = state.records.findIndex(record => record._id === action.payload._id);
                if (index !== -1) {
                    state.records[index] = action.payload;
                }
            })
            .addCase(updateAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete attendance
            .addCase(deleteAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAttendance.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.records = state.records.filter(record => record._id !== action.payload);
            })
            .addCase(deleteAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearAttendanceError, resetAttendanceState } = attendanceSlice.actions;
export default attendanceSlice.reducer; 