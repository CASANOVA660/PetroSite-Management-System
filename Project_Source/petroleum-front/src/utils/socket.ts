import { io } from 'socket.io-client';

// Create socket instance connecting to your backend
export const socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 60000
});

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

export default socket; 