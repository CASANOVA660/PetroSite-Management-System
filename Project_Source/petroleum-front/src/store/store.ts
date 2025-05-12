import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import authReducer from './slices/authSlice';
import employeesReducer from './slices/employeesSlice';
import meetingReducer from './slices/meetingSlice';

export const store = configureStore({
    reducer: {
        users: userReducer,
        auth: authReducer,
        employees: employeesReducer,
        meetings: meetingReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 