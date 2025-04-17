# Petroleum Project Management Backend

Backend API for the Petroleum Project Management System.

## Features

- User authentication and access control
- Project management
- Document management with Cloudinary integration
- Action tracking for projects
- Global action management
- Equipment inventory and history
- Task management with validation workflow
- Real-time notifications via Socket.IO
- Redis caching for improved performance

## Modules

### Users
- User authentication
- Role-based access control
- Profile management

### Projects
- Project tracking
- Project documents
- Project actions

### Documents
- Document storage and retrieval
- Category-based document organization
- Cloudinary integration for file storage

### Actions
- Project-specific actions
- Action status tracking
- Responsible person assignment

### Global Actions
- Global action management
- Multiple responsible persons
- Action follow-up

### Equipment
- Equipment inventory
- Equipment maintenance tracking
- Equipment history

### Tasks
- Personal tasks
- Action-generated tasks
- Task validation workflow
- File uploads with Cloudinary
- Comments for task communication
- Subtasks for progress tracking
- Automatic archiving of completed tasks

### Notifications
- Real-time notifications
- Notification history
- Socket.IO integration

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   REDIS_HOST=your_redis_host
   REDIS_PORT=your_redis_port
   REDIS_PASSWORD=your_redis_password
   ```
4. Run the setup script to create necessary directories:
   ```
   npm run setup
   ```
5. Start the server:
   ```
   npm start
   ```
   or for development with auto-reload:
   ```
   npm run dev
   ```

## API Documentation

The API endpoints are organized by module:

- `/api/auth` - Authentication endpoints
- `/api/users` - User management
- `/api/projects` - Project management
- `/api/documents` - Document management
- `/api/actions` - Project action management
- `/api/global-actions` - Global action management
- `/api/tasks` - Task management
- `/api/equipment` - Equipment management
- `/api/notifications` - Notification management

For detailed API documentation, please refer to the module-specific README files in each module directory.

## Cron Jobs

The application includes scheduled tasks:

- `archive-tasks.js` - Archives completed tasks after 1 day 