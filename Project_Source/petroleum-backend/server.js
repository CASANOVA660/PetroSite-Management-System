const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/database');
const redis = require('./config/redis'); // Updated Redis import
const { initializeFirebase } = require('./config/firebase');
const userRoutes = require('./modules/users/routes/userRoutes');
const authRoutes = require('./modules/auth/routes/authRoutes');
const notificationRoutes = require('./modules/notifications/routes/notificationRoutes');
const projectRoutes = require('./modules/projects/routes/projectRoutes');
const documentRoutes = require('./modules/documents/routes/document.routes');
const actionRoutes = require('./modules/actions/routes/action.routes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./utils/logger');

dotenv.config();

// Initialize core services
connectDB(); // MongoDB
initializeFirebase(); // Firebase

// Redis connection events
redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis connection error:', err));

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173", // Fixed URL
        methods: ["GET", "POST", "PUT"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    pingTimeout: 60000
});

global.io = io;

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/actions', actionRoutes);

// Socket.io events
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('error', (error) => {
        logger.error(`Socket error (${socket.id}):`, error);
    });

    socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected (${socket.id}): ${reason}`);
    });
});

// Error handling
app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});