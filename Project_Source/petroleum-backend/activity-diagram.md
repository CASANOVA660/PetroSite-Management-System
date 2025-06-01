# PetroConnect Activity Diagrams

This document describes the key workflows and processes in the PetroConnect system using activity diagrams.

## 1. User Authentication and Registration Flow

```mermaid
stateDiagram-v2
    [*] --> CheckFirstUser
    CheckFirstUser --> FirstUserSetup: No users exist
    CheckFirstUser --> LoginOrRegister: Users exist
    
    FirstUserSetup --> CreateManagerAccount
    CreateManagerAccount --> ActivateAccount
    
    LoginOrRegister --> Login: Existing user
    LoginOrRegister --> Register: New user
    
    Register --> CheckManagerRole: Is requester Manager?
    CheckManagerRole --> CreateUserAccount: Yes
    CheckManagerRole --> Unauthorized: No
    
    CreateUserAccount --> GenerateActivationToken
    GenerateActivationToken --> SendActivationEmail
    SendActivationEmail --> AwaitActivation
    
    AwaitActivation --> ActivateAccount: User clicks link
    ActivateAccount --> SetPassword
    SetPassword --> CompleteProfile
    CompleteProfile --> NotifyManager
    NotifyManager --> [*]
    
    Login --> ValidateCredentials
    ValidateCredentials --> CheckPasswordReset: Valid
    ValidateCredentials --> LoginFailure: Invalid
    
    LoginFailure --> [*]
    
    CheckPasswordReset --> ForcePasswordChange: Must change
    CheckPasswordReset --> GenerateJWT: Password OK
    
    ForcePasswordChange --> GenerateJWT
    GenerateJWT --> [*]
    
    Unauthorized --> [*]
```

## 2. Task Management Workflow

```mermaid
stateDiagram-v2
    [*] --> TaskCreation
    
    TaskCreation --> PersonalTask: Created by user
    TaskCreation --> ActionTask: Generated from Action
    
    PersonalTask --> AssignTask: Self-assigned
    ActionTask --> AssignTask: Assigned by system
    
    AssignTask --> TodoStatus
    
    TodoStatus --> InProgressStatus: User starts task
    InProgressStatus --> AddComments: Add comments (optional)
    InProgressStatus --> AddFiles: Add files (optional)
    InProgressStatus --> AddSubtasks: Add subtasks (optional)
    InProgressStatus --> UpdateProgress: Update progress
    
    AddComments --> InProgressStatus
    AddFiles --> InProgressStatus
    AddSubtasks --> InProgressStatus
    UpdateProgress --> InProgressStatus
    
    InProgressStatus --> InReviewStatus: Submit for review
    
    InReviewStatus --> ReviewDecision: Manager reviews
    ReviewDecision --> ReturnForChanges: Return with feedback
    ReviewDecision --> DeclineTask: Decline
    ReviewDecision --> ApproveTask: Approve
    
    ReturnForChanges --> InProgressStatus: Return to assignee
    DeclineTask --> Archived
    
    ApproveTask --> CompleteTask
    CompleteTask --> DoneStatus
    
    DoneStatus --> Archived: After time threshold
    
    Archived --> [*]
```

## 3. Equipment Management Workflow

```mermaid
stateDiagram-v2
    [*] --> EquipmentCreation
    
    EquipmentCreation --> CheckRole: Attempt to create
    CheckRole --> CreateEquipment: Role is Manager or Chef de base
    CheckRole --> AccessDenied: Unauthorized role
    
    CreateEquipment --> SetAvailableStatus
    SetAvailableStatus --> EquipmentManagement
    
    EquipmentManagement --> ScheduleActivity: Schedule new activity
    EquipmentManagement --> ChangeStatus: Change status
    EquipmentManagement --> UpdateEquipment: Update info
    
    ScheduleActivity --> CheckConflict: Check for conflicts
    CheckConflict --> ConflictFound: Conflict exists
    CheckConflict --> AddActivity: No conflict
    
    ConflictFound --> EquipmentManagement
    
    AddActivity --> CheckActivityType: Determine type
    CheckActivityType --> PlacementActivity: Placement
    CheckActivityType --> OperationActivity: Operation
    CheckActivityType --> MaintenanceActivity: Maintenance
    CheckActivityType --> RepairActivity: Repair
    
    PlacementActivity --> UpdateLocation
    OperationActivity --> SetInUseStatus
    MaintenanceActivity --> CheckMaintenanceRole: Is Resp. Maintenance?
    RepairActivity --> SetRepairStatus
    
    CheckMaintenanceRole --> SetMaintenanceStatus: Yes
    CheckMaintenanceRole --> AccessDenied: No
    
    UpdateLocation --> StartActivity
    SetInUseStatus --> StartActivity
    SetMaintenanceStatus --> StartActivity
    SetRepairStatus --> StartActivity
    
    StartActivity --> ActivityInProgress
    ActivityInProgress --> CompleteActivity
    CompleteActivity --> UpdateEquipmentStatus
    UpdateEquipmentStatus --> EquipmentManagement
    
    ChangeStatus --> UpdateEquipmentStatus
    UpdateEquipment --> EquipmentManagement
    
    AccessDenied --> [*]
    EquipmentManagement --> [*]
```

## 4. Action Management Workflow

```mermaid
stateDiagram-v2
    [*] --> ActionCreation
    
    ActionCreation --> ProjectAction: Project specific
    ActionCreation --> GlobalAction: Global/company-wide
    
    ProjectAction --> ValidateDates: Set dates
    GlobalAction --> ValidateDates: Set dates
    
    ValidateDates --> InvalidDates: End date ≤ Start date
    ValidateDates --> AssignResponsible: Valid dates
    
    InvalidDates --> ActionCreation
    
    AssignResponsible --> AssignManager
    AssignManager --> CheckManagerRole: Is manager?
    
    CheckManagerRole --> AccessDenied: No
    CheckManagerRole --> GenerateTasks: Yes
    
    GenerateTasks --> ManagerTask: Create task for manager
    GenerateTasks --> ResponsibleTask: Create task for responsible
    GenerateTasks --> FollowupTask: Create task for followup
    
    ManagerTask --> SetPendingStatus
    ResponsibleTask --> SetPendingStatus
    FollowupTask --> SetPendingStatus
    
    SetPendingStatus --> NotifyAssignees
    NotifyAssignees --> ActionStarted
    
    ActionStarted --> ActionInProgress: Start date reached
    ActionInProgress --> CheckCompletion: Tasks completed?
    
    CheckCompletion --> ActionInProgress: No
    CheckCompletion --> SubmitForReview: Yes
    
    SubmitForReview --> ManagerReview
    ManagerReview --> ActionCompleted: Approved
    ManagerReview --> ReturnForChanges: Rejected
    
    ReturnForChanges --> ActionInProgress
    
    ActionCompleted --> NotifyStakeholders
    NotifyStakeholders --> [*]
    
    AccessDenied --> [*]
```

## 5. Document Workflow

```mermaid
stateDiagram-v2
    [*] --> DocumentCreation
    
    DocumentCreation --> UploadDocument
    UploadDocument --> ProcessDocument
    
    ProcessDocument --> ValidateDocument
    ValidateDocument --> InvalidDocument: Validation failed
    ValidateDocument --> StoreDocument: Validation passed
    
    InvalidDocument --> NotifyUploader
    NotifyUploader --> [*]
    
    StoreDocument --> AttachToEntity
    
    AttachToEntity --> AttachToTask: Task document
    AttachToEntity --> AttachToEquipment: Equipment document
    AttachToEntity --> AttachToAction: Action document
    AttachToEntity --> StandaloneDocument: No attachment
    
    AttachToTask --> RequiresApproval: Check if needs approval
    RequiresApproval --> AwaitApproval: Yes
    RequiresApproval --> DocumentAvailable: No
    
    AwaitApproval --> ReviewDocument: Manager reviews
    ReviewDocument --> ApproveDocument: Approved
    ReviewDocument --> RejectDocument: Rejected
    
    ApproveDocument --> DocumentAvailable
    RejectDocument --> NotifyUploader
    
    AttachToEquipment --> DocumentAvailable
    AttachToAction --> DocumentAvailable
    StandaloneDocument --> DocumentAvailable
    
    DocumentAvailable --> [*]
```

## 6. Notification System Flow

```mermaid
stateDiagram-v2
    [*] --> EventOccurs
    
    EventOccurs --> DetermineEventType
    
    DetermineEventType --> UserEvent: User-related
    DetermineEventType --> TaskEvent: Task-related
    DetermineEventType --> ActionEvent: Action-related
    DetermineEventType --> EquipmentEvent: Equipment-related
    DetermineEventType --> SystemEvent: System-related
    
    UserEvent --> AccountActivation
    UserEvent --> ProfileUpdate
    
    TaskEvent --> TaskAssigned
    TaskEvent --> TaskStatusChanged
    TaskEvent --> TaskCommentAdded
    TaskEvent --> TaskReview
    
    ActionEvent --> ActionCreated
    ActionEvent --> ActionStatusChanged
    ActionEvent --> ActionDeadlineApproaching
    
    EquipmentEvent --> MaintenanceDue
    EquipmentEvent --> StatusChanged
    EquipmentEvent --> ActivityScheduled
    
    SystemEvent --> ErrorOccurred
    SystemEvent --> BackupCompleted
    
    AccountActivation --> CreateNotification
    ProfileUpdate --> CreateNotification
    TaskAssigned --> CreateNotification
    TaskStatusChanged --> CreateNotification
    TaskCommentAdded --> CreateNotification
    TaskReview --> CreateNotification
    ActionCreated --> CreateNotification
    ActionStatusChanged --> CreateNotification
    ActionDeadlineApproaching --> CreateNotification
    MaintenanceDue --> CreateNotification
    StatusChanged --> CreateNotification
    ActivityScheduled --> CreateNotification
    ErrorOccurred --> CreateNotification
    BackupCompleted --> CreateNotification
    
    CreateNotification --> DetermineRecipients
    DetermineRecipients --> ManagerNotification: Manager
    DetermineRecipients --> ResponsibleNotification: Responsible person
    DetermineRecipients --> SystemAdminNotification: System admin
    DetermineRecipients --> TeamNotification: Team members
    
    ManagerNotification --> DeliverNotification
    ResponsibleNotification --> DeliverNotification
    SystemAdminNotification --> DeliverNotification
    TeamNotification --> DeliverNotification
    
    DeliverNotification --> InAppNotification: In-app
    DeliverNotification --> EmailNotification: Email
    DeliverNotification --> PushNotification: Mobile push
    
    InAppNotification --> MarkAsDelivered
    EmailNotification --> MarkAsDelivered
    PushNotification --> MarkAsDelivered
    
    MarkAsDelivered --> AwaitRead
    AwaitRead --> MarkAsRead: User reads
    MarkAsRead --> [*]
```

## Key Workflows Explanation

### 1. User Authentication and Registration

- New users are created only by Managers (except first system user)
- Account activation requires email verification
- First-time login requires password change
- JWT tokens are used for authentication

### 2. Task Management

- Tasks can be personal or generated from Actions
- Status workflow: Todo → In Progress → In Review → Done
- Tasks can have comments, files, and subtasks
- Tasks requiring validation need manager approval
- Completed tasks are archived after a time threshold

### 3. Equipment Management

- Equipment creation restricted to Manager and Chef de base roles
- Equipment has various statuses (Available, In Use, Maintenance, etc.)
- Activities are scheduled with conflict detection
- Maintenance activities can only be managed by Resp. Maintenance

### 4. Action Management

- Actions can be project-specific or global
- Actions generate tasks for different responsible parties
- Action workflow includes validation by manager
- Actions can have hierarchical relationships

### 5. Document Management

- Documents can be attached to various entities
- Some documents require approval
- Storage uses Cloudinary for cloud-based storage
- Documents have metadata and access control

### 6. Notification System

- Notifications triggered by various system events
- Multiple delivery channels (in-app, email, push)
- Different recipients based on event type and role
- Read status tracking 