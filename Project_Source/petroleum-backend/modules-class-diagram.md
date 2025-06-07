# Petroleum Backend Modules Class Diagram

This document provides class diagrams for the following modules:
- Meet Module
- RAG Module
- Chat Module
- Notifications Module

## Meet Module

```mermaid
classDiagram
    class Meet {
        +String title
        +String description
        +Date date
        +Number duration
        +String meetLink
        +String googleCalendarEventId
        +String calendarEventId
        +String calendarLink
        +ObjectId creator
        +ObjectId[] participants
        +ExternalParticipant[] externalParticipants
        +Note[] notes
        +Attachment[] attachments
        +ObjectId projectId
        +String status
        +Date createdAt
        +Date updatedAt
    }
    
    class ExternalParticipant {
        +String name
        +String email
        +String organization
    }
    
    class Note {
        +String text
        +Date createdAt
        +ObjectId createdBy
    }
    
    class Attachment {
        +String name
        +String size
        +String type
        +String url
        +Date uploadedAt
        +ObjectId uploadedBy
    }
    
    Meet *-- ExternalParticipant : contains
    Meet *-- Note : contains
    Meet *-- Attachment : contains
    Meet --> "1" User : creator
    Meet --> "*" User : participants
    Meet --> "0..1" Project : belongs to
```

## RAG Module (Retrieval-Augmented Generation)

```mermaid
classDiagram
    class RagDocument {
        +String title
        +String description
        +String fileType
        +String source
        +ObjectId uploadedBy
        +Object file
        +String processingStatus
        +String processingError
        +Number chunkCount
        +Map metadata
        +Date lastProcessed
        +Date createdAt
        +Date updatedAt
    }
    
    class DocumentChunk {
        +ObjectId document
        +Number chunkIndex
        +String content
        +Object metadata
        +Map embedding
        +String vectorId
        +String vectorDbSource
        +String vectorStatus
        +String embeddingModel
        +Date createdAt
        +Date updatedAt
    }
    
    class RagChat {
        +String title
        +ObjectId user
        +ObjectId lastMessage
        +String context
        +ObjectId[] documents
        +Object settings
        +Map metadata
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }
    
    class RagMessage {
        +ObjectId chat
        +String content
        +String role
        +Object[] sources
        +Object metadata
        +Object error
        +Date createdAt
        +Date updatedAt
    }
    
    RagDocument --> "1" User : uploadedBy
    RagDocument "1" <-- "*" DocumentChunk : belongs to
    RagChat --> "1" User : belongs to
    RagChat --> "*" RagDocument : references
    RagChat "1" <-- "*" RagMessage : belongs to
    RagMessage --> "*" RagDocument : references sources
```

## Chat Module

```mermaid
classDiagram
    class Chat {
        +String title
        +Boolean isGroup
        +Object groupPicture
        +ObjectId[] participants
        +ObjectId admin
        +ObjectId lastMessage
        +Date createdAt
        +Date updatedAt
    }
    
    class Message {
        +ObjectId chat
        +ObjectId sender
        +String content
        +ObjectId[] readBy
        +Object[] attachments
        +Date createdAt
        +Date updatedAt
    }
    
    Chat --> "*" User : participants
    Chat --> "1" User : admin
    Chat --> "0..1" Message : lastMessage
    Message --> "1" Chat : belongs to
    Message --> "1" User : sender
    Message --> "*" User : readBy
```

## Notifications Module

```mermaid
classDiagram
    class Notification {
        +String type
        +String message
        +ObjectId userId
        +Boolean isRead
        +Object metadata
        +Date createdAt
    }
    
    Notification --> "1" User : belongs to
```

## Cross-Module Relationships

```mermaid
classDiagram
    User "1" <-- "*" Meet : creates
    User "*" <-- "*" Meet : participates in
    User "1" <-- "*" RagDocument : uploads
    User "1" <-- "*" RagChat : owns
    User "*" <-- "*" Chat : participates in
    User "1" <-- "*" Chat : administers
    User "1" <-- "*" Message : sends
    User "1" <-- "*" Notification : receives
    
    Project "1" <-- "*" Meet : contains
```

Note: This diagram shows the main entities and their relationships. The actual implementation may include additional methods, validators, and middleware that are not represented here. 