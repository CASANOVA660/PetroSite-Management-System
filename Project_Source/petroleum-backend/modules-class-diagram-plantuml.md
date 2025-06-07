# Petroleum Backend Modules Class Diagram (PlantUML)

This document provides PlantUML class diagrams for the following modules:
- Meet Module
- RAG Module
- Chat Module
- Notifications Module

## Meet Module

```plantuml
@startuml Meet Module

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
  +String status
  +Date createdAt
  +Date updatedAt
  +createMeet(meetData)
  +updateMeet(meetId, updateData)
  +deleteMeet(meetId)
  +getMeetById(meetId)
  +getUserMeets(userId)
  +addParticipant(meetId, userId)
  +removeParticipant(meetId, userId)
  +addExternalParticipant(meetId, participantData)
  +addNote(meetId, noteData)
  +addAttachment(meetId, attachmentData)
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

class User {
  +String name
  +String email
}

class Project {
  +String name
  +String description
}

Meet "1" *-- "0..*" ExternalParticipant : contains
Meet "1" *-- "0..*" Note : contains
Meet "1" *-- "0..*" Attachment : contains
Meet "0..*" --> "1" User : creator
Meet "0..*" --> "0..*" User : participants
Meet "0..*" --> "0..1" Project : belongs to

@enduml
```

## RAG Module (Retrieval-Augmented Generation)

```plantuml
@startuml RAG Module

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
  +uploadDocument(fileData, metadata)
  +processDocument(documentId)
  +getDocumentById(documentId)
  +getUserDocuments(userId)
  +updateDocumentMetadata(documentId, metadata)
  +deleteDocument(documentId)
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
  +createChunk(chunkData)
  +getChunksByDocumentId(documentId)
  +updateEmbedding(chunkId, embeddingData)
  +searchSimilarChunks(query, options)
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
  +createChat(chatData)
  +getChatById(chatId)
  +getUserChats(userId)
  +updateChatSettings(chatId, settings)
  +addDocumentToChat(chatId, documentId)
  +removeDocumentFromChat(chatId, documentId)
  +deleteChat(chatId)
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
  +createMessage(messageData)
  +getMessagesByChatId(chatId)
  +generateAIResponse(chatId, userMessage)
  +retrieveRelevantSources(content)
}

class User {
  +String name
  +String email
}

RagDocument "1" *-- "0..*" DocumentChunk : contains
RagDocument "0..*" --> "1" User : uploadedBy
RagChat "0..*" o-- "0..*" RagDocument : references
RagChat "0..*" --> "1" User : belongs to
RagChat "1" *-- "0..*" RagMessage : contains
RagMessage "0..*" o-- "0..*" RagDocument : references sources

@enduml
```

## Chat Module

```plantuml
@startuml Chat Module

class Chat {
  +String title
  +Boolean isGroup
  +Object groupPicture
  +ObjectId[] participants
  +ObjectId admin
  +ObjectId lastMessage
  +Date createdAt
  +Date updatedAt
  +createChat(chatData)
  +getChatById(chatId)
  +getUserChats(userId)
  +addParticipant(chatId, userId)
  +removeParticipant(chatId, userId)
  +updateGroupInfo(chatId, updateData)
  +deleteChat(chatId)
}

class Message {
  +ObjectId chat
  +ObjectId sender
  +String content
  +ObjectId[] readBy
  +Object[] attachments
  +Date createdAt
  +Date updatedAt
  +sendMessage(messageData)
  +getMessagesByChatId(chatId)
  +markAsRead(messageId, userId)
  +addAttachment(messageId, attachmentData)
  +deleteMessage(messageId)
}

class User {
  +String name
  +String email
}

Chat "1" *-- "0..*" Message : contains
Chat "0..*" --> "2..*" User : participants
Chat "0..*" --> "1" User : admin
Chat "0..*" --> "0..1" Message : lastMessage
Message "0..*" --> "1" Chat : belongs to
Message "0..*" --> "1" User : sender
Message "0..*" --> "0..*" User : readBy

@enduml
```

## Notifications Module

```plantuml
@startuml Notifications Module

class Notification {
  +String type
  +String message
  +ObjectId userId
  +Boolean isRead
  +Object metadata
  +Date createdAt
  +createNotification(notificationData)
  +getUserNotifications(userId)
  +markAsRead(notificationId)
  +markAllAsRead(userId)
  +deleteNotification(notificationId)
}

class User {
  +String name
  +String email
}

Notification "0..*" --> "1" User : belongs to

@enduml
```

## Cross-Module Relationships

```plantuml
@startuml Cross-Module Relationships

class User {
  +String name
  +String email
  +String password
  +String role
  +Boolean isActive
  +Date createdAt
}

class Project {
  +String name
  +String description
  +ObjectId owner
  +ObjectId[] members
  +Date createdAt
}

class Meet {
}

class RagDocument {
}

class RagChat {
}

class Chat {
}

class Message {
}

class Notification {
}

User "1" <-- "0..*" Meet : creates
User "0..*" <-- "0..*" Meet : participates in
User "1" <-- "0..*" RagDocument : uploads
User "1" <-- "0..*" RagChat : owns
User "2..*" <-- "0..*" Chat : participates in
User "1" <-- "0..*" Chat : administers
User "1" <-- "0..*" Message : sends
User "1" <-- "0..*" Notification : receives

Project "0..1" o-- "0..*" Meet : contains

@enduml
```

Note: 
- Composition relationships (*--) indicate strong ownership where the child cannot exist without the parent
- Aggregation relationships (o--) indicate a weaker "has-a" relationship where the child can exist independently
- Association relationships (-->) indicate that classes are related but neither owns the other
- Cardinality notation:
  - "0..1": Zero or one
  - "1": Exactly one
  - "0..*": Zero or many
  - "1..*": One or many
  - "2..*": Two or many (e.g., for chat participants) 