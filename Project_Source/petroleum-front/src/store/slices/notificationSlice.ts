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
            // Only add if it's not already present
            if (!state.notifications.some(n => n._id === action.payload._id)) {
                state.notifications.unshift(action.payload);
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
                state.notifications = action.payload;
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