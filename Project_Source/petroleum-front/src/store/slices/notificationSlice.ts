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
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/notifications');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                'Failed to fetch notifications'
            );
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            if (!notificationId) {
                throw new Error('Notification ID is required');
            }
            const response = await axios.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            return rejectWithValue(error.response?.data?.error || 'Failed to mark notification as read');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            // Check if notification already exists
            const existingIndex = state.notifications.findIndex(n => n._id === action.payload._id);

            if (existingIndex === -1) {
                // Format the date before adding
                const formattedNotification = {
                    ...action.payload,
                    createdAt: new Date(action.payload.createdAt).toISOString()
                };
                state.notifications.unshift(formattedNotification);
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
                state.loading = false;
                // Format dates for all notifications
                state.notifications = action.payload.map(notification => ({
                    ...notification,
                    createdAt: new Date(notification.createdAt).toISOString()
                }));
                state.error = null;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
                const notification = state.notifications.find(n => n._id === action.payload._id);
                if (notification) {
                    notification.isRead = true;
                }
            });
    }
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer; 