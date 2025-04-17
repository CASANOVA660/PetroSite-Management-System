import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'todo' | 'inProgress' | 'inReview' | 'done';
    progress: number;
    priority: 'low' | 'medium' | 'high';
    startDate?: string;
    endDate?: string;
    assignee: {
        _id: string;
        nom: string;
        prenom: string;
    };
    creator: {
        _id: string;
        nom: string;
        prenom: string;
    };
    comments?: Array<{
        _id: string;
        text: string;
        author: {
            _id: string;
            nom: string;
            prenom: string;
        };
        createdAt: string;
    }>;
    files?: Array<{
        _id: string;
        name: string;
        url: string;
        type: string;
        size: number;
        uploadedBy: string;
        approved: boolean;
    }>;
    subtasks?: Array<{
        _id: string;
        text: string;
        completed: boolean;
    }>;
    needsValidation: boolean;
    tags: string[];
    // Fields for action-generated tasks
    actionId?: string;
    globalActionId?: string;
    // For project association
    projectId?: string;
    category?: string;
    // For archived and declined tasks
    isArchived?: boolean;
    isDeclined?: boolean;
    // For history tracking
    completedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface TasksState {
    tasks: {
        todo: Task[];
        inProgress: Task[];
        inReview: Task[];
        done: Task[];
    };
    history: Task[];
    loading: boolean;
    error: string | null;
}

const initialState: TasksState = {
    tasks: {
        todo: [],
        inProgress: [],
        inReview: [],
        done: []
    },
    history: [],
    loading: false,
    error: null
};

// Async thunks
export const fetchUserTasks = createAsyncThunk(
    'tasks/fetchUserTasks',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching user tasks from API...');
            const response = await axios.get('/tasks/user');
            console.log('User tasks API response:', response.data);

            // Check if the data has the expected structure
            if (!response.data.data || !response.data.data.todo) {
                console.error('Unexpected API response format:', response.data);
                return rejectWithValue('Invalid response format from API');
            }

            // Count task types in the response
            const allTasks = [
                ...(response.data.data.todo || []),
                ...(response.data.data.inProgress || []),
                ...(response.data.data.inReview || []),
                ...(response.data.data.done || [])
            ];

            const taskTypes = {
                projectAction: allTasks.filter(t => t.actionId).length,
                globalAction: allTasks.filter(t => t.globalActionId).length,
                personal: allTasks.filter(t => !t.actionId && !t.globalActionId).length,
                total: allTasks.length
            };

            console.log('Task types in API response:', taskTypes);

            // Check for any tasks with actionId
            const projectActionTasks = allTasks.filter(t => t.actionId);
            if (projectActionTasks.length > 0) {
                console.log('Project action tasks found in response:',
                    projectActionTasks.map(t => ({
                        id: t._id,
                        title: t.title,
                        actionId: t.actionId,
                        projectId: t.projectId,
                        assigneeId: t.assignee?._id,
                        status: t.status
                    }))
                );
            } else {
                console.warn('No project action tasks found in the API response!');

                // Force a fresh reload without cache
                console.log('Trying to force reload without cache...');
                try {
                    const freshResponse = await axios.get('/tasks/user', {
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        }
                    });

                    console.log('Fresh API response received:', freshResponse.data);

                    if (freshResponse.data.data && freshResponse.data.data.todo) {
                        const freshAllTasks = [
                            ...(freshResponse.data.data.todo || []),
                            ...(freshResponse.data.data.inProgress || []),
                            ...(freshResponse.data.data.inReview || []),
                            ...(freshResponse.data.data.done || [])
                        ];

                        const freshProjectActionTasks = freshAllTasks.filter(t => t.actionId);
                        if (freshProjectActionTasks.length > 0) {
                            console.log('Fresh request found project action tasks:',
                                freshProjectActionTasks.map(t => ({
                                    id: t._id,
                                    title: t.title,
                                    actionId: t.actionId,
                                    status: t.status
                                }))
                            );

                            return freshResponse.data.data;
                        }
                    }
                } catch (freshError) {
                    console.error('Error in fresh request:', freshError);
                }
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching user tasks:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
        }
    }
);

export const fetchTaskHistory = createAsyncThunk(
    'tasks/fetchTaskHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/tasks/history');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch task history');
        }
    }
);

export const createPersonalTask = createAsyncThunk(
    'tasks/createPersonalTask',
    async (taskData: any, { rejectWithValue }) => {
        try {
            const response = await axios.post('/tasks/personal', taskData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create task');
        }
    }
);

export const updateTaskStatus = createAsyncThunk(
    'tasks/updateTaskStatus',
    async ({ taskId, status }: { taskId: string, status: string }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/tasks/${taskId}/status`, { status });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
        }
    }
);

export const updateTaskProgress = createAsyncThunk(
    'tasks/updateTaskProgress',
    async ({ taskId, progress }: { taskId: string, progress: number }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/tasks/${taskId}/progress`, { progress });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update task progress');
        }
    }
);

export const addComment = createAsyncThunk(
    'tasks/addComment',
    async ({ taskId, text }: { taskId: string, text: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/comments`, { text });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
        }
    }
);

export const addSubtask = createAsyncThunk(
    'tasks/addSubtask',
    async ({ taskId, text }: { taskId: string, text: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/subtasks`, { text });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add subtask');
        }
    }
);

export const toggleSubtask = createAsyncThunk(
    'tasks/toggleSubtask',
    async ({ taskId, subtaskId }: { taskId: string, subtaskId: string }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle subtask');
        }
    }
);

export const reviewTask = createAsyncThunk(
    'tasks/reviewTask',
    async ({ taskId, decision, feedback }: { taskId: string, decision: 'accept' | 'decline' | 'return', feedback?: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/tasks/${taskId}/review`, { decision, feedback });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to review task');
        }
    }
);

const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addNewTask: (state, action: PayloadAction<Task>) => {
            const task = action.payload;
            if (task.status === 'todo') {
                state.tasks.todo.push(task);
            } else if (task.status === 'inProgress') {
                state.tasks.inProgress.push(task);
            } else if (task.status === 'inReview') {
                state.tasks.inReview.push(task);
            } else if (task.status === 'done') {
                state.tasks.done.push(task);
            }
        },
        updateTask: (state, action: PayloadAction<Task>) => {
            const task = action.payload;

            // Remove from all status arrays
            state.tasks.todo = state.tasks.todo.filter(t => t._id !== task._id);
            state.tasks.inProgress = state.tasks.inProgress.filter(t => t._id !== task._id);
            state.tasks.inReview = state.tasks.inReview.filter(t => t._id !== task._id);
            state.tasks.done = state.tasks.done.filter(t => t._id !== task._id);

            // Add to appropriate status array
            if (task.status === 'todo') {
                state.tasks.todo.push(task);
            } else if (task.status === 'inProgress') {
                state.tasks.inProgress.push(task);
            } else if (task.status === 'inReview') {
                state.tasks.inReview.push(task);
            } else if (task.status === 'done') {
                state.tasks.done.push(task);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // fetchUserTasks
            .addCase(fetchUserTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload;
            })
            .addCase(fetchUserTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // fetchTaskHistory
            .addCase(fetchTaskHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTaskHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchTaskHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // createPersonalTask
            .addCase(createPersonalTask.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPersonalTask.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks.todo.push(action.payload);
            })
            .addCase(createPersonalTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // updateTaskStatus
            .addCase(updateTaskStatus.fulfilled, (state, action) => {
                const updatedTask = action.payload;

                // Remove the task from all status arrays
                state.tasks.todo = state.tasks.todo.filter(task => task._id !== updatedTask._id);
                state.tasks.inProgress = state.tasks.inProgress.filter(task => task._id !== updatedTask._id);
                state.tasks.inReview = state.tasks.inReview.filter(task => task._id !== updatedTask._id);
                state.tasks.done = state.tasks.done.filter(task => task._id !== updatedTask._id);

                // Add the task to the appropriate status array
                if (updatedTask.status === 'todo') {
                    state.tasks.todo.push(updatedTask);
                } else if (updatedTask.status === 'inProgress') {
                    state.tasks.inProgress.push(updatedTask);
                } else if (updatedTask.status === 'inReview') {
                    state.tasks.inReview.push(updatedTask);
                } else if (updatedTask.status === 'done') {
                    state.tasks.done.push(updatedTask);
                }
            })

            // All other updates
            .addCase(updateTaskProgress.fulfilled, (state, action) => {
                const updatedTask = action.payload;
                const statusKey = updatedTask.status as 'todo' | 'inProgress' | 'inReview' | 'done';
                const index = state.tasks[statusKey].findIndex(task => task._id === updatedTask._id);

                if (index !== -1) {
                    state.tasks[statusKey][index] = updatedTask;
                }
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const updatedTask = action.payload;
                const statusKey = updatedTask.status as 'todo' | 'inProgress' | 'inReview' | 'done';
                const index = state.tasks[statusKey].findIndex(task => task._id === updatedTask._id);

                if (index !== -1) {
                    state.tasks[statusKey][index] = updatedTask;
                }
            })
            .addCase(addSubtask.fulfilled, (state, action) => {
                const updatedTask = action.payload;
                const statusKey = updatedTask.status as 'todo' | 'inProgress' | 'inReview' | 'done';
                const index = state.tasks[statusKey].findIndex(task => task._id === updatedTask._id);

                if (index !== -1) {
                    state.tasks[statusKey][index] = updatedTask;
                }
            })
            .addCase(toggleSubtask.fulfilled, (state, action) => {
                const updatedTask = action.payload;
                const statusKey = updatedTask.status as 'todo' | 'inProgress' | 'inReview' | 'done';
                const index = state.tasks[statusKey].findIndex(task => task._id === updatedTask._id);

                if (index !== -1) {
                    state.tasks[statusKey][index] = updatedTask;
                }
            })
            .addCase(reviewTask.fulfilled, (state, action) => {
                const updatedTask = action.payload;

                // Remove from all status arrays first
                state.tasks.todo = state.tasks.todo.filter(task => task._id !== updatedTask._id);
                state.tasks.inProgress = state.tasks.inProgress.filter(task => task._id !== updatedTask._id);
                state.tasks.inReview = state.tasks.inReview.filter(task => task._id !== updatedTask._id);
                state.tasks.done = state.tasks.done.filter(task => task._id !== updatedTask._id);

                // Add to the appropriate array based on new status
                if (updatedTask.status === 'todo') {
                    state.tasks.todo.push(updatedTask);
                } else if (updatedTask.status === 'inProgress') {
                    state.tasks.inProgress.push(updatedTask);
                } else if (updatedTask.status === 'inReview') {
                    state.tasks.inReview.push(updatedTask);
                } else if (updatedTask.status === 'done') {
                    state.tasks.done.push(updatedTask);
                }
            });
    }
});

// Export all the action creators
export const { addNewTask, updateTask } = taskSlice.actions;

// Export the reducer
export default taskSlice.reducer; 