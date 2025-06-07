import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Types definition
export interface OperationEmployee {
    _id: string;
    name: string;
    role: string;
    specialization: string;
    photo?: string;
}

export interface Shift {
    _id: string;
    projectId: string;
    employeeId: string;
    employee?: OperationEmployee;
    date: string;
    type: 'day' | 'night';
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'absent';
    notes?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface MilestoneTask {
    id: string;
    _id?: string;
    name: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    completionPercentage: number;
    startDate: string;
    endDate: string;
    dependsOn?: string[];
}

export interface Milestone {
    id: string;
    _id?: string;
    name: string;
    description: string;
    plannedDate: string;
    actualDate?: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    tasks: MilestoneTask[];
}

export interface OperationProgress {
    _id: string;
    projectId: string;
    date: string;
    milestone: string;
    plannedProgress: number;
    actualProgress: number;
    variance: number;
    status: 'onTrack' | 'behind' | 'ahead' | 'atRisk';
    challenges?: string;
    actions?: string;
    notes?: string;
    attachments?: Array<{
        name: string;
        path: string;
        type: string;
    }>;
    updatedBy: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DailyReport {
    _id: string;
    projectId: string;
    date: string;
    title?: string;
    supervisor?: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    activities: Array<{
        description: string;
        startTime?: string;
        endTime?: string;
        status: 'completed' | 'inProgress' | 'delayed' | 'cancelled';
    }>;
    equipmentUsed?: Array<{
        equipmentId: string;
        hoursUsed: number;
        notes?: string;
    }>;
    healthAndSafety?: {
        incidents: number;
        nearMisses: number;
        safetyMeetingHeld: boolean;
        notes?: string;
    };
    weatherConditions?: string;
    challenges?: string;
    solutions?: string;
    notes?: string;
    attachments?: Array<{
        name: string;
        path: string;
        type: string;
    }>;
    createdBy: string;
    createdAt?: string;
    updatedAt?: string;
    // For frontend display
    issues?: string[];
    weather?: string;
    safety?: string;
    hours?: {
        planned: number;
        actual: number;
    };
}

export interface EmployeeAttendance {
    _id: string;
    projectId: string;
    employeeId: string;
    employeeName?: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkInTime?: string;
    checkOutTime?: string;
    totalHours?: number;
    notes?: string;
    recordedBy: string;
    createdAt?: string;
    updatedAt?: string;
    // For frontend compatibility
    timeIn?: string;
    timeOut?: string;
}

interface OperationState {
    shifts: {
        data: Shift[];
        loading: boolean;
        error: string | null;
    };
    progress: {
        data: OperationProgress[];
        milestones: Milestone[];
        loading: boolean;
        error: string | null;
    };
    dailyReports: {
        data: DailyReport[];
        loading: boolean;
        error: string | null;
    };
    attendance: {
        data: EmployeeAttendance[];
        loading: boolean;
        error: string | null;
    };
    employees: {
        data: OperationEmployee[];
        loading: boolean;
        error: string | null;
    };
}

const initialState: OperationState = {
    shifts: {
        data: [],
        loading: false,
        error: null
    },
    progress: {
        data: [],
        milestones: [],
        loading: false,
        error: null
    },
    dailyReports: {
        data: [],
        loading: false,
        error: null
    },
    attendance: {
        data: [],
        loading: false,
        error: null
    },
    employees: {
        data: [],
        loading: false,
        error: null
    }
};

// Async thunks for Shifts
export const fetchShifts = createAsyncThunk(
    'operation/fetchShifts',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/shifts`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch shifts');
        }
    }
);

export const createShift = createAsyncThunk(
    'operation/createShift',
    async ({ projectId, shiftData }: { projectId: string, shiftData: Partial<Shift> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/shifts`, shiftData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create shift');
        }
    }
);

export const updateShift = createAsyncThunk(
    'operation/updateShift',
    async ({ shiftId, shiftData }: { shiftId: string, shiftData: Partial<Shift> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/projects/shifts/${shiftId}`, shiftData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update shift');
        }
    }
);

export const deleteShift = createAsyncThunk(
    'operation/deleteShift',
    async ({ projectId, shiftId }: { projectId: string, shiftId: string }, { rejectWithValue }) => {
        try {
            await axios.delete(`/projects/${projectId}/shifts/${shiftId}`);
            return shiftId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete shift');
        }
    }
);

// Async thunks for Progress
export const fetchProgress = createAsyncThunk(
    'operation/fetchProgress',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/progress`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress data');
        }
    }
);

export const fetchMilestones = createAsyncThunk(
    'operation/fetchMilestones',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/milestones`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch milestones');
        }
    }
);

export const createMilestone = createAsyncThunk(
    'operation/createMilestone',
    async ({ projectId, milestoneData }: { projectId: string, milestoneData: Partial<Milestone> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/milestones`, milestoneData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create milestone');
        }
    }
);

export const createProgress = createAsyncThunk(
    'operation/createProgress',
    async ({ projectId, progressData }: { projectId: string, progressData: Partial<OperationProgress> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/progress`, progressData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create progress');
        }
    }
);

// Async thunks for Daily Reports
export const fetchDailyReports = createAsyncThunk(
    'operation/fetchDailyReports',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/reports`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch daily reports');
        }
    }
);

export const createDailyReport = createAsyncThunk(
    'operation/createDailyReport',
    async ({ projectId, reportData }: { projectId: string, reportData: Partial<DailyReport> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/reports`, reportData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create daily report');
        }
    }
);

export const updateDailyReport = createAsyncThunk(
    'operation/updateDailyReport',
    async ({ reportId, reportData }: { reportId: string, reportData: Partial<DailyReport> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/projects/reports/${reportId}`, reportData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update daily report');
        }
    }
);

export const submitDailyReport = createAsyncThunk(
    'operation/submitDailyReport',
    async (reportId: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/reports/${reportId}/submit`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit daily report');
        }
    }
);

export const approveDailyReport = createAsyncThunk(
    'operation/approveDailyReport',
    async (reportId: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/reports/${reportId}/approve`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to approve daily report');
        }
    }
);

export const rejectDailyReport = createAsyncThunk(
    'operation/rejectDailyReport',
    async ({ reportId, rejectionReason }: { reportId: string, rejectionReason?: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/reports/${reportId}/reject`, { rejectionReason });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to reject daily report');
        }
    }
);

// Async thunks for Attendance
export const fetchAttendance = createAsyncThunk(
    'operation/fetchAttendance',
    async ({ projectId, date }: { projectId: string, date?: string }, { rejectWithValue }) => {
        try {
            const url = date
                ? `/projects/${projectId}/attendance?date=${date}`
                : `/projects/${projectId}/attendance`;
            const response = await axios.get(url);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance');
        }
    }
);

export const recordAttendance = createAsyncThunk(
    'operation/recordAttendance',
    async ({ projectId, attendanceData }: { projectId: string, attendanceData: Partial<EmployeeAttendance> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/projects/${projectId}/attendance`, attendanceData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to record attendance');
        }
    }
);

export const updateAttendance = createAsyncThunk(
    'operation/updateAttendance',
    async ({ attendanceId, attendanceData }: { attendanceId: string, attendanceData: Partial<EmployeeAttendance> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/projects/attendance/${attendanceId}`, attendanceData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update attendance');
        }
    }
);

// Add a new async thunk for creating a task
export const createMilestoneTask = createAsyncThunk(
    'operation/createMilestoneTask',
    async ({
        projectId,
        milestoneId,
        taskData
    }: {
        projectId: string,
        milestoneId: string,
        taskData: Partial<MilestoneTask>
    }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `/projects/${projectId}/milestones/${milestoneId}/tasks`,
                taskData
            );
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create task');
        }
    }
);

// Add thunks for updating milestone and task
export const updateMilestone = createAsyncThunk(
    'operation/updateMilestone',
    async ({
        projectId,
        milestoneId,
        milestoneData
    }: {
        projectId: string,
        milestoneId: string,
        milestoneData: Partial<Milestone>
    }, { rejectWithValue }) => {
        try {
            const response = await axios.put(
                `/projects/milestones/${milestoneId}`,
                milestoneData
            );
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update milestone');
        }
    }
);

export const updateMilestoneTask = createAsyncThunk(
    'operation/updateMilestoneTask',
    async ({
        projectId,
        milestoneId,
        taskId,
        taskData
    }: {
        projectId: string,
        milestoneId: string,
        taskId: string,
        taskData: Partial<MilestoneTask>
    }, { rejectWithValue }) => {
        try {
            const response = await axios.put(
                `/projects/${projectId}/milestones/${milestoneId}/tasks/${taskId}`,
                taskData
            );
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update task');
        }
    }
);

// Add the fetchProjectEmployees async thunk
export const fetchProjectEmployees = createAsyncThunk(
    'operation/fetchProjectEmployees',
    async (projectId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/projects/${projectId}/employees`);
            const projectEmployees = response.data.data || [];

            // Transform project employees to the format needed
            const formattedEmployees: OperationEmployee[] = projectEmployees.map((pe: any) => ({
                _id: pe.employeeId._id,
                name: pe.employeeId.name,
                role: pe.role,
                specialization: pe.employeeId.position || 'Non spécifié',
                photo: pe.employeeId.profileImage
            }));

            return formattedEmployees;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch project employees');
        }
    }
);

const operationSlice = createSlice({
    name: 'operation',
    initialState,
    reducers: {
        clearOperationData: (state) => {
            state.shifts.data = [];
            state.progress.data = [];
            state.progress.milestones = [];
            state.dailyReports.data = [];
            state.attendance.data = [];
            state.employees.data = [];
        }
    },
    extraReducers: (builder) => {
        // Shifts reducers
        builder
            .addCase(fetchShifts.pending, (state) => {
                state.shifts.loading = true;
                state.shifts.error = null;
            })
            .addCase(fetchShifts.fulfilled, (state, action) => {
                state.shifts.loading = false;
                state.shifts.data = action.payload;
            })
            .addCase(fetchShifts.rejected, (state, action) => {
                state.shifts.loading = false;
                state.shifts.error = action.payload as string;
            })
            .addCase(createShift.fulfilled, (state, action) => {
                state.shifts.data.push(action.payload);
            })
            .addCase(createShift.rejected, (state, action) => {
                // Handle rejection silently
            })
            .addCase(updateShift.fulfilled, (state, action) => {
                const index = state.shifts.data.findIndex(shift => shift._id === action.payload._id);
                if (index !== -1) {
                    state.shifts.data[index] = action.payload;
                }
            })
            .addCase(deleteShift.fulfilled, (state, action) => {
                state.shifts.data = state.shifts.data.filter(shift => shift._id !== action.payload);
            })

            // Progress reducers
            .addCase(fetchProgress.pending, (state) => {
                state.progress.loading = true;
                state.progress.error = null;
            })
            .addCase(fetchProgress.fulfilled, (state, action) => {
                state.progress.loading = false;
                state.progress.data = action.payload;
            })
            .addCase(fetchProgress.rejected, (state, action) => {
                state.progress.loading = false;
                state.progress.error = action.payload as string;
            })
            .addCase(fetchMilestones.fulfilled, (state, action) => {
                state.progress.milestones = action.payload;
            })
            .addCase(createMilestone.pending, (state) => {
                state.progress.loading = true;
                state.progress.error = null;
            })
            .addCase(createMilestone.fulfilled, (state, action) => {
                state.progress.loading = false;
                state.progress.milestones.push(action.payload);
            })
            .addCase(createMilestone.rejected, (state, action) => {
                state.progress.loading = false;
                state.progress.error = action.payload as string;
            })
            .addCase(createProgress.fulfilled, (state, action) => {
                state.progress.data.push(action.payload);
            })

            // Daily Reports reducers
            .addCase(fetchDailyReports.pending, (state) => {
                state.dailyReports.loading = true;
                state.dailyReports.error = null;
            })
            .addCase(fetchDailyReports.fulfilled, (state, action) => {
                state.dailyReports.loading = false;
                state.dailyReports.data = action.payload;
            })
            .addCase(fetchDailyReports.rejected, (state, action) => {
                state.dailyReports.loading = false;
                state.dailyReports.error = action.payload as string;
            })
            .addCase(createDailyReport.fulfilled, (state, action) => {
                state.dailyReports.data.push(action.payload);
            })
            .addCase(updateDailyReport.fulfilled, (state, action) => {
                const index = state.dailyReports.data.findIndex(report => report._id === action.payload._id);
                if (index !== -1) {
                    state.dailyReports.data[index] = action.payload;
                }
            })
            .addCase(submitDailyReport.fulfilled, (state, action) => {
                const index = state.dailyReports.data.findIndex(report => report._id === action.payload._id);
                if (index !== -1) {
                    state.dailyReports.data[index] = action.payload;
                }
            })
            .addCase(approveDailyReport.fulfilled, (state, action) => {
                const index = state.dailyReports.data.findIndex(report => report._id === action.payload._id);
                if (index !== -1) {
                    state.dailyReports.data[index] = action.payload;
                }
            })
            .addCase(rejectDailyReport.fulfilled, (state, action) => {
                const index = state.dailyReports.data.findIndex(report => report._id === action.payload._id);
                if (index !== -1) {
                    state.dailyReports.data[index] = action.payload;
                }
            })

            // Attendance reducers
            .addCase(fetchAttendance.pending, (state) => {
                state.attendance.loading = true;
                state.attendance.error = null;
            })
            .addCase(fetchAttendance.fulfilled, (state, action) => {
                state.attendance.loading = false;
                state.attendance.data = action.payload;
            })
            .addCase(fetchAttendance.rejected, (state, action) => {
                state.attendance.loading = false;
                state.attendance.error = action.payload as string;
            })
            .addCase(recordAttendance.fulfilled, (state, action) => {
                state.attendance.data.push(action.payload);
            })
            .addCase(updateAttendance.fulfilled, (state, action) => {
                const index = state.attendance.data.findIndex(record => record._id === action.payload._id);
                if (index !== -1) {
                    state.attendance.data[index] = action.payload;
                }
            })

            // New task reducers
            .addCase(createMilestoneTask.pending, (state) => {
                state.progress.loading = true;
                state.progress.error = null;
            })
            .addCase(createMilestoneTask.fulfilled, (state, action) => {
                state.progress.loading = false;

                // Find the milestone and add the task to it
                const milestone = state.progress.milestones.find(
                    m => m.id === action.meta.arg.milestoneId ||
                        // Also try matching by MongoDB _id if present
                        (m._id && m._id === action.meta.arg.milestoneId)
                );

                if (milestone) {
                    milestone.tasks.push(action.payload);
                }
            })
            .addCase(createMilestoneTask.rejected, (state, action) => {
                state.progress.loading = false;
                state.progress.error = action.payload as string;
            })

            // Update milestone and task reducers
            .addCase(updateMilestone.fulfilled, (state, action) => {
                const index = state.progress.milestones.findIndex(m => m.id === action.payload.id);
                if (index !== -1) {
                    state.progress.milestones[index] = action.payload;
                }
            })
            .addCase(updateMilestoneTask.fulfilled, (state, action) => {
                const milestoneIndex = state.progress.milestones.findIndex(m =>
                    m.id === action.meta.arg.milestoneId ||
                    (m._id && m._id === action.meta.arg.milestoneId)
                );

                if (milestoneIndex !== -1) {
                    const milestone = state.progress.milestones[milestoneIndex];
                    const taskIndex = milestone.tasks.findIndex(t => t.id === action.meta.arg.taskId);

                    if (taskIndex !== -1) {
                        state.progress.milestones[milestoneIndex].tasks[taskIndex] = {
                            ...state.progress.milestones[milestoneIndex].tasks[taskIndex],
                            ...action.payload
                        };
                    }
                }
            })

            // Employee reducers
            .addCase(fetchProjectEmployees.pending, (state) => {
                state.employees.loading = true;
                state.employees.error = null;
            })
            .addCase(fetchProjectEmployees.fulfilled, (state, action) => {
                state.employees.loading = false;
                state.employees.data = action.payload;
            })
            .addCase(fetchProjectEmployees.rejected, (state, action) => {
                state.employees.loading = false;
                state.employees.error = action.payload as string;
            });
    }
});

export const { clearOperationData } = operationSlice.actions;
export default operationSlice.reducer; 