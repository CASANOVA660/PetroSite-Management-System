# PetroConnect Core Entity Class Diagram

```mermaid
classDiagram
    %% Authentication and User Management
    class Account {
        +String email
        +Object motDePasse
        +ObjectId utilisateurAssocie
        +String activationToken
        +Date activationTokenExpiry
        +Boolean mustChangePassword
        +validatePassword(password)
        +generateActivationToken()
        +resetPassword(newPassword)
        +activateAccount(token, password)
    }
    
    class User {
        +String nom
        +String prenom
        +String email
        +String role
        +String employeeId
        +String telephone
        +String country
        +String city
        +String state
        +Boolean estActif
        +Object profilePicture
        +Date createdAt
        +Date updatedAt
        +generateEmployeeId()
        +updateProfile(profileData)
        +assignRole(role)
        +activate()
        +deactivate()
        +updateProfilePicture(imageData)
    }
    
    %% Task Management
    class Task {
        +String title
        +String description
        +String status
        +Number progress
        +String priority
        +Date startDate
        +Date endDate
        +Date completedAt
        +ObjectId assignee
        +ObjectId creator
        +Boolean needsValidation
        +Array~Comment~ comments
        +Array~File~ files
        +Array~Subtask~ subtasks
        +Array~String~ tags
        +ObjectId actionId
        +ObjectId globalActionId
        +ObjectId linkedTaskId
        +ObjectId projectId
        +String category
        +String projectCategory
        +Boolean isArchived
        +Date archivedAt
        +Boolean isDeclined
        +String declineReason
        +Date declinedAt
        +String feedback
        +changeStatus(status)
        +updateProgress(progress)
        +addComment(comment)
        +attachFile(file)
        +addSubtask(subtask)
        +toggleSubtask(subtaskId)
        +approve()
        +decline(reason)
        +returnWithFeedback(feedback)
        +complete()
        +archive()
        +isOverdue()
        +getDuration()
    }
    
    class Comment {
        +String text
        +ObjectId author
        +Date createdAt
        +formatCreationDate()
        +isEditable(userId)
    }
    
    class File {
        +String name
        +String url
        +String publicId
        +String type
        +Number size
        +ObjectId uploadedBy
        +Date uploadedAt
        +Boolean approved
        +approve()
        +getFormattedSize()
        +getFileExtension()
        +isImage()
        +isPDF()
    }
    
    class Subtask {
        +String text
        +Boolean completed
        +toggle()
        +complete()
        +reopen()
    }
    
    %% Actions
    class Action {
        +String title
        +String content
        +String source
        +ObjectId responsible
        +ObjectId responsibleFollowup
        +ObjectId manager
        +Date startDate
        +Date endDate
        +String status
        +String category
        +ObjectId projectId
        +Boolean needsValidation
        +validateDates()
        +start()
        +complete()
        +cancel()
        +submitForReview()
        +approve()
        +isOverdue()
        +getRemainingDays()
        +getDuration()
        +generateTasks()
    }
    
    class GlobalAction {
        +String title
        +String content
        +ObjectId manager
        +ObjectId responsibleForRealization
        +ObjectId responsibleForFollowUp
        +String category
        +Date startDate
        +Date endDate
        +String status
        +ObjectId projectId
        +String projectCategory
        +ObjectId parentActionId
        +Array~ObjectId~ subActions
        +Boolean needsValidation
        +validateDates()
        +start()
        +complete()
        +cancel()
        +submitForReview()
        +approve()
        +addSubAction(actionData)
        +removeSubAction(actionId)
        +isOverdue()
        +getRemainingDays()
        +getDuration()
        +generateTasks()
    }
    
    %% Equipment Management
    class Equipment {
        +String nom
        +String reference
        +String matricule
        +Object dimensions
        +Object operatingConditions
        +String location
        +String status
        +Array~Activity~ activities
        +Date lastMaintenanceDate
        +Date nextMaintenanceDate
        +ObjectId createdBy
        +ObjectId updatedBy
        +Boolean isDeleted
        +hasScheduleConflict(startDate, endDate)
        +normalizeStatus()
        +calculateVolume()
        +scheduleActivity(activityData)
        +startActivity(activityId)
        +completeActivity(activityId)
        +cancelActivity(activityId)
        +changeLocation(newLocation)
        +setAvailable()
        +setInMaintenance()
        +setInUse()
        +setOutOfService()
        +getUpcomingActivities()
        +needsMaintenance()
    }
    
    class Activity {
        +String type
        +String description
        +Date startDate
        +Date endDate
        +Date actualStartDate
        +Date actualEndDate
        +String status
        +String location
        +Object responsiblePerson
        +ObjectId planId
        +ObjectId createdBy
        +start()
        +complete()
        +cancel()
        +reschedule(newStartDate, newEndDate)
        +getDuration()
        +isOngoing()
        +isScheduled()
        +isComplete()
        +isCancelled()
    }
    
    class Dimensions {
        +Number height
        +Number width
        +Number length
        +Number weight
        +Number volume
        +calculateVolume()
        +getFormattedDimensions()
    }
    
    class OperatingConditions {
        +String temperature
        +String pressure
        +isWithinNormalRange()
        +getFormattedConditions()
    }
    
    %% Relationships with proper UML notation and cardinality
    %% Notation:
    %% Association: -->
    %% Inheritance: --|>
    %% Composition: *--
    %% Aggregation: o--
    
    %% Association relationships (reference without strong ownership)
    Account "1" --> "1" User : references
    Task "0..*" --> "1" User : assignee
    Task "0..*" --> "1" User : creator
    Task "0..*" --> "0..1" Action : references
    Task "0..*" --> "0..1" GlobalAction : references
    Action "0..*" --> "1" User : responsible
    Action "0..*" --> "1" User : manager [Only if role = Manager]
    Action "0..*" --> "1" User : responsibleFollowup
    GlobalAction "0..*" --> "1" User : manager [Only if role = Manager]
    GlobalAction "0..*" --> "1" User : responsibleForRealization
    GlobalAction "0..*" --> "1" User : responsibleForFollowUp
    GlobalAction "0..*" --> "0..1" GlobalAction : parent
    Equipment "0..*" --> "1" User : createdBy [Only if role = Manager or Chef de base]
    Equipment "0..*" --> "1" User : updatedBy [Only if role = Manager or Chef de base or Resp. Maintenance]
    
    %% Composition relationships (strong ownership, part cannot exist without whole)
    Task "1" *-- "0..*" Comment : contains
    Task "1" *-- "0..*" File : contains
    Task "1" *-- "0..*" Subtask : contains
    Equipment "1" *-- "0..*" Activity : contains [Maintenance activities only if role = Resp. Maintenance]
    
    %% Aggregation relationships (weak ownership, part can exist independently)
    Equipment "1" o-- "1" Dimensions : has
    Equipment "1" o-- "1" OperatingConditions : has
    GlobalAction "1" o-- "0..*" GlobalAction : subActions [Only if parent role = Manager]
```

## Role-Based Access Constraints

The system enforces various role-based constraints on entity relationships:

1. **Equipment Management**:
   - Only users with role "Manager" or "Chef de base" can create equipment
   - Only users with role "Manager", "Chef de base", or "Resp. Maintenance" can update equipment
   - Maintenance activities for equipment can only be managed by users with "Resp. Maintenance" role

2. **Action Management**:
   - Only users with role "Manager" can be assigned as the manager of an Action or GlobalAction
   - Only users with role "Manager" can create sub-actions under a GlobalAction

3. **Task Access Control**:
   - All users can be assigned to tasks
   - All users can create personal tasks
   - Task validation workflow enforces role-based approval processes

4. **User Management**:
   - Only users with role "Manager" can create other users (except for the first user)
   - Only users with role "Manager" can assign roles to users

## Relationship Cardinality Explanation

- **One-to-One (1-1)**: 
  - Each Account references exactly one User
  - Each Equipment has exactly one Dimensions object
  - Each Equipment has exactly one OperatingConditions object

- **One-to-Many (1-*)**: 
  - Each User can be the assignee for many Tasks (0 or more)
  - Each User can be the creator for many Tasks (0 or more)
  - Each User can be responsible for many Actions (0 or more)
  - Each User can be manager for many Actions (0 or more)
  - Each Task contains many Comments (0 or more)
  - Each Task contains many Files (0 or more)
  - Each Task contains many Subtasks (0 or more)
  - Each Equipment contains many Activities (0 or more)
  - Each GlobalAction can have many child GlobalActions (0 or more)

- **Many-to-One (*-1)**:
  - Many Tasks can reference the same User as assignee
  - Many Tasks can reference the same User as creator
  - Many Tasks can reference the same Action (optional)
  - Many Tasks can reference the same GlobalAction (optional)
  - Many Actions can reference the same User as responsible
  - Many Equipment can reference the same User as creator

- **Optional Relationships (0..1)**:
  - Tasks may or may not be associated with an Action (optional)
  - Tasks may or may not be associated with a GlobalAction (optional)
  - GlobalActions may or may not have a parent GlobalAction (optional)

## Functional Areas & Business Logic

### User Management
- User account creation and activation
- Role-based authorization
- Profile management
- Password management (reset, change)

### Task Management
- Task creation (personal, project-related, action-related)
- Task assignment
- Status tracking (todo, inProgress, inReview, done)
- Task validation/review process
- File attachments with approval workflow
- Comments and subtasks
- Task archiving

### Action Management
- Project action tracking
- Global action tracking
- Hierarchical actions (parent-child relationships)
- Action status management
- Task generation from actions

### Equipment Management
- Equipment inventory tracking
- Activity scheduling (placement, operation, maintenance, repair)
- Status management (available, in use, maintenance, repair, out of service)
- Conflict detection for scheduling
- Dimension and operating condition tracking 