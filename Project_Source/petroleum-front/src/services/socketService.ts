import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { receiveMessage, addTypingUser, removeTypingUser } from '../store/slices/chatSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { API_URL } from '../config';

// Create the base URL (remove '/api' if it exists)
const SOCKET_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;

    // Initialize socket connection
    connect(userId: string): void {
        this.userId = userId;

        if (this.socket) {
            this.disconnect();
        }

        // Connect to server
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        // Set up connection events
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);

            // Authenticate socket with userId
            this.socket?.emit('authenticate', userId);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        // Set up message listeners
        this.setupMessageListeners();
    }

    // Disconnect socket
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Set up message and notification listeners
    private setupMessageListeners(): void {
        if (!this.socket) return;

        // Listen for new messages
        this.socket.on('message', (data) => {
            if (data.type === 'NEW_MESSAGE') {
                // Un son sera joué automatiquement seulement pour les messages entrants (réception)
                // et pas pour les messages envoyés par l'utilisateur lui-même
                // via le reducer receiveMessage dans chatSlice.ts
                store.dispatch(receiveMessage({
                    chatId: data.payload.chatId,
                    message: data.payload.message
                }));
            }
        });

        // Listen for notifications
        this.socket.on('notification', (data) => {
            store.dispatch(addNotification({
                _id: Date.now().toString(), // Generate a temporary ID
                type: data.type,
                message: data.payload.message,
                userId: this.userId || '',
                isRead: false,
                createdAt: new Date().toISOString()
            }));
        });

        // Listen for typing indicators
        this.socket.on('typing', (data) => {
            store.dispatch(addTypingUser({
                chatId: data.chatId,
                userId: data.userId
            }));
        });

        this.socket.on('stop-typing', (data) => {
            store.dispatch(removeTypingUser({
                chatId: data.chatId,
                userId: data.userId
            }));
        });
    }

    // Send typing indicator
    sendTyping(chatId: string): void {
        if (this.socket && this.userId) {
            this.socket.emit('typing', {
                chatId,
                userId: this.userId
            });
        }
    }

    // Send stop typing indicator
    sendStopTyping(chatId: string): void {
        if (this.socket && this.userId) {
            this.socket.emit('stop-typing', {
                chatId,
                userId: this.userId
            });
        }
    }
}

// Create and export a singleton instance
export const socketService = new SocketService();
export default socketService; 