import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import projectReducer from './slices/projectSlice';
import documentReducer from './slices/documentSlice';
import actionReducer from './slices/actionSlice';
import taskReducer from './slices/taskSlice';
import globalActionReducer from './slices/globalActionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        notification: notificationReducer,
        projects: projectReducer,
        documents: documentReducer,
        actions: actionReducer,
        tasks: taskReducer,
        globalActions: globalActionReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
