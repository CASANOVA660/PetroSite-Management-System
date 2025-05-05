import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chat, ChatState, Message } from '../../types/chat';
import axios from '../../utils/axios';

// Initial state
const initialState: ChatState = {
    chats: [],
    selectedChat: null,
    messages: {},
    loading: {
        chats: false,
        messages: false,
        operations: false
    },
    typing: {},
    error: null
};

// Async thunks
export const fetchChats = createAsyncThunk(
    'chat/fetchChats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/chats');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to fetch chats');
        }
    }
);

export const fetchChatById = createAsyncThunk(
    'chat/fetchChatById',
    async (chatId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/chats/${chatId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to fetch chat');
        }
    }
);

export const createChat = createAsyncThunk(
    'chat/createChat',
    async (data: { title?: string; participants: string[]; isGroup?: boolean; groupPicture?: File } | FormData, { rejectWithValue }) => {
        try {
            let response;

            if (data instanceof FormData) {
                // FormData is already prepared with all necessary fields
                response = await axios.post('/chats', data, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else if (data.groupPicture) {
                // For backwards compatibility - convert object to FormData
                const formData = new FormData();

                // Add chat data
                if (data.title) formData.append('title', data.title);
                formData.append('isGroup', String(!!data.isGroup));

                // Add participants as an array
                data.participants.forEach((participantId, index) => {
                    formData.append(`participants[${index}]`, participantId);
                });

                // Add the file
                formData.append('groupPicture', data.groupPicture);

                response = await axios.post('/chats', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // No file, use regular JSON request
                response = await axios.post('/chats', data);
            }

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to create chat');
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async ({ chatId, page = 1, limit = 50 }: { chatId: string; page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/chats/${chatId}/messages`, {
                params: { page, limit }
            });
            return { chatId, ...response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to fetch messages');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ chatId, content }: { chatId: string; content: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/chats/${chatId}/messages`, { content });
            return { chatId, message: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to send message');
        }
    }
);

export const markChatAsRead = createAsyncThunk(
    'chat/markChatAsRead',
    async (chatId: string, { rejectWithValue }) => {
        try {
            await axios.put(`/chats/${chatId}/read`);
            return chatId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to mark chat as read');
        }
    }
);

export const addParticipant = createAsyncThunk(
    'chat/addParticipant',
    async ({ chatId, participantId }: { chatId: string; participantId: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/chats/${chatId}/participants`, { participantId });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to add participant');
        }
    }
);

export const removeParticipant = createAsyncThunk(
    'chat/removeParticipant',
    async ({ chatId, userId }: { chatId: string; userId: string }, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`/chats/${chatId}/participants/${userId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to remove participant');
        }
    }
);

export const fetchUserByAccountId = createAsyncThunk(
    'chat/fetchUserByAccountId',
    async (accountId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/users/by-account/${accountId}`);
            return { accountId, userData: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data.message || 'Failed to fetch user details');
        }
    }
);

// Create slice
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setSelectedChat: (state, action: PayloadAction<Chat | null>) => {
            state.selectedChat = action.payload;
        },
        addTypingUser: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
            const { chatId, userId } = action.payload;
            if (!state.typing[chatId]) {
                state.typing[chatId] = [];
            }
            if (!state.typing[chatId].includes(userId)) {
                state.typing[chatId].push(userId);
            }
        },
        removeTypingUser: (state, action: PayloadAction<{ chatId: string; userId: string }>) => {
            const { chatId, userId } = action.payload;
            if (state.typing[chatId]) {
                state.typing[chatId] = state.typing[chatId].filter(id => id !== userId);
            }
        },
        receiveMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
            const { chatId, message } = action.payload;

            // Add message to messages list if chat exists
            if (state.messages[chatId]) {
                state.messages[chatId].data.push(message);
                state.messages[chatId].pagination.total += 1;
            }

            // Update chat's last message and unread count
            const chatIndex = state.chats.findIndex(chat => chat._id === chatId);
            if (chatIndex !== -1) {
                state.chats[chatIndex].lastMessage = message;
                // Only increment unread if the message is not from the current user
                if (message.sender._id !== localStorage.getItem('userId')) {
                    state.chats[chatIndex].unreadCount += 1;
                }

                // Move chat to top of list
                const chat = state.chats[chatIndex];
                state.chats.splice(chatIndex, 1);
                state.chats.unshift(chat);
            }
        },
        clearErrors: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch chats
            .addCase(fetchChats.pending, (state) => {
                state.loading.chats = true;
                state.error = null;
            })
            .addCase(fetchChats.fulfilled, (state, action) => {
                state.loading.chats = false;
                state.chats = action.payload;
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.loading.chats = false;
                state.error = action.payload as string;
            })

            // Fetch chat by ID
            .addCase(fetchChatById.pending, (state) => {
                state.loading.chats = true;
                state.error = null;
            })
            .addCase(fetchChatById.fulfilled, (state, action) => {
                state.loading.chats = false;
                state.selectedChat = action.payload;

                // Update chat in chats list
                const index = state.chats.findIndex(chat => chat._id === action.payload._id);
                if (index !== -1) {
                    state.chats[index] = action.payload;
                } else {
                    state.chats.push(action.payload);
                }
            })
            .addCase(fetchChatById.rejected, (state, action) => {
                state.loading.chats = false;
                state.error = action.payload as string;
            })

            // Create chat
            .addCase(createChat.pending, (state) => {
                state.loading.operations = true;
                state.error = null;
            })
            .addCase(createChat.fulfilled, (state, action) => {
                state.loading.operations = false;
                state.chats.unshift(action.payload);
                state.selectedChat = action.payload;
            })
            .addCase(createChat.rejected, (state, action) => {
                state.loading.operations = false;
                state.error = action.payload as string;
            })

            // Fetch messages
            .addCase(fetchMessages.pending, (state) => {
                state.loading.messages = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                const { chatId, messages, pagination } = action.payload;
                state.loading.messages = false;

                if (!state.messages[chatId]) {
                    state.messages[chatId] = {
                        data: [],
                        pagination: {
                            page: 1,
                            pages: 1,
                            total: 0
                        }
                    };
                }

                // If it's the first page, replace messages
                if (pagination.page === 1) {
                    state.messages[chatId].data = messages;
                } else {
                    // Append messages for pagination
                    state.messages[chatId].data = [...state.messages[chatId].data, ...messages];
                }

                state.messages[chatId].pagination = pagination;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading.messages = false;
                state.error = action.payload as string;
            })

            // Send message
            .addCase(sendMessage.pending, (state) => {
                state.loading.operations = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const { chatId, message } = action.payload;
                state.loading.operations = false;

                // Add message to chat
                if (!state.messages[chatId]) {
                    state.messages[chatId] = {
                        data: [message],
                        pagination: {
                            page: 1,
                            pages: 1,
                            total: 1
                        }
                    };
                } else {
                    state.messages[chatId].data.push(message);
                    state.messages[chatId].pagination.total += 1;
                }

                // Update chat's lastMessage
                const chatIndex = state.chats.findIndex(chat => chat._id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].lastMessage = message;

                    // Move chat to top of list
                    const chat = state.chats[chatIndex];
                    state.chats.splice(chatIndex, 1);
                    state.chats.unshift(chat);
                }
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.loading.operations = false;
                state.error = action.payload as string;
            })

            // Mark chat as read
            .addCase(markChatAsRead.pending, (state) => {
                state.loading.operations = true;
            })
            .addCase(markChatAsRead.fulfilled, (state, action) => {
                const chatId = action.payload;
                state.loading.operations = false;

                // Update unread count for the chat
                const chatIndex = state.chats.findIndex(chat => chat._id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].unreadCount = 0;
                }
            })
            .addCase(markChatAsRead.rejected, (state, action) => {
                state.loading.operations = false;
                state.error = action.payload as string;
            })

            // Add participant
            .addCase(addParticipant.pending, (state) => {
                state.loading.operations = true;
            })
            .addCase(addParticipant.fulfilled, (state, action) => {
                state.loading.operations = false;
                const updatedChat = action.payload;

                // Update chat in state
                const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
                if (chatIndex !== -1) {
                    state.chats[chatIndex] = updatedChat;
                }

                // Update selected chat if it's the one being modified
                if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
                    state.selectedChat = updatedChat;
                }
            })
            .addCase(addParticipant.rejected, (state, action) => {
                state.loading.operations = false;
                state.error = action.payload as string;
            })

            // Remove participant
            .addCase(removeParticipant.pending, (state) => {
                state.loading.operations = true;
            })
            .addCase(removeParticipant.fulfilled, (state, action) => {
                state.loading.operations = false;
                const updatedChat = action.payload;

                // Handle chat deletion case
                if (!updatedChat._id) {
                    if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
                        state.selectedChat = null;
                    }
                    state.chats = state.chats.filter(chat => chat._id !== updatedChat._id);
                    return;
                }

                // Update chat in state
                const chatIndex = state.chats.findIndex(chat => chat._id === updatedChat._id);
                if (chatIndex !== -1) {
                    state.chats[chatIndex] = updatedChat;
                }

                // Update selected chat if it's the one being modified
                if (state.selectedChat && state.selectedChat._id === updatedChat._id) {
                    state.selectedChat = updatedChat;
                }
            })
            .addCase(removeParticipant.rejected, (state, action) => {
                state.loading.operations = false;
                state.error = action.payload as string;
            })

            // Fetch user by account ID
            .addCase(fetchUserByAccountId.fulfilled, (state, action) => {
                const { accountId, userData } = action.payload;

                // Update user data in all chats where this account is a participant
                state.chats.forEach(chat => {
                    chat.participants.forEach((participant, index) => {
                        if (participant._id === accountId) {
                            // Store the user data in an utilisateurAssocie field
                            (chat.participants[index] as any).utilisateurAssocie = userData;
                        }
                    });
                });

                // Also update in the selected chat if applicable
                if (state.selectedChat) {
                    state.selectedChat.participants.forEach((participant, index) => {
                        if (participant._id === accountId) {
                            (state.selectedChat!.participants[index] as any).utilisateurAssocie = userData;
                        }
                    });
                }
            });
    }
});

export const {
    setSelectedChat,
    addTypingUser,
    removeTypingUser,
    receiveMessage,
    clearErrors
} = chatSlice.actions;

export default chatSlice.reducer; 