@startuml "Petroleum Management System - Use Case Diagram"

' Style settings
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseStyle roundbox
skinparam shadowing false
skinparam handwritten false
skinparam actorBorderColor #073B4C
skinparam usecaseBorderColor #06D6A0
skinparam arrowColor #073B4C
skinparam backgroundColor #FFFFFF
skinparam nodesep 80
skinparam ranksep 100
skinparam noteBackgroundColor #FFE0B2
skinparam noteBorderColor #FF9800

' Left to right direction for better layout
left to right direction

' Title
title Petroleum Management System - Use Case Diagram

' Actors - all aligned on the left
actor "Manager" as Manager
actor "Base Chief" as BaseChief
actor "HR Personnel" as HR
actor "Field Operator" as FieldOperator
actor "Database" as DB <<system>>

' Authentication
rectangle "Authentication" {
  usecase "Login" as Login
  usecase "Verify Credentials" as VerifyCredentials
  usecase "Manage Session" as ManageSession
  usecase "Reset Password" as ResetPassword
  
  Login ..> VerifyCredentials : <<include>>
  Login ..> ManageSession : <<include>>
  ResetPassword ..> VerifyCredentials : <<include>>
  
  ' Level 3 relationships
  usecase "Check Username" as CheckUsername
  usecase "Validate Password" as ValidatePassword
  usecase "Check 2FA" as Check2FA
  
  VerifyCredentials ..> CheckUsername : <<include>>
  VerifyCredentials ..> ValidatePassword : <<include>>
  VerifyCredentials ..> Check2FA : <<include>>
  
  usecase "Create Token" as CreateToken
  usecase "Track Activity" as TrackActivity
  
  ManageSession ..> CreateToken : <<include>>
  ManageSession ..> TrackActivity : <<include>>
  
  note bottom of Login
    Session timeout after 30 minutes 
    of inactivity
  end note
  
  note right of ResetPassword
    Requires email verification
    and security questions
  end note
}

' Project Management
rectangle "Project Management" {
  usecase "Manage Project" as ManageProject
  usecase "Create Project" as CreateProject
  usecase "View Project" as ViewProject
  usecase "Update Project" as UpdateProject
  usecase "Delete Project" as DeleteProject
  usecase "Manage Project Files" as ManageFiles
  usecase "Manage Project Planning" as ManagePlanning
  usecase "Manage Project Budget" as ManageBudget
  
  CreateProject ..> ManageProject : <<extend>>
  ViewProject ..> ManageProject : <<extend>>
  UpdateProject ..> ManageProject : <<extend>>
  DeleteProject ..> ManageProject : <<extend>>
  ManageFiles ..> ManageProject : <<extend>>
  ManagePlanning ..> ManageProject : <<extend>>
  ManageBudget ..> ManageProject : <<extend>>
  
  ' Level 3 relationships
  usecase "Define Project Details" as DefineProjectDetails
  usecase "Assign Project Team" as AssignProjectTeam
  
  CreateProject ..> DefineProjectDetails : <<include>>
  CreateProject ..> AssignProjectTeam : <<include>>
  
  usecase "Generate Project Reports" as GenerateProjectReports
  usecase "Export Project Data" as ExportProjectData
  
  ViewProject ..> GenerateProjectReports : <<extend>>
  ViewProject ..> ExportProjectData : <<extend>>
  
  usecase "Upload File" as UploadProjectFile
  usecase "Categorize File" as CategorizeFile
  
  ManageFiles ..> UploadProjectFile : <<include>>
  ManageFiles ..> CategorizeFile : <<include>>
  
  usecase "Create Task" as CreateTask
  usecase "Set Milestones" as SetMilestones
  
  ManagePlanning ..> CreateTask : <<include>>
  ManagePlanning ..> SetMilestones : <<include>>
  
  note right of DeleteProject
    Cannot delete projects that are
    in operation status
  end note
  
  note bottom of CreateProject
    Project number must be unique
    and follow PET-YYYY-XXXX format
  end note
  
  note right of ManageFiles
    Maximum file size: 50MB
    Allowed formats: PDF, DOC, XLS, JPG, PNG
  end note
  
  note bottom of ManageBudget
    Budget changes require
    Manager approval
  end note
}

' Project Operation
rectangle "Project Operation" {
  usecase "Manage Operations" as ManageOperations
  usecase "Select Equipment" as SelectEquipment
  usecase "Select Employees" as SelectEmployees
  usecase "Manage Daily Reports" as ManageDailyReports
  usecase "Track Employee Attendance" as TrackAttendance
  usecase "Manage Operation Progress" as ManageProgress
  usecase "Manage Operation Equipment" as ManageOperationEquipment
  usecase "Manage Shifts" as ManageShifts
  
  SelectEquipment ..> ManageOperations : <<extend>>
  SelectEmployees ..> ManageOperations : <<extend>>
  ManageDailyReports ..> ManageOperations : <<extend>>
  TrackAttendance ..> ManageOperations : <<extend>>
  ManageProgress ..> ManageOperations : <<extend>>
  ManageOperationEquipment ..> ManageOperations : <<extend>>
  ManageShifts ..> ManageOperations : <<extend>>
  
  usecase "Record Attendance" as RecordAttendance
  usecase "Generate Attendance Report" as GenerateAttendanceReport
  
  RecordAttendance ..> TrackAttendance : <<extend>>
  GenerateAttendanceReport ..> TrackAttendance : <<extend>>
  
  usecase "Assign Equipment" as AssignEquipment
  usecase "Schedule Maintenance" as ScheduleMaintenance
  
  AssignEquipment ..> ManageOperationEquipment : <<extend>>
  ScheduleMaintenance ..> ManageOperationEquipment : <<extend>>
  
  ' Level 3 relationships
  usecase "Check Equipment Availability" as CheckEquipmentAvailability
  usecase "Verify Equipment Condition" as VerifyEquipmentCondition
  
  SelectEquipment ..> CheckEquipmentAvailability : <<include>>
  SelectEquipment ..> VerifyEquipmentCondition : <<include>>
  
  usecase "Check Employee Availability" as CheckEmployeeAvailability
  usecase "Verify Employee Qualifications" as VerifyEmployeeQualifications
  
  SelectEmployees ..> CheckEmployeeAvailability : <<include>>
  SelectEmployees ..> VerifyEmployeeQualifications : <<include>>
  
  usecase "Create Report Entry" as CreateReportEntry
  usecase "Attach Supporting Documents" as AttachSupportingDocuments
  
  ManageDailyReports ..> CreateReportEntry : <<include>>
  ManageDailyReports ..> AttachSupportingDocuments : <<include>>
  
  usecase "Check In" as CheckIn
  usecase "Check Out" as CheckOut
  
  RecordAttendance ..> CheckIn : <<include>>
  RecordAttendance ..> CheckOut : <<include>>
  
  usecase "Filter By Date" as FilterByDate
  usecase "Filter By Employee" as FilterByEmployee
  
  GenerateAttendanceReport ..> FilterByDate : <<include>>
  GenerateAttendanceReport ..> FilterByEmployee : <<include>>
  
  note right of SelectEquipment
    Requires Base Chief confirmation
  end note
  
  note bottom of ManageDailyReports
    Reports must be submitted
    by end of shift
  end note
  
  note right of TrackAttendance
    Attendance records cannot be
    modified after 48 hours
  end note
  
  note bottom of ManageShifts
    Maximum 12 hours per shift
    Minimum 8 hours rest between shifts
  end note
  
  note right of SelectEmployees
    Employees must have valid
    certifications for their roles
  end note
}

' HR Management
rectangle "HR Management" {
  usecase "Manage HR Functions" as ManageHRFunctions
  usecase "Create Employee" as CreateEmployee
  usecase "View Employee" as ViewEmployee
  usecase "Update Employee" as UpdateEmployee
  usecase "Delete Employee" as DeleteEmployee
  usecase "Create Employee Folder" as CreateEmployeeFolder
  usecase "Manage Employee Documents" as ManageEmployeeDocuments
  
  CreateEmployee ..> ManageHRFunctions : <<extend>>
  ViewEmployee ..> ManageHRFunctions : <<extend>>
  UpdateEmployee ..> ManageHRFunctions : <<extend>>
  DeleteEmployee ..> ManageHRFunctions : <<extend>>
  CreateEmployeeFolder ..> ManageHRFunctions : <<extend>>
  ManageEmployeeDocuments ..> ManageHRFunctions : <<extend>>
  
  usecase "Upload Document" as UploadDocument
  usecase "Share Document" as ShareDocument
  
  UploadDocument ..> ManageEmployeeDocuments : <<extend>>
  ShareDocument ..> ManageEmployeeDocuments : <<extend>>
  
  ' Level 3 relationships
  usecase "Enter Personal Details" as EnterPersonalDetails
  usecase "Assign Employee ID" as AssignEmployeeID
  usecase "Set Access Rights" as SetAccessRights
  
  CreateEmployee ..> EnterPersonalDetails : <<include>>
  CreateEmployee ..> AssignEmployeeID : <<include>>
  CreateEmployee ..> SetAccessRights : <<include>>
  
  usecase "View Employment History" as ViewEmploymentHistory
  usecase "View Performance Records" as ViewPerformanceRecords
  
  ViewEmployee ..> ViewEmploymentHistory : <<extend>>
  ViewEmployee ..> ViewPerformanceRecords : <<extend>>
  
  usecase "Select Document Type" as SelectDocumentType
  usecase "Set Document Expiry" as SetDocumentExpiry
  
  UploadDocument ..> SelectDocumentType : <<include>>
  UploadDocument ..> SetDocumentExpiry : <<include>>
  
  usecase "Set Permission Level" as SetPermissionLevel
  usecase "Notify Recipients" as NotifyRecipients
  
  ShareDocument ..> SetPermissionLevel : <<include>>
  ShareDocument ..> NotifyRecipients : <<include>>
  
  note bottom of CreateEmployee
    Required fields: Name, ID number,
    Position, Department, Contact info
  end note
  
  note right of DeleteEmployee
    Employee records are archived,
    not permanently deleted
  end note
  
  note bottom of ManageEmployeeDocuments
    Confidential documents
    require special access rights
  end note
}

' Equipment Management
rectangle "Equipment Management" {
  usecase "Manage Equipment Functions" as ManageEquipmentFunctions
  usecase "Create Equipment" as CreateEquipment
  usecase "View Equipment" as ViewEquipment
  usecase "Update Equipment" as UpdateEquipment
  usecase "Delete Equipment" as DeleteEquipment
  usecase "Manage Equipment Maintenance" as ManageEquipmentMaintenance
  
  CreateEquipment ..> ManageEquipmentFunctions : <<extend>>
  ViewEquipment ..> ManageEquipmentFunctions : <<extend>>
  UpdateEquipment ..> ManageEquipmentFunctions : <<extend>>
  DeleteEquipment ..> ManageEquipmentFunctions : <<extend>>
  ManageEquipmentMaintenance ..> ManageEquipmentFunctions : <<extend>>
  
  usecase "Schedule Maintenance Task" as ScheduleMaintenanceTask
  usecase "Record Maintenance History" as RecordMaintenanceHistory
  
  ScheduleMaintenanceTask ..> ManageEquipmentMaintenance : <<extend>>
  RecordMaintenanceHistory ..> ManageEquipmentMaintenance : <<extend>>
  
  ' Level 3 relationships
  usecase "Enter Equipment Details" as EnterEquipmentDetails
  usecase "Assign Equipment ID" as AssignEquipmentID
  usecase "Set Equipment Category" as SetEquipmentCategory
  
  CreateEquipment ..> EnterEquipmentDetails : <<include>>
  CreateEquipment ..> AssignEquipmentID : <<include>>
  CreateEquipment ..> SetEquipmentCategory : <<include>>
  
  usecase "View Maintenance History" as ViewMaintenanceHistory
  usecase "Check Equipment Status" as CheckEquipmentStatus
  
  ViewEquipment ..> ViewMaintenanceHistory : <<extend>>
  ViewEquipment ..> CheckEquipmentStatus : <<extend>>
  
  usecase "Assign Maintenance Team" as AssignMaintenanceTeam
  usecase "Set Maintenance Priority" as SetMaintenancePriority
  
  ScheduleMaintenanceTask ..> AssignMaintenanceTeam : <<include>>
  ScheduleMaintenanceTask ..> SetMaintenancePriority : <<include>>
  
  usecase "Document Parts Used" as DocumentPartsUsed
  usecase "Record Technician Notes" as RecordTechnicianNotes
  
  RecordMaintenanceHistory ..> DocumentPartsUsed : <<include>>
  RecordMaintenanceHistory ..> RecordTechnicianNotes : <<include>>
  
  note bottom of CreateEquipment
    Equipment must have unique
    identification number and type
  end note
  
  note right of ManageEquipmentMaintenance
    Maintenance schedule based on
    manufacturer recommendations
    and usage history
  end note
  
  note bottom of DeleteEquipment
    Cannot delete equipment
    currently assigned to projects
  end note
}

' System-wide constraints
note as SystemConstraints
  <b>System-wide Constraints</b>
  - All data modifications are logged with timestamp and user
  - System must be available 24/7 with 99.9% uptime
  - Regular backups performed every 6 hours
  - All sensitive data must be encrypted
end note

' Relationships - Authentication
Manager --> Login
BaseChief --> Login
HR --> Login
FieldOperator --> Login
Login --> DB

' Relationships - Project Management
Manager --> ManageProject

' Relationships - Project Operation
Manager --> ManageOperations
BaseChief --> SelectEquipment
BaseChief --> ManageDailyReports
BaseChief --> ManageOperationEquipment

FieldOperator --> TrackAttendance
FieldOperator --> ManageDailyReports
FieldOperator --> ManageShifts

' Relationships - HR Management
HR --> ManageHRFunctions
Manager --> ViewEmployee

' Relationships - Equipment Management
Manager --> ManageEquipmentFunctions
BaseChief --> ViewEquipment
BaseChief --> ManageEquipmentMaintenance

' Database Interactions
Login --> DB
ManageProject --> DB
ManageOperations --> DB
ManageHRFunctions --> DB
ManageEquipmentFunctions --> DB

@enduml 