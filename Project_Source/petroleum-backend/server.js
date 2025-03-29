const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeFirebase } = require('./config/firebase');
const userRoutes = require('./modules/users/routes/userRoutes');
const authRoutes = require('./modules/auth/routes/authRoutes');
const notificationRoutes = require('./modules/notifications/routes/notificationRoutes');
const projectRoutes = require('./modules/projects/routes/projectRoutes');
const documentRoutes = require('./modules/documents/routes/document.routes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();
connectDB();
connectRedis();
initializeFirebase();

const app = express();
const server = http.createServer(app);

// Socket.io setup with proper configuration
const io = socketIo(server, {
    cors: {
        origin: "http://localhost5173:", // Your frontend URL
        methods: ["GET", "POST", "PUT"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true,
    pingTimeout: 60000
});

// Make io available globally
global.io = io;

// Middleware
app.use(cors({
    origin: "http://localhost:5173", // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);

// Socket.io connection handling with error handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', reason);
    });
});

app.use(errorHandler);

const PORT = 5000; // Keep backend on 5000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});