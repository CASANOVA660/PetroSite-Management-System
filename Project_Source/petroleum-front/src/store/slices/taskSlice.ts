import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from './../../utils/axios';
import { RootState } from '../index';

export interface Task {
    _id: string;
    title: string;
    description: string;
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
    startDate: string;
    endDate: string;
    status: 'todo' | 'inProgress' | 'done';
    progress: number;
    tags: string[];
    actionId?: string;
}

interface TaskState {
    tasks: {
        todo: Task[];
        inProgress: Task[];
        done: Task[];
    };
    loading: boolean;
    error: string | null;
}

const initialState: TaskState = {
    tasks: {
        todo: [],
        inProgress: [],
        done: []
    },
    loading: false,
    error: null
};

// Fetch user's tasks
export const fetchUserTasks = createAsyncThunk(
    'tasks/fetchUserTasks',
    async () => {
        console.log('Fetching user tasks from API...');
        const response = await axios.get('/tasks/user');
        console.log('API Response:', response.data);
        return response.data;
    }
);

// Update task status
export const updateTaskStatus = createAsyncThunk(
    'tasks/updateStatus',
    async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
        console.log('Updating task status:', { taskId, status });
        const response = await axios.patch(`/tasks/${taskId}/status`, { status });
        console.log('Update response:', response.data);
        return response.data;
    }
);

export const deleteTask = createAsyncThunk(
    'tasks/deleteTask',
    async (taskId: string, { rejectWithValue }) => {
        try {
            await axios.delete(`/tasks/${taskId}`);
            return taskId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
        }
    }
);

const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addNewTask: (state, action) => {
            console.log('Adding new task:', action.payload);
            const task = action.payload;
            if (task.status && typeof task.status === 'string') {
                const status = task.status as keyof typeof state.tasks;
                if (status in state.tasks) {
                    state.tasks[status].push(task);
                    console.log('Task added to status:', status);
                } else {
                    console.warn('Invalid status for task:', task.status);
                }
            } else {
                console.warn('Task has no valid status:', task);
            }
        },
        updateTask: (state, action) => {
            console.log('Updating task:', action.payload);
            const updatedTask = action.payload;
            // Remove from all status arrays
            Object.keys(state.tasks).forEach((status) => {
                const previousLength = state.tasks[status as keyof typeof state.tasks].length;
                state.tasks[status as keyof typeof state.tasks] = state.tasks[status as keyof typeof state.tasks]
                    .filter(task => task._id !== updatedTask._id);
                const newLength = state.tasks[status as keyof typeof state.tasks].length;
                if (previousLength !== newLength) {
                    console.log(`Removed task from ${status} array`);
                }
            });
            // Add to correct status array
            if (updatedTask.status && updatedTask.status in state.tasks) {
                state.tasks[updatedTask.status as keyof typeof state.tasks].push(updatedTask);
                console.log('Added task to', updatedTask.status, 'array');
            } else {
                console.warn('Invalid status for updated task:', updatedTask.status);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserTasks.pending, (state) => {
                console.log('Fetching tasks - pending');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserTasks.fulfilled, (state, action) => {
                console.log('Fetching tasks - fulfilled:', action.payload);
                state.loading = false;
                if (action.payload && typeof action.payload === 'object') {
                    state.tasks = {
                        todo: Array.isArray(action.payload.todo) ? action.payload.todo : [],
                        inProgress: Array.isArray(action.payload.inProgress) ? action.payload.inProgress : [],
                        done: Array.isArray(action.payload.done) ? action.payload.done : []
                    };
                    console.log('Updated tasks state:', state.tasks);
                } else {
                    console.warn('Invalid payload received:', action.payload);
                }
                state.error = null;
            })
            .addCase(fetchUserTasks.rejected, (state, action) => {
                console.error('Fetching tasks - rejected:', action.error);
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch tasks';
            })
            .addCase(updateTaskStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTaskStatus.fulfilled, (state, action) => {
                const updatedTask = action.payload;
                // Remove from all status arrays
                Object.keys(state.tasks).forEach((status) => {
                    state.tasks[status as keyof typeof state.tasks] = state.tasks[status as keyof typeof state.tasks]
                        .filter(task => task._id !== updatedTask._id);
                });
                // Add to new status array
                if (updatedTask.status && updatedTask.status in state.tasks) {
                    state.tasks[updatedTask.status as keyof typeof state.tasks].push(updatedTask);
                }
            })
            .addCase(updateTaskStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update task status';
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                const taskId = action.payload;
                state.tasks = {
                    todo: state.tasks.todo.filter(task => task._id !== taskId),
                    inProgress: state.tasks.inProgress.filter(task => task._id !== taskId),
                    done: state.tasks.done.filter(task => task._id !== taskId)
                };
            });
    }
});

// Selectors
export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectTaskLoading = (state: RootState) => state.tasks.loading;
export const selectTaskError = (state: RootState) => state.tasks.error;

export const { addNewTask, updateTask } = taskSlice.actions;

export default taskSlice.reducer; 