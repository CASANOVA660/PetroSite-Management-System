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
        meetings: meetingReducer
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