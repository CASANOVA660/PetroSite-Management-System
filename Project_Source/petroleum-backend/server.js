const express = require('express');
const dotenv = require('dotenv');

// Load environment variables first, before requiring other modules
dotenv.config();

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
const taskRoutes = require('./modules/tasks/routes/task.routes');
const equipmentRoutes = require('./modules/equipment/routes/equipment.routes');
const chatRoutes = require('./modules/chat/routes/chatRoutes');
const gestionRhRoutes = require('./modules/gestion-rh');
const meetRoutes = require('./modules/meet/routes/meetRoutes');
const projectMeetRoutes = require('./modules/meet/routes/projectMeetRoutes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./utils/logger');
const globalActionRoutes = require('./modules/actions/routes/globalAction.routes');
const { handleTyping } = require('./modules/chat/controllers/messageController');
const kpiFieldsRoutes = require('./modules/kpis/fields.routes');
const kpiRoutes = require('./modules/kpis/kpi.routes');

// Initialize core services
connectDB(); // MongoDB
initializeFirebase(); // Firebase

// Initialize cron jobs
if (process.env.NODE_ENV !== 'test') {
    logger.info('Initializing cron jobs');
    require('./crons/archive-tasks');
}

// Redis connection events
redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis connection error:', err));

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://petrosite-management-system.onrender.com",
            "https://petroleum-project.netlify.app",
            "https://6833a98c99a3a825df04287b--petroleum-project.netlify.app",
            /\.netlify\.app$/,  // Allow all Netlify subdomains
            /\.netlify\.live$/  // Allow Netlify Live domains for previews
        ],
        methods: ["GET", "POST", "PUT"],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    pingTimeout: 60000
});

// Store active user connections
const userSockets = new Map();

// Socket.io events
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle user authentication and join their personal room
    socket.on('authenticate', (userId) => {
        if (userId) {
            // Store the socket ID for this user
            userSockets.set(String(userId), socket.id);

            // Join user's personal room
            socket.join(String(userId));
            logger.info(`User ${userId} joined their room`);
        }
    });

    // Handle typing events for chat
    handleTyping(socket, io, userSockets);

    // Direct notification from frontend to specific user
    socket.on('direct-notification', async (data) => {
        try {
            logger.info(`Received direct notification request for user ${data.userId}`);

            if (!data.userId || !data.notification) {
                logger.error('Invalid direct notification data:', data);
                return;
            }

            // Get the notification content
            const { userId, notification } = data;

            // Get the socket ID for this user
            const targetSocketId = userSockets.get(String(userId));

            if (targetSocketId) {
                // Emit to the target user
                io.to(targetSocketId).emit('notification', {
                    type: 'NEW_NOTIFICATION',
                    payload: notification
                });
                logger.info(`Direct notification sent to user ${userId} via socket ${targetSocketId}`);
            } else {
                logger.info(`User ${userId} not connected, could not deliver direct notification`);

                // Optionally save the notification in the database for when they reconnect
                try {
                    const { createNotification } = require('./modules/notifications/controllers/notificationController');
                    await createNotification({
                        type: notification.type,
                        message: notification.message,
                        userId: userId,
                        isRead: false,
                        metadata: {
                            ...notification.metadata,
                            source: 'direct-socket',
                            timestamp: new Date()
                        }
                    });
                    logger.info(`Saved direct notification to database for user ${userId}`);
                } catch (err) {
                    logger.error('Error saving direct notification:', err);
                }
            }
        } catch (error) {
            logger.error('Error processing direct notification:', error);
        }
    });

    socket.on('error', (error) => {
        logger.error(`Socket error (${socket.id}):`, error);
    });

    socket.on('disconnect', (reason) => {
        // Remove user from userSockets when they disconnect
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
        logger.info(`Client disconnected (${socket.id}): ${reason}`);
    });
});

// Make io and userSockets globally available
global.io = io;
global.userSockets = userSockets;

// Debug socket connection status
const debugSocketInterval = setInterval(() => {
    const connectedUsers = Array.from(userSockets.keys());
    if (connectedUsers.length > 0) {
        logger.info(`Connected users via socket: ${connectedUsers.join(', ')}`);
        logger.info(`Total socket connections: ${io.engine.clientsCount}`);
    }
}, 60000); // Log every minute

// Socket error handling
io.engine.on('connection_error', (err) => {
    logger.error('Socket.io connection error:', err);
});

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://petrosite-management-system.onrender.com",
        "https://petroleum-project.netlify.app",
        "https://6833a98c99a3a825df04287b--petroleum-project.netlify.app",
        /\.netlify\.app$/,  // Allow all Netlify subdomains
        /\.netlify\.live$/  // Allow Netlify Live domains for previews
    ],
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

// Health check endpoint for Docker and Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/global-actions', globalActionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/gestion-rh/employees', gestionRhRoutes);

// Routes pour les réunions
app.use('/api/meetings', meetRoutes);
app.use('/api/projects/:projectId/meetings', projectMeetRoutes);
app.use('/api/meet', require('./modules/meet/routes/meet.routes')); // New meet module route

// New KPI fields route
app.use('/api/kpis', kpiFieldsRoutes);

// New KPI CRUD API route
app.use('/api/kpis', kpiRoutes);

// Planning module
app.use('/api/plans', require('./modules/planning/routes/plan.routes'));

// Error handling
app.use(errorHandler);

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});