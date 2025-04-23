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

// Helper functions for localStorage persistence
const loadNotificationsFromStorage = (): Notification[] => {
    try {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
            const parsedNotifications = JSON.parse(storedNotifications);
            console.log(`Loaded ${parsedNotifications.length} notifications from localStorage`);

            // Make sure each notification has the required fields
            const validNotifications = parsedNotifications.filter((n: any) =>
                n && n._id && n.type && n.message && n.userId
            );

            if (validNotifications.length !== parsedNotifications.length) {
                console.warn(`Filtered out ${parsedNotifications.length - validNotifications.length} invalid notifications`);
            }

            return validNotifications;
        } else {
            console.log('No notifications found in localStorage');
        }
    } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
    }
    return [];
};

const saveNotificationsToStorage = (notifications: Notification[]) => {
    try {
        if (!notifications || !Array.isArray(notifications)) {
            console.error('Invalid notifications array:', notifications);
            return;
        }

        localStorage.setItem('notifications', JSON.stringify(notifications));
        console.log(`Saved ${notifications.length} notifications to localStorage`);
    } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
    }
};

const initialState: NotificationState = {
    notifications: loadNotificationsFromStorage(),
    loading: false,
    error: null
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/notifications');
            // Save to localStorage as soon as we get new data
            saveNotificationsToStorage(response.data);
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
    async (notificationId: string, { rejectWithValue, getState }) => {
        try {
            if (!notificationId) {
                throw new Error('Notification ID is required');
            }
            const response = await axios.put(`/notifications/${notificationId}/read`);

            // Update localStorage after marking notification as read
            const state = getState() as { notification: NotificationState };
            const updatedNotifications = state.notification.notifications.map(n =>
                n._id === notificationId ? { ...n, isRead: true } : n
            );
            saveNotificationsToStorage(updatedNotifications);

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

                // Update localStorage
                saveNotificationsToStorage(state.notifications);
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.error = null;

            // Clear localStorage
            localStorage.removeItem('notifications');
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

                // Update localStorage
                saveNotificationsToStorage(state.notifications);
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(markAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
                const notification = state.notifications.find(n => n._id === action.payload._id);
                if (notification) {
                    notification.isRead = true;

                    // Update localStorage
                    saveNotificationsToStorage(state.notifications);
                }
            });
    }
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer; 