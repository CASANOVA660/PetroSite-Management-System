export interface Participant {
    id: string;
    name: string;
    avatar: string;
}

export interface ExternalParticipant {
    name: string;
    email: string;
}

export interface Note {
    id: string;
    text: string;
    date: Date;
}

export interface Attachment {
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
}

export interface Reunion {
    id: string;
    title: string;
    date: Date;
    description: string;
    participants: Participant[];
    notes?: Note[];
    attachments?: Attachment[];
    meetLink?: string;
    externalParticipants?: ExternalParticipant[];
    projectId?: string;
    projectName?: string;
} 