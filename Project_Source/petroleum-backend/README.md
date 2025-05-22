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

# Petroleum Backend Models Documentation

This document provides an overview of all database models implemented in the Petroleum Backend application. The models are organized by module.

## Auth Module

### Account Model
- **email**: String (required, unique)
- **motDePasse**: Object with iv and encryptedData fields (encrypted password)
- **utilisateurAssocie**: Reference to User model
- **activationToken**: String
- **activationTokenExpiry**: Date
- **mustChangePassword**: Boolean (default: true)

## Users Module

### User Model
- **nom**: String (required)
- **prenom**: String (required)
- **email**: String (required, unique, lowercase)
- **role**: String (enum: Manager, Chef projet, Resp. RH, Resp. Logistique, Chef de base, Resp. magasin, Resp. Achat, Resp. Maintenance, Chef Opérateur)
- **employeeId**: String (unique, auto-generated)
- **telephone**: String
- **country**: String (default: Tunisia)
- **city**: String
- **state**: String
- **estActif**: Boolean (default: false)
- **profilePicture**: Object with url and publicId
- **createdAt**: Date (default: current date)
- **updatedAt**: Date

## Tasks Module

### Task Model
- **title**: String (required)
- **description**: String
- **status**: String (enum: todo, inProgress, inReview, done) (default: todo)
- **progress**: Number (min: 0, max: 100) (default: 0)
- **priority**: String (enum: low, medium, high) (default: medium)
- **startDate**: Date
- **endDate**: Date
- **completedAt**: Date
- **assignee**: Reference to User
- **creator**: Reference to User (required)
- **needsValidation**: Boolean (default: true)
- **comments**: Array of Comment objects
- **files**: Array of File objects
- **subtasks**: Array of Subtask objects
- **tags**: Array of Strings
- **actionId**: Reference to Action
- **globalActionId**: Reference to GlobalAction
- **linkedTaskId**: Reference to Task
- **projectId**: Reference to Project
- **category**: String
- **projectCategory**: String
- **isArchived**: Boolean (default: false)
- **archivedAt**: Date
- **isDeclined**: Boolean (default: false)

#### Subtask Schema
- **text**: String (required)
- **completed**: Boolean (default: false)

#### File Schema
- **name**: String (required)
- **url**: String (required)
- **publicId**: String (required)
- **type**: String (required)
- **size**: Number (required)
- **uploadedBy**: Reference to User (required)
- **uploadedAt**: Date (default: current date)
- **approved**: Boolean (default: false)

#### Comment Schema
- **text**: String (required)
- **author**: Reference to User (required)
- **createdAt**: Date (default: current date)

## Equipment Module

### Equipment Model
- **nom**: String (required)
- **reference**: String (required, unique)
- **matricule**: String (required, unique)
- **dimensions**: Dimensions object (required)
- **operatingConditions**: OperatingConditions object (required)
- **location**: String (required)
- **status**: String (enum: disponible, disponible_needs_repair, on_repair, disponible_bon_etat, working_non_disponible) (default: disponible)
- **createdBy**: Reference to User

#### Dimensions Schema
- **height**: Number (required)
- **width**: Number (required)
- **length**: Number (required)
- **weight**: Number (required)
- **volume**: Number (calculated)

#### Operating Conditions Schema
- **temperature**: String (required)
- **pressure**: String (required)

### Equipment History Model
- **equipmentId**: Reference to Equipment (required, indexed)
- **type**: String (enum: placement, operation, maintenance) (required, indexed)
- **description**: String (required)
- **fromDate**: Date (required, indexed)
- **toDate**: Date (optional)
- **location**: String (optional)
- **responsiblePerson**: ResponsiblePerson object
- **createdBy**: Reference to User (required)

#### Responsible Person Schema
- **name**: String (required)
- **email**: String (optional)
- **phone**: String (optional)
- **userId**: Reference to User (optional)

## Actions Module

### Action Model
- **title**: String (required)
- **content**: String (required)
- **source**: String (required)
- **responsible**: Reference to User (required)
- **responsibleFollowup**: Reference to User (required)
- **manager**: Reference to User (required)
- **startDate**: Date (required)
- **endDate**: Date (required)
- **status**: String (enum: pending, in_progress, inReview, completed, cancelled) (default: pending)
- **category**: String (required)
- **projectId**: Reference to Project (optional)
- **needsValidation**: Boolean (default: false)

### Global Action Model
- **title**: String (required)
- **content**: String (required)
- **manager**: Reference to User (required)
- **responsibleForRealization**: Reference to User (required)
- **responsibleForFollowUp**: Reference to User (required)
- **category**: String (required)
- **startDate**: Date (required)
- **endDate**: Date (required)
- **status**: String (enum: pending, in_progress, inReview, completed, cancelled) (default: pending)
- **projectId**: Reference to Project (optional)
- **projectCategory**: String (optional)
- **parentActionId**: Reference to GlobalAction (optional)
- **subActions**: Array of references to GlobalAction
- **needsValidation**: Boolean (default: false)

## Documents Module

### Document Model
- **name**: String (required)
- **url**: String (required)
- **publicId**: String (required)
- **category**: String (required, enum: Documents globale, Dossier Administratif, Dossier Technique, Dossier RH, Dossier HSE)
- **projectId**: Reference to Project (required)
- **uploadedBy**: Reference to User (required)
- **format**: String
- **resourceType**: String
- **size**: Number
- **width**: Number
- **height**: Number
- **optimizedUrl**: String
- **transformedUrl**: String

## Projects Module

### Project Model
- **name**: String (required)
- **projectNumber**: String (required, unique)
- **clientName**: String (required)
- **description**: String (required)
- **startDate**: Date (required)
- **endDate**: Date (required)
- **status**: String (enum: En cours, Fermé, Annulé) (default: En cours)
- **categories**: Array of Strings (default: Documents globale, Dossier Administratif, Dossier Technique, Dossier RH, Dossier HSE)
- **equipment**: Array of equipment objects
- **createdBy**: Reference to User (required)
- **isDeleted**: Boolean (default: false)

## Chat Module

### Chat Model
- **title**: String (optional, null by default - only required for group chats)
- **isGroup**: Boolean (default: false)
- **groupPicture**: Object with url and publicId
- **participants**: Array of references to User (required)
- **admin**: Reference to User (required)
- **lastMessage**: Reference to Message

### Message Model
- **chat**: Reference to Chat (required)
- **sender**: Reference to User (required)
- **content**: String (required if no attachments)
- **readBy**: Array of references to User
- **attachments**: Array of attachment objects

#### Attachment Schema
- **url**: String (required)
- **type**: String (enum: image, document, video, audio) (required)
- **filename**: String
- **size**: Number

## Meet Module

### Meet Model
- **title**: String (required)
- **description**: String
- **date**: Date (required)
- **duration**: Number (default: 60 minutes)
- **meetLink**: String
- **googleCalendarEventId**: String
- **calendarEventId**: String
- **calendarLink**: String
- **creator**: Reference to User (required)
- **participants**: Array of references to User
- **externalParticipants**: Array of ExternalParticipant objects
- **notes**: Array of Note objects
- **attachments**: Array of Attachment objects
- **projectId**: Reference to Project
- **status**: String (enum: scheduled, cancelled, completed) (default: scheduled)

#### External Participant Schema
- **name**: String (required)
- **email**: String (required)
- **organization**: String

#### Note Schema
- **text**: String (required)
- **createdAt**: Date (default: current date)
- **createdBy**: Reference to User

#### Attachment Schema
- **name**: String (required)
- **size**: String
- **type**: String
- **url**: String (required)
- **uploadedAt**: Date (default: current date)
- **uploadedBy**: Reference to User

## Notifications Module

### Notification Model
- **type**: String (enum: multiple notification types) (required)
- **message**: String (required)
- **userId**: Reference to User (required)
- **isRead**: Boolean (default: false)
- **metadata**: Mixed type (default: null)
- **createdAt**: Date (default: current date)

## Gestion RH Module

### Employee Model
- **name**: String (required)
- **email**: String (required, unique)
- **phone**: String
- **position**: String
- **department**: String
- **hireDate**: Date
- **profileImage**: String
- **folders**: Array of Folder objects
- **createdAt**: Date (default: current date)
- **updatedAt**: Date (default: current date)

#### Folder Schema
- **id**: String (required)
- **name**: String (required)
- **parentId**: String (default: null)
- **documents**: Array of Document objects
- **subfolders**: Array of mixed types

#### Document Schema
- **url**: String
- **type**: String
- **name**: String
- **publicId**: String
- **uploadedBy**: String
- **uploadedAt**: Date (default: current date)
- **size**: Number
- **format**: String
- **resourceType**: String
- **width**: Number
- **height**: Number 