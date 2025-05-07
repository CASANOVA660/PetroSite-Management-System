import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import authReducer from './slices/authSlice';
import employeesReducer from './slices/employeesSlice';

export const store = configureStore({
    reducer: {
        users: userReducer,
        auth: authReducer,
        employees: employeesReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 