// Chat types
export interface User {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
}

export interface Attachment {
    url: string;
    type: 'image' | 'document' | 'video' | 'audio';
    filename: string;
    size?: number;
}

export interface Message {
    _id: string;
    chat: string;
    sender: User;
    content: string;
    readBy: string[];
    attachments?: Attachment[];
    createdAt: string;
    updatedAt: string;
}

export interface Chat {
    _id: string;
    title: string | null;
    isGroup: boolean;
    participants: User[];
    admin: User;
    lastMessage?: Message;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

// State types
export interface ChatState {
    chats: Chat[];
    selectedChat: Chat | null;
    messages: {
        [chatId: string]: {
            data: Message[];
            pagination: {
                page: number;
                pages: number;
                total: number;
            };
        };
    };
    loading: {
        chats: boolean;
        messages: boolean;
        operations: boolean;
    };
    typing: {
        [chatId: string]: string[];
    };
    mutedChats: string[]; // IDs of chats with muted notifications
    error: string | null;
} 