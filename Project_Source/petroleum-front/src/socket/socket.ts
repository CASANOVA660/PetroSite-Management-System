import { io } from 'socket.io-client';
import { API_URL } from '../config';

// Configure socket with reconnection settings
const socket = io(API_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

// Track the current user ID for reconnection
let currentUserId: string | null = null;

// Make socket available globally for direct use
if (typeof window !== 'undefined') {
    (window as any).socket = socket;
}

// Socket event listeners for debugging
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    // Re-authenticate on reconnection
    if (currentUserId) {
        socket.emit('authenticate', currentUserId);
        console.log('Re-authenticated user:', currentUserId);
    }
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

// Add listener for notifications
socket.on('notification', (data) => {
    console.log('Received notification via socket:', data);
    // We could trigger a global notification here if needed
});

export const connectSocket = (userId: string) => {
    currentUserId = userId;
    if (!socket.connected) {
        console.log('Connecting socket for user:', userId);
        socket.connect();
        socket.emit('authenticate', userId);
    } else {
        // If already connected, make sure authentication is sent
        socket.emit('authenticate', userId);
        console.log('Socket already connected, re-authenticated user:', userId);
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
        currentUserId = null;
    }
};

// Send direct notification to a specific user
export const sendDirectNotification = (
    userId: string,
    notificationType: string,
    message: string,
    metadata = {}
) => {
    if (!socket.connected) {
        console.warn('Socket not connected, cannot send direct notification');
        return false;
    }

    try {
        socket.emit('direct-notification', {
            userId,
            notification: {
                type: notificationType,
                message,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    senderId: currentUserId
                }
            }
        });
        console.log(`Direct notification sent to user ${userId}`);
        return true;
    } catch (error) {
        console.error('Error sending direct notification:', error);
        return false;
    }
};

export default socket; 