import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

interface Notification {
    _id: string;
    type: string;
    message: string;
    userId: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    loading: false,
    error: null
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async () => {
        const response = await axios.get('/api/notifications');
        return response.data as Notification[];
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string) => {
        const response = await axios.put(`/api/notifications/${notificationId}/read`);
        return response.data as Notification;
    }
);

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.notifications = action.payload;
                state.loading = false;
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
                state.notifications = state.notifications.map(notification =>
                    notification._id === action.payload._id
                        ? { ...notification, isRead: true }
                        : notification
                );
            });
    }
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer; 