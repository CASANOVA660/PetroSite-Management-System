import { io } from 'socket.io-client';
import { API_URL } from '../config';

const socket = io(API_URL, {
    autoConnect: false
});

export const connectSocket = (userId: string) => {
    if (!socket.connected) {
        socket.connect();
        socket.emit('authenticate', userId);
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket; 