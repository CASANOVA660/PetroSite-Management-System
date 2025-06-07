import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';
import { RootState } from '..';

// Types
export interface RagMessage {
    _id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
    sources?: {
        documentId: string;
        title: string;
        content: string;
    }[];
}

export interface RagChat {
    _id: string;
    title: string;
    user: string;
    createdAt: string;
    updatedAt: string;
    messages?: RagMessage[];
    context?: string;
    settings?: {
        temperature?: number;
        model?: string;
        useRag?: boolean;
    };
}

export interface RagDocument {
    _id: string;
    title: string;
    description?: string;
    fileType: string;
    source: string;
    uploadedBy: string;
    file: {
        url: string;
        publicId?: string;
        size?: number;
    };
    processingStatus: 'pending' | 'processing' | 'embedded' | 'failed';
    processingError?: string;
    chunkCount: number;
    createdAt: string;
    updatedAt: string;
}

interface RagState {
    chats: RagChat[];
    currentChat: RagChat | null;
    documents: RagDocument[];
    isTyping: boolean;
    loading: boolean;
    error: string | null;
    uploadProgress: number;
}

const initialState: RagState = {
    chats: [],
    currentChat: null,
    documents: [],
    isTyping: false,
    loading: false,
    error: null,
    uploadProgress: 0
};

// Async thunks
export const createChat = createAsyncThunk(
    'rag/createChat',
    async (chatData: { title?: string; context?: string; settings?: any }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/rag/chat', chatData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
        }
    }
);

export const getChats = createAsyncThunk(
    'rag/getChats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/rag/chats');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
        }
    }
);

export const getChatById = createAsyncThunk(
    'rag/getChatById',
    async (chatId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/rag/chats/${chatId}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat');
        }
    }
);

export const getChatMessages = createAsyncThunk(
    'rag/getChatMessages',
    async (chatId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/rag/chats/${chatId}/messages`);
            return { chatId, messages: response.data.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'rag/sendMessage',
    async (
        { chatId, content }: { chatId: string; content: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // First add user message to state
            dispatch(ragChatSlice.actions.setIsTyping(true));

            // Send message to API
            const response = await axios.post(`/rag/chats/${chatId}/messages`, { content });

            dispatch(ragChatSlice.actions.setIsTyping(false));
            console.log('Response:', response.data);
            return response.data.data;
        } catch (error: any) {
            dispatch(ragChatSlice.actions.setIsTyping(false));
            return rejectWithValue(error.response?.data?.message || 'Failed to send message');
        }
    }
);

// New direct query thunk that doesn't require a chat ID
export const sendQueryDirectly = createAsyncThunk(
    'rag/sendQueryDirectly',
    async (
        { content }: { content: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Set typing indicator
            dispatch(ragChatSlice.actions.setIsTyping(true));

            // Send query to the direct query API endpoint
            const response = await axios.post('/rag/query', { content });
            console.log('Direct query response:', response.data);

            dispatch(ragChatSlice.actions.setIsTyping(false));

            // Return the message object from the response data
            // The API returns { success: true, message: {...} } format
            if (response.data.success && response.data.message) {
                return response.data.message;
            } else if (response.data.error) {
                return rejectWithValue(response.data.error);
            } else {
                return rejectWithValue('Unexpected response format from server');
            }
        } catch (error: any) {
            console.error('Direct query error:', error);
            dispatch(ragChatSlice.actions.setIsTyping(false));
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to send query');
        }
    }
);

export const uploadDocument = createAsyncThunk(
    'rag/uploadDocument',
    async (
        { formData, onProgress }: { formData: FormData; onProgress?: (progress: number) => void },
        { rejectWithValue, dispatch }
    ) => {
        try {
            const response = await axios.post('/rag/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        dispatch(ragChatSlice.actions.setUploadProgress(progress));
                        if (onProgress) onProgress(progress);
                    }
                }
            });

            dispatch(ragChatSlice.actions.setUploadProgress(0));
            return response.data.data;
        } catch (error: any) {
            dispatch(ragChatSlice.actions.setUploadProgress(0));
            return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
        }
    }
);

export const getDocuments = createAsyncThunk(
    'rag/getDocuments',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/rag/documents');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
        }
    }
);

export const deleteDocument = createAsyncThunk(
    'rag/deleteDocument',
    async (documentId: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/rag/documents/${documentId}`);
            return documentId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
        }
    }
);

// Slice
const ragChatSlice = createSlice({
    name: 'ragChat',
    initialState,
    reducers: {
        setIsTyping: (state, action: PayloadAction<boolean>) => {
            state.isTyping = action.payload;
        },
        setUploadProgress: (state, action: PayloadAction<number>) => {
            state.uploadProgress = action.payload;
        },
        resetCurrentChat: (state) => {
            state.currentChat = null;
        },
        addLocalUserMessage: (state, action: PayloadAction<{ chatId: string; content: string }>) => {
            if (state.currentChat && state.currentChat._id === action.payload.chatId) {
                if (!state.currentChat.messages) {
                    state.currentChat.messages = [];
                }
                state.currentChat.messages.push({
                    _id: `temp-${Date.now()}`,
                    content: action.payload.content,
                    role: 'user',
                    createdAt: new Date().toISOString()
                });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Chat
            .addCase(createChat.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createChat.fulfilled, (state, action) => {
                state.loading = false;
                state.chats.unshift(action.payload);
                state.currentChat = action.payload;
            })
            .addCase(createChat.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get Chats
            .addCase(getChats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getChats.fulfilled, (state, action) => {
                state.loading = false;
                state.chats = action.payload;
            })
            .addCase(getChats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get Chat by ID
            .addCase(getChatById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getChatById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentChat = action.payload;

                // Update chat in chats array if it exists
                const index = state.chats.findIndex(chat => chat._id === action.payload._id);
                if (index !== -1) {
                    state.chats[index] = action.payload;
                }
            })
            .addCase(getChatById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get Chat Messages
            .addCase(getChatMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getChatMessages.fulfilled, (state, action) => {
                state.loading = false;
                if (state.currentChat && state.currentChat._id === action.payload.chatId) {
                    state.currentChat.messages = action.payload.messages;
                }
            })
            .addCase(getChatMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Send Message
            .addCase(sendMessage.pending, (state) => {
                state.isTyping = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isTyping = false;

                if (state.currentChat) {
                    if (!state.currentChat.messages) {
                        state.currentChat.messages = [];
                    }

                    // Find if there are any temporary messages and remove them
                    state.currentChat.messages = state.currentChat.messages.filter(
                        (msg: RagMessage) => !msg._id.startsWith('temp-')
                    );

                    // Add the new messages (both user and assistant) - FIXED SPREAD OPERATOR ERROR
                    if (action.payload && Array.isArray(action.payload)) {
                        // If payload is an array, spread it
                        state.currentChat.messages.push(...action.payload);
                    } else if (action.payload) {
                        // If payload is a single object, just push it
                        state.currentChat.messages.push(action.payload);
                    }

                    // Update chat title if it's a new chat
                    if (state.currentChat.title === 'New Chat' && action.payload) {
                        let userMessage = null;

                        if (Array.isArray(action.payload)) {
                            userMessage = action.payload.find((msg: RagMessage) => msg.role === 'user');
                        } else if (action.payload.role === 'user') {
                            userMessage = action.payload;
                        }

                        if (userMessage) {
                            state.currentChat.title = userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : '');

                            // Update in chats list
                            const chatIndex = state.chats.findIndex(chat => chat._id === state.currentChat?._id);
                            if (chatIndex !== -1) {
                                state.chats[chatIndex].title = state.currentChat.title;
                            }
                        }
                    }
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isTyping = false;
                state.error = action.payload as string;
            })

            // Direct Query
            .addCase(sendQueryDirectly.pending, (state) => {
                state.isTyping = true;
                state.error = null;
            })
            .addCase(sendQueryDirectly.fulfilled, (state, action) => {
                state.isTyping = false;

                // If we have a current chat, add the messages to it
                if (state.currentChat) {
                    if (!state.currentChat.messages) {
                        state.currentChat.messages = [];
                    }

                    // Add the query response messages to the current chat
                    if (action.payload && Array.isArray(action.payload)) {
                        state.currentChat.messages.push(...action.payload);
                    } else if (action.payload) {
                        state.currentChat.messages.push(action.payload);
                    }
                }
            })
            .addCase(sendQueryDirectly.rejected, (state, action) => {
                state.isTyping = false;
                state.error = action.payload as string;
            })

            // Upload Document
            .addCase(uploadDocument.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadDocument.fulfilled, (state, action) => {
                state.loading = false;
                state.documents.unshift(action.payload);
            })
            .addCase(uploadDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Get Documents
            .addCase(getDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getDocuments.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(getDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete Document
            .addCase(deleteDocument.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteDocument.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = state.documents.filter(doc => doc._id !== action.payload);
            })
            .addCase(deleteDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setIsTyping, setUploadProgress, resetCurrentChat, addLocalUserMessage } = ragChatSlice.actions;

export const selectRagChats = (state: RootState) => state.ragChat.chats;
export const selectCurrentRagChat = (state: RootState) => state.ragChat.currentChat;
export const selectRagDocuments = (state: RootState) => state.ragChat.documents;
export const selectRagIsTyping = (state: RootState) => state.ragChat.isTyping;
export const selectRagLoading = (state: RootState) => state.ragChat.loading;
export const selectRagError = (state: RootState) => state.ragChat.error;
export const selectRagUploadProgress = (state: RootState) => state.ragChat.uploadProgress;

export default ragChatSlice.reducer; 