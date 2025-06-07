import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import projectReducer from './slices/projectSlice';
import documentReducer from './slices/documentSlice';
import actionReducer from './slices/actionSlice';
import globalActionReducer from './slices/globalActionSlice';
import equipmentReducer from './slices/equipmentSlice';
import taskReducer from './slices/taskSlice';
import chatReducer from './slices/chatSlice';
import employeesReducer from './slices/employeesSlice';
import meetingReducer from './slices/meetingSlice';
import kpisReducer from './slices/kpisSlice';
import planningReducer from './slices/planningSlice';
import budgetReducer from './slices/budgetSlice';
import ragChatReducer from './slices/ragChatSlice';
import operationReducer from './slices/operationSlice';
import attendanceReducer from './slices/attendanceSlice';

// Import types separately to re-export with type syntax
import type {
    OperationEmployee,
    Shift,
    OperationProgress,
    Milestone,
    DailyReport,
    EmployeeAttendance
} from './slices/operationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        notification: notificationReducer,
        projects: projectReducer,
        documents: documentReducer,
        actions: actionReducer,
        globalActions: globalActionReducer,
        equipment: equipmentReducer,
        tasks: taskReducer,
        chat: chatReducer,
        employees: employeesReducer,
        meetings: meetingReducer,
        kpis: kpisReducer,
        planning: planningReducer,
        budget: budgetReducer,
        ragChat: ragChatReducer,
        operation: operationReducer,
        attendance: attendanceReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;

export * from './slices/employeesSlice';
export * from './slices/meetingSlice';

// Re-export the types with type syntax
export type { OperationEmployee, Shift, OperationProgress, Milestone, DailyReport, EmployeeAttendance };

// Export operation slice thunks selectively to avoid name conflicts
export {
    // Operations/Shifts
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    // Progress
    fetchProgress,
    fetchMilestones,
    createProgress,
    // Daily Reports
    fetchDailyReports,
    createDailyReport,
    updateDailyReport,
    // Attendance
    fetchAttendance as fetchOperationAttendance,
    recordAttendance,
    updateAttendance as updateOperationAttendance,
    // Action creators
    clearOperationData
} from './slices/operationSlice';

// Export attendance slice thunks
export {
    fetchAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    clearAttendanceError,
    resetAttendanceState
} from './slices/attendanceSlice';

export type { AttendanceRecord } from './slices/attendanceSlice';