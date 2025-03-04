const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeFirebase } = require('./config/firebase');
const userRoutes = require('./modules/users/routes/userRoutes');
const authRoutes = require('./modules/auth/routes/authRoutes');
const notificationRoutes = require('./modules/notifications/routes/notificationRoutes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();
connectRedis();
initializeFirebase();

const app = express();
app.use(express.json());
app.use(cors());

// Auth routes (unprotected)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));