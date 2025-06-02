@startuml "Petroleum Management System - Sprint 2 Class Diagram"

' Style settings
skinparam classAttributeIconSize 0
skinparam monochrome false
skinparam shadowing false
skinparam linetype ortho
skinparam classBackgroundColor #F8F9FA
skinparam classBorderColor #DEE2E6
skinparam arrowColor #6C757D

' Title
title Petroleum Management System - Sprint 2 Class Diagram

class Project {
    +_id: ObjectId
    +name: String
    +projectNumber: String
    +clientName: String
    +description: String
    +startDate: Date
    +endDate: Date
    +status: String
    +statusNote: String
    +categories: String[]
    +equipment: EquipmentReference[]
    +employees: EmployeeReference[]
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +updateStatus()
    +assignEquipment()
    +assignEmployee()
    +calculateProgress()
    +generateReport()
}

class Requirement {
    +_id: ObjectId
    +projectId: ObjectId
    +title: String
    +description: String
    +priority: String
    +status: String
    +dueDate: Date
    +assignedTo: ObjectId
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +setPriority()
    +updateStatus()
    +assignToEmployee()
    +trackProgress()
}

class Shift {
    +_id: ObjectId
    +projectId: ObjectId
    +employeeId: ObjectId
    +date: Date
    +type: String
    +startTime: String
    +endTime: String
    +status: String
    +notes: String
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +markCompleted()
    +markAbsent()
    +calculateHours()
    +generateShiftReport()
}

class OperationEquipment {
    +_id: ObjectId
    +projectId: ObjectId
    +equipmentId: ObjectId
    +status: String
    +location: String
    +maintenanceDate: Date
    +assignedTo: ObjectId
    +notes: String
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +changeStatus()
    +scheduleMaintenance()
    +assignToEmployee()
    +relocate()
    +trackUsage()
}

class DailyReport {
    +_id: ObjectId
    +projectId: ObjectId
    +date: Date
    +activities: Activity[]
    +equipmentUsed: EquipmentUsage[]
    +healthAndSafety: HealthAndSafety
    +weatherConditions: String
    +challenges: String
    +solutions: String
    +notes: String
    +attachments: Attachment[]
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +addActivity()
    +recordEquipmentUsage()
    +recordSafetyIncident()
    +attachFile()
    +generateSummary()
}

class EmployeeAttendance {
    +_id: ObjectId
    +projectId: ObjectId
    +employeeId: ObjectId
    +date: Date
    +status: String
    +checkInTime: String
    +checkOutTime: String
    +totalHours: Number
    +notes: String
    +recordedBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +checkIn()
    +checkOut()
    +calculateHours()
    +markAbsent()
    +markLate()
    +markExcused()
}

class OperationProgress {
    +_id: ObjectId
    +projectId: ObjectId
    +date: Date
    +milestone: String
    +plannedProgress: Number
    +actualProgress: Number
    +variance: Number
    +status: String
    +challenges: String
    +actions: String
    +notes: String
    +attachments: Attachment[]
    +updatedBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +calculateVariance()
    +determineStatus()
    +trackMilestone()
    +identifyChallenges()
    +proposeActions()
    +attachEvidence()
}

class Activity {
    +description: String
    +startTime: String
    +endTime: String
    +status: String
    
    +calculateDuration()
    +updateStatus()
}

class EquipmentUsage {
    +equipmentId: ObjectId
    +hoursUsed: Number
    +notes: String
    
    +recordHours()
    +addNotes()
}

class HealthAndSafety {
    +incidents: Number
    +nearMisses: Number
    +safetyMeetingHeld: Boolean
    +notes: String
    
    +recordIncident()
    +recordNearMiss()
    +toggleSafetyMeeting()
    +addNotes()
}

class Attachment {
    +name: String
    +path: String
    +type: String
    
    +getUrl()
    +getSize()
    +getType()
}

class Equipment {
    +_id: ObjectId
    +nom: String
    +reference: String
    +status: String
    +type: String
    +location: String
    
    +changeStatus()
    +assignToProject()
    +scheduleMaintenance()
    +relocate()
    +trackUsageHistory()
}

class Employee {
    +_id: ObjectId
    +name: String
    +email: String
    +phone: String
    +position: String
    +department: String
    +profileImage: String
    
    +assignToProject()
    +updatePosition()
    +calculateWorkHours()
    +trackAttendance()
    +evaluatePerformance()
}

class Budget {
    +_id: ObjectId
    +projectId: ObjectId
    +title: String
    +description: String
    +amount: Number
    +type: String
    +category: String
    +date: Date
    +status: String
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +calculateTotal()
    +calculateSpent()
    +calculateRemaining()
    +allocateFunds()
    +trackExpenses()
    +generateFinancialReport()
}

class Document {
    +_id: ObjectId
    +projectId: ObjectId
    +name: String
    +description: String
    +category: String
    +filePath: String
    +fileType: String
    +fileSize: Number
    +uploadedBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +download()
    +share()
    +categorize()
    +generateUrl()
    +checkPermissions()
}

class Action {
    +_id: ObjectId
    +title: String
    +description: String
    +projectId: ObjectId
    +status: String
    +priority: String
    +dueDate: Date
    +assignedTo: ObjectId
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +changeStatus()
    +setPriority()
    +assignToEmployee()
    +trackProgress()
    +setReminder()
    +linkToRequirement()
}

class Plan {
    +_id: ObjectId
    +projectId: ObjectId
    +title: String
    +description: String
    +startDate: Date
    +endDate: Date
    +tasks: Task[]
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +addTask()
    +removeTask()
    +calculateProgress()
    +calculateDuration()
    +identifyCriticalPath()
    +generateGanttChart()
}

class Task {
    +_id: ObjectId
    +title: String
    +description: String
    +startDate: Date
    +endDate: Date
    +status: String
    +assignedTo: ObjectId
    +dependencies: ObjectId[]
    
    +changeStatus()
    +assignToEmployee()
    +addDependency()
    +removeDependency()
    +calculateDuration()
    +checkDependencies()
}

class KPI {
    +_id: ObjectId
    +name: String
    +description: String
    +category: String
    +formula: String
    +unit: String
    +target: Number
    +actual: Number
    +status: String
    +projectId: ObjectId
    +createdBy: ObjectId
    +isDeleted: Boolean
    +timestamps: Boolean
    
    +calculateValue()
    +evaluateStatus()
    +compareToTarget()
    +trackTrend()
    +generateVisualization()
    +setThresholds()
}

' Relationships

' Project Relationships
Project "1" *-- "many" Requirement : has >
Project "1" *-- "many" Shift : has >
Project "1" *-- "many" OperationEquipment : has >
Project "1" *-- "many" DailyReport : has >
Project "1" *-- "many" EmployeeAttendance : has >
Project "1" *-- "many" OperationProgress : has >
Project "1" *-- "many" Budget : has >
Project "1" *-- "many" Document : has >
Project "1" *-- "many" Action : has >
Project "1" *-- "many" Plan : has >
Project "1" *-- "many" KPI : has >

' Project References
Project "many" o-- "many" Equipment : references >
Project "many" o-- "many" Employee : references >

' Operation Relationships
DailyReport "1" *-- "many" Activity : contains >
DailyReport "1" *-- "many" EquipmentUsage : contains >
DailyReport "1" *-- "1" HealthAndSafety : contains >
DailyReport "1" *-- "many" Attachment : contains >
OperationProgress "1" *-- "many" Attachment : contains >

' Equipment Relationships
OperationEquipment "many" --> "1" Equipment : references >
EquipmentUsage "many" --> "1" Equipment : references >

' Employee Relationships
Shift "many" --> "1" Employee : assigned to >
EmployeeAttendance "many" --> "1" Employee : tracks >
OperationEquipment "many" --> "0..1" Employee : assigned to >
Requirement "many" --> "0..1" Employee : assigned to >
Action "many" --> "0..1" Employee : assigned to >
Task "many" --> "0..1" Employee : assigned to >

' Planning Relationships
Plan "1" *-- "many" Task : contains >
Task "many" --> "many" Task : depends on >

@enduml 