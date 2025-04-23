import { io } from 'socket.io-client';
import { API_URL } from '../config';

// Create the base URL (remove '/api' if it exists)
const SOCKET_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

// Create socket instance with autoConnect disabled
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 60000
});

// Function to connect socket with user authentication
export const connectSocket = (userId: string) => {
    if (!socket.connected) {
        console.log(`Connecting socket to ${SOCKET_URL} for user ${userId}`);
        socket.connect();
        socket.emit('authenticate', userId);
    }
};

// Function to disconnect socket
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

// Add event listeners for connection status
socket.on('connect', () => {
    console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

// Handle reconnection
socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts');
    // Re-authenticate if we have a stored userId
    const userId = localStorage.getItem('userId');
    if (userId) {
        socket.emit('authenticate', userId);
    }
});

export default socket; 