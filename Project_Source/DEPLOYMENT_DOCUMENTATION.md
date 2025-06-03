# Petroleum Project Management System - Deployment Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Deployment Process](#deployment-process)
   - [Backend Deployment (Render)](#backend-deployment-render)
   - [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
   - [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
   - [Redis Configuration (Upstash)](#redis-configuration-upstash)
5. [Environment Variables](#environment-variables)
6. [Security Considerations](#security-considerations)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Troubleshooting](#troubleshooting)
9. [Scaling Considerations](#scaling-considerations)

## Project Overview

The Petroleum Project Management System is a comprehensive web application designed to streamline project management, task tracking, and team collaboration for petroleum industry projects. It provides features for user management, project tracking, document management, task assignments, equipment tracking, and real-time chat capabilities.

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: Custom components with Tailwind CSS
- **Build Tool**: Vite
- **Real-time Communication**: Socket.io client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (NoSQL)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Real-time Communication**: Socket.io
- **Email Service**: SendGrid
- **Containerization**: Docker

### DevOps
- **Frontend Hosting**: Netlify
- **Backend Hosting**: Render
- **Database Hosting**: MongoDB Atlas
- **Redis Hosting**: Upstash
- **Version Control**: Git/GitHub
- **CI/CD**: Netlify & Render automatic deployments

## System Architecture

The system follows a modern microservices-inspired architecture:

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│   Frontend     │────▶│     Backend    │────▶│    MongoDB     │
│   (Netlify)    │     │    (Render)    │     │    (Atlas)     │
│                │◀────│                │◀────│                │
└────────────────┘     └────────────────┘     └────────────────┘
                              │  ▲
                              │  │
                              ▼  │
                       ┌────────────────┐
                       │                │
                       │     Redis      │
                       │   (Upstash)    │
                       │                │
                       └────────────────┘
```

- **Frontend**: Single Page Application (SPA) with React, communicating with the backend via RESTful API calls and WebSockets for real-time features.
- **Backend**: Modular Express.js application with dedicated modules for different functionalities (users, projects, tasks, etc.).
- **Database**: MongoDB for primary data storage with multiple collections for different data types.
- **Caching**: Redis for session management, caching, and supporting real-time features.

## Deployment Process

### Backend Deployment (Render)

#### Prerequisites
- Render account
- GitHub repository with backend code
- MongoDB Atlas cluster
- Upstash Redis instance
- SendGrid or email provider account
- Cloudinary account for file storage

#### Deployment Steps

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**:
   - Sign in to Render
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository with your backend code
   - Configure the service:
     - Name: `petroleum-backend` (or your preferred name)
     - Environment: Docker
     - Branch: main
     - Root Directory: Project_Source/petroleum-backend (for monorepo)
     - Plan: Free tier (or as needed)


4. **Deploy and Monitor**:
   - Click "Create Web Service"
   - Monitor the build and deployment logs
   - Once deployed, test the health endpoint: `https://your-service-name.onrender.com/health`

### Frontend Deployment (Netlify)

#### Prerequisites
- Netlify account
- GitHub repository with frontend code
- Backend deployed and running on Render

#### Deployment Steps

1. **Prepare Frontend for Production**:
   - Update `.env.production` with correct backend URL:
     ```
     VITE_API_URL=https://your-backend-service.onrender.com/api
     ```
   - Ensure all API calls use the configured URL
   - Create `netlify.toml` file for build configuration

2. **Deploy to Netlify**:
   - Log in to Netlify
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub repository
   - Configure build settings:
     - Branch to deploy: `main` (or your preferred branch)
     - Base directory: `petroleum-front` (for monorepo)
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure Environment Variables**:
   - Go to site settings → "Environment variables"
   - Add `VITE_API_URL=https://your-backend-service.onrender.com/api`

4. **Set up Custom Domain (Optional)**:
   - Go to "Domain management"
   - Add your custom domain
   - Configure DNS settings as instructed

### Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Cluster**:
   - Sign up/login to MongoDB Atlas
   - Create a new cluster (free tier available)
   - Configure network access to allow connections from Render

2. **Database Configuration**:
   - Create a database user
   - Get the connection string
   - Add it to Render environment variables

3. **Data Security**:
   - Ensure IP whitelist includes Render's IP ranges
   - Use strong passwords for database users
   - Enable MongoDB Atlas backup 

### Redis Configuration (Upstash)

1. **Create Upstash Redis Database**:
   - Sign up/login to Upstash
   - Create a new Redis database
   - Select a region close to your Render deployment

2. **Redis Configuration**:
   - Get the Redis connection string
   - Add it to Render environment variables as `REDIS_URL`
   - Enable TLS for secure connections

## Environment Variables

### Required Environment Variables

The application depends on the following environment variables that must be configured in Render for proper operation:

1. **Database Configuration**:
   - `MONGODB_URI`: MongoDB connection string
   - `MONGODB_DB_NAME`: Name of the MongoDB database

2. **Authentication**:
   - `JWT_SECRET`: Secret key for JWT token generation
   - `JWT_EXPIRY`: Token expiration time (e.g., "7d" for 7 days)

3. **Redis**:
   - `REDIS_URL`: Connection string for Redis

4. **Email Service**:
   - `SMTP_HOST`: SMTP server host
   - `SMTP_PORT`: SMTP server port
   - `SMTP_USER`: SMTP username
   - `SMTP_PASS`: SMTP password
   - `EMAIL_FROM`: Default sender email address

5. **File Storage**:
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Cloudinary API secret

6. **API Keys**:
   - `OPENAI_API_KEY`: OpenAI API key (optional - RAG features will be disabled if not provided)

7. **Application Settings**:
   - `NODE_ENV`: Environment ("development", "production", or "test")
   - `PORT`: Port number for the server
   - `FRONTEND_URL`: URL of the frontend application (for CORS)
   - `BACKEND_URL`: URL of the backend application (for webhooks and callbacks)

### Adding Environment Variables in Render

1. Navigate to the Render dashboard and select your backend service
2. Go to "Environment" tab
3. Add each environment variable with its corresponding value
4. Click "Save Changes" to apply
5. Restart the service for the changes to take effect

### Optional Features

Some features depend on specific environment variables:

- **RAG System (AI-powered chat)**: Requires `OPENAI_API_KEY`. If not provided, the RAG feature will be disabled but the application will continue to function. 
- **File Storage**: Requires Cloudinary credentials. If not provided, file upload features will be disabled.
- **Email Notifications**: Requires SMTP configuration. If not provided, email features will be disabled.

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Dependency Updates**:
   ```bash
   npm outdated
   npm update
   ```

2. **Database Maintenance**:
   - Regular backups (configured in MongoDB Atlas)
   - Index optimization
   - Data cleanup for inactive users/projects

3. **Log Monitoring**:
   - Check Render logs for backend issues
   - Check Netlify logs for frontend issues
   - Monitor MongoDB Atlas metrics

### Updating the Application

1. **Backend Updates**:
   - Push changes to GitHub
   - Render will automatically deploy
   - Monitor logs for any issues

2. **Frontend Updates**:
   - Push changes to GitHub
   - Netlify will automatically deploy
   - Verify changes in production

## Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**:
   - Check CORS configuration in server.js
   - Ensure frontend URL is in the allowed origins list
   - Verify proper headers in requests

2. **Authentication Issues**:
   - Check JWT secret is consistent
   - Verify token expiration settings
   - Use proper encryption keys for passwords

3. **Database Connection Issues**:
   - Verify MongoDB Atlas IP whitelist includes Render
   - Check connection string is correct
   - Ensure database user has proper permissions

4. **Redis Connection Issues**:
   - Verify Upstash connection string
   - Check Redis configuration in code
   - Ensure TLS is enabled for secure connections

5. **File Upload Issues**:
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper MIME types are allowed

6. **OpenAI API Issues**:
   - Verify `OPENAI_API_KEY` is correctly set in environment variables
   - Check OpenAI API usage limits and billing status
   - If you don't want to use OpenAI features, they will be automatically disabled
   - The application has been designed to function without OpenAI integration

### Debugging Tools

1. **Backend Logs**:
   - Render dashboard logs
   - Application logs (console output)

2. **Frontend Debugging**:
   - Browser developer tools
   - Redux DevTools for state management
   - Network tab for API requests

3. **Database Monitoring**:
   - MongoDB Atlas dashboard
   - Performance Advisor
   - Logs and metrics

## Scaling Considerations

### Horizontal Scaling

1. **Backend Scaling**:
   - Upgrade to paid Render plan for auto-scaling
   - Implement load balancing
   - Use stateless design for multiple instances

2. **Database Scaling**:
   - MongoDB Atlas scaling options
   - Sharding for large datasets
   - Read replicas for read-heavy workloads

3. **Redis Scaling**:
   - Upstash offers scaling options
   - Consider Redis Cluster for large workloads

### Vertical Scaling

1. **Backend Resources**:
   - Upgrade Render plan for more CPU/memory
   - Optimize code for better performance

2. **Database Resources**:
   - Increase MongoDB Atlas tier
   - Optimize indexes and queries

3. **Frontend Performance**:
   - Implement code splitting
   - Use CDN for static assets
   - Optimize bundle size 