import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Types
export interface UserParticipant {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
}

export interface ExternalParticipant {
    name: string;
    email: string;
}

export interface Note {
    _id: string;
    text: string;
    date: string | Date;
    createdBy?: string;
}

export interface Attachment {
    _id: string;
    name: string;
    size: string;
    type: string;
    url: string;
}

export interface Meeting {
    _id: string;
    title: string;
    description: string;
    date: string | Date;
    duration: number;
    meetLink?: string;
    participants: UserParticipant[];
    externalParticipants?: ExternalParticipant[];
    notes?: Note[];
    attachments?: Attachment[];
    projectId?: string;
    projectName?: string;
    status?: 'pending' | 'completed' | 'cancelled';
    createdAt?: string;
    updatedAt?: string;
}

// État initial
interface MeetingState {
    upcomingMeetings: Meeting[];
    pastMeetings: Meeting[];
    currentMeeting: Meeting | null;
    loading: boolean;
    error: string | null;
}

const initialState: MeetingState = {
    upcomingMeetings: [],
    pastMeetings: [],
    currentMeeting: null,
    loading: false,
    error: null,
};



// Thunks
export const fetchMeetingsByType = createAsyncThunk(
    'meetings/fetchByType',
    async (type: 'upcoming' | 'past', { rejectWithValue }) => {
        try {
            const response = await axios.get(`/meet/meetings/${type}`);
            return { type, data: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch meetings');
        }
    }
);

export const fetchMeetingById = createAsyncThunk(
    'meetings/fetchById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/meet/meetings/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch meeting');
        }
    }
);

export const createMeeting = createAsyncThunk(
    'meetings/create',
    async (meetingData: Partial<Meeting>, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/meet/meetings`, meetingData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create meeting');
        }
    }
);

export const updateMeeting = createAsyncThunk(
    'meetings/update',
    async ({ id, data }: { id: string; data: Partial<Meeting> }, { rejectWithValue }) => {
        try {
            const response = await axios.put(`/meet/meetings/${id}`, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update meeting');
        }
    }
);

export const deleteMeeting = createAsyncThunk(
    'meetings/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/meet/meetings/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete meeting');
        }
    }
);

export const addNoteToMeeting = createAsyncThunk(
    'meetings/addNote',
    async ({ meetingId, note }: { meetingId: string; note: Omit<Note, '_id'> }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/meet/meetings/${meetingId}/notes`, note);
            return { meetingId, note: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add note');
        }
    }
);

export const addAttachmentToMeeting = createAsyncThunk(
    'meetings/addAttachment',
    async ({ meetingId, file }: { meetingId: string; file: File }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`/meet/meetings/${meetingId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return { meetingId, attachment: response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add attachment');
        }
    }
);

// Slice
const meetingSlice = createSlice({
    name: 'meetings',
    initialState,
    reducers: {
        clearMeetingError: (state) => {
            state.error = null;
        },
        setCurrentMeeting: (state, action: PayloadAction<Meeting | null>) => {
            state.currentMeeting = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch meetings by type
            .addCase(fetchMeetingsByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMeetingsByType.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.type === 'upcoming') {
                    state.upcomingMeetings = action.payload.data;
                } else {
                    state.pastMeetings = action.payload.data;
                }
            })
            .addCase(fetchMeetingsByType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch meeting by ID
            .addCase(fetchMeetingById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMeetingById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMeeting = action.payload;
            })
            .addCase(fetchMeetingById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create meeting
            .addCase(createMeeting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createMeeting.fulfilled, (state, action) => {
                state.loading = false;
                const newMeeting = action.payload;
                // Add to appropriate list based on date
                const meetingDate = new Date(newMeeting.date);
                const now = new Date();

                if (meetingDate > now) {
                    state.upcomingMeetings.push(newMeeting);
                    // Sort by date (closest first)
                    state.upcomingMeetings.sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                } else {
                    state.pastMeetings.push(newMeeting);
                    // Sort by date (most recent first)
                    state.pastMeetings.sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                }
            })
            .addCase(createMeeting.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Update meeting
            .addCase(updateMeeting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMeeting.fulfilled, (state, action) => {
                state.loading = false;
                const updatedMeeting = action.payload;

                // Update in both lists if present
                state.upcomingMeetings = state.upcomingMeetings.map(meeting =>
                    meeting._id === updatedMeeting._id ? updatedMeeting : meeting
                );

                state.pastMeetings = state.pastMeetings.map(meeting =>
                    meeting._id === updatedMeeting._id ? updatedMeeting : meeting
                );

                // Update current meeting if it's the one being edited
                if (state.currentMeeting && state.currentMeeting._id === updatedMeeting._id) {
                    state.currentMeeting = updatedMeeting;
                }
            })
            .addCase(updateMeeting.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Delete meeting
            .addCase(deleteMeeting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteMeeting.fulfilled, (state, action) => {
                state.loading = false;
                const meetingId = action.payload;

                // Remove from both lists
                state.upcomingMeetings = state.upcomingMeetings.filter(
                    meeting => meeting._id !== meetingId
                );

                state.pastMeetings = state.pastMeetings.filter(
                    meeting => meeting._id !== meetingId
                );

                // Clear current meeting if it's the one being deleted
                if (state.currentMeeting && state.currentMeeting._id === meetingId) {
                    state.currentMeeting = null;
                }
            })
            .addCase(deleteMeeting.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Add note to meeting
            .addCase(addNoteToMeeting.fulfilled, (state, action) => {
                const { meetingId, note } = action.payload;

                // Add note to current meeting if it's the one being modified
                if (state.currentMeeting && state.currentMeeting._id === meetingId) {
                    if (!state.currentMeeting.notes) {
                        state.currentMeeting.notes = [];
                    }
                    state.currentMeeting.notes.push(note);
                }

                // Update in upcoming meetings
                const upcomingIndex = state.upcomingMeetings.findIndex(m => m._id === meetingId);
                if (upcomingIndex !== -1) {
                    if (!state.upcomingMeetings[upcomingIndex].notes) {
                        state.upcomingMeetings[upcomingIndex].notes = [];
                    }
                    state.upcomingMeetings[upcomingIndex].notes!.push(note);
                }

                // Update in past meetings
                const pastIndex = state.pastMeetings.findIndex(m => m._id === meetingId);
                if (pastIndex !== -1) {
                    if (!state.pastMeetings[pastIndex].notes) {
                        state.pastMeetings[pastIndex].notes = [];
                    }
                    state.pastMeetings[pastIndex].notes!.push(note);
                }
            })

            // Add attachment to meeting
            .addCase(addAttachmentToMeeting.fulfilled, (state, action) => {
                const { meetingId, attachment } = action.payload;

                // Add attachment to current meeting if it's the one being modified
                if (state.currentMeeting && state.currentMeeting._id === meetingId) {
                    if (!state.currentMeeting.attachments) {
                        state.currentMeeting.attachments = [];
                    }
                    state.currentMeeting.attachments.push(attachment);
                }

                // Update in upcoming meetings
                const upcomingIndex = state.upcomingMeetings.findIndex(m => m._id === meetingId);
                if (upcomingIndex !== -1) {
                    if (!state.upcomingMeetings[upcomingIndex].attachments) {
                        state.upcomingMeetings[upcomingIndex].attachments = [];
                    }
                    state.upcomingMeetings[upcomingIndex].attachments!.push(attachment);
                }

                // Update in past meetings
                const pastIndex = state.pastMeetings.findIndex(m => m._id === meetingId);
                if (pastIndex !== -1) {
                    if (!state.pastMeetings[pastIndex].attachments) {
                        state.pastMeetings[pastIndex].attachments = [];
                    }
                    state.pastMeetings[pastIndex].attachments!.push(attachment);
                }
            });
    },
});

export const { clearMeetingError, setCurrentMeeting } = meetingSlice.actions;
export default meetingSlice.reducer; 