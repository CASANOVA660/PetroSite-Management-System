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
    // For linking tasks
    linkedTaskId?: string;
    // For combined data from linked tasks
    allComments?: Array<{
        _id: string;
        text: string;
        author: {
            _id: string;
            nom: string;
            prenom: string;
        };
        createdAt: string;
    }>;
    allFiles?: Array<{
        _id: string;
        name: string;
        url: string;
        type: string;
        size: number;
        uploadedBy: string;
        approved: boolean;
    }>;
    linkedTask?: {
        _id: string;
        title: string;
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
    };
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
    currentTask: Task | null;
    history: any[];
    loading: boolean;
    error: string | null;
    actionTasks: Task[];
    actionComments: any[];
    actionFiles: any[];
}

const initialState: TasksState = {
    tasks: {
        todo: [],
        inProgress: [],
        inReview: [],
        done: []
    },
    currentTask: null,
    history: [],
    loading: false,
    error: null,
    actionTasks: [],
    actionComments: [],
    actionFiles: []
};

// Async thunks
export const fetchUserTasks = createAsyncThunk(
    'tasks/fetchUserTasks',
    async (options: { includeProjectActions?: boolean } = {}, { rejectWithValue, dispatch }) => {
        try {
            console.log('Fetching user tasks from API...');

            // Add timestamp and includeProjectActions flag explicitly
            const timestamp = new Date().getTime();
            const includeProjectActions = options.includeProjectActions === true ? 'true' : 'false';
            const response = await axios.get(`/tasks/user?_t=${timestamp}&includeProjectActions=${includeProjectActions}`);

            console.log('User tasks API response:', response.data);

            // Check if the data has the expected structure
            if (!response.data.data || !response.data.data.todo) {
                console.error('Unexpected API response format:', response.data);

                // If we didn't explicitly request project actions yet, try again with that parameter
                if (!options.includeProjectActions) {
                    console.log('Retrying with explicit includeProjectActions=true parameter...');
                    // Instead of recursion, just make a new request directly
                    const retryTimestamp = new Date().getTime();
                    const retryResponse = await axios.get(`/tasks/user?_t=${retryTimestamp}&includeProjectActions=true`);

                    if (retryResponse.data.data && retryResponse.data.data.todo) {
                        return retryResponse.data.data;
                    }
                }

                return rejectWithValue('Invalid response format from API');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching user tasks:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
        }
    }
);

// Specialized function to fetch only project action tasks
export const fetchProjectActionTasks = createAsyncThunk(
    'tasks/fetchProjectActionTasks',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching only project action tasks...');
            const timestamp = new Date().getTime();
            const response = await axios.get(`/tasks/project-actions?_t=${timestamp}`);

            console.log('Project action tasks response:', response.data);

            if (!response.data.data) {
                console.error('Invalid project action tasks response:', response.data);
                return rejectWithValue('Invalid response format from API');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching project action tasks:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch project action tasks');
        }
    }
);

// Specialized function to fetch only global action tasks
export const fetchGlobalActionTasks = createAsyncThunk(
    'tasks/fetchGlobalActionTasks',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching only global action tasks...');
            const timestamp = new Date().getTime();
            const response = await axios.get(`/tasks/global-actions?_t=${timestamp}`);

            console.log('Global action tasks response:', response.data);

            if (!response.data.data) {
                console.error('Invalid global action tasks response:', response.data);
                return rejectWithValue('Invalid response format from API');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching global action tasks:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch global action tasks');
        }
    }
);

// Fetch tasks for a specific global action
export const fetchTasksByGlobalActionId = createAsyncThunk(
    'tasks/fetchTasksByGlobalActionId',
    async (globalActionId: string, { rejectWithValue }) => {
        try {
            console.log(`Fetching tasks for global action: ${globalActionId}`);
            const timestamp = new Date().getTime();
            const response = await axios.get(`/tasks/by-global-action/${globalActionId}?_t=${timestamp}`);

            console.log('Tasks by global action response:', response.data);

            if (!response.data.data) {
                console.error('Invalid tasks response:', response.data);
                return rejectWithValue('Invalid response format from API');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching tasks for global action:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks for this global action');
        }
    }
);

// Fetch tasks for a specific project action
export const fetchTasksByActionId = createAsyncThunk(
    'tasks/fetchTasksByActionId',
    async (actionId: string, { rejectWithValue }) => {
        try {
            console.log(`Fetching tasks for project action: ${actionId}`);
            const timestamp = new Date().getTime();
            const response = await axios.get(`/tasks/by-action/${actionId}?_t=${timestamp}`);

            console.log('Tasks by project action response:', response.data);

            if (!response.data.data) {
                console.error('Invalid tasks response:', response.data);
                return rejectWithValue('Invalid response format from API');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching tasks for project action:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks for this project action');
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

export const uploadTaskFile = createAsyncThunk(
    'tasks/uploadTaskFile',
    async ({ taskId, file }: { taskId: string, file: File }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`/tasks/${taskId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
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

// Get task with linked data
export const getTaskWithLinkedData = createAsyncThunk(
    'tasks/getTaskWithLinkedData',
    async ({ taskId }: { taskId: string }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/tasks/${taskId}/with-linked-data`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch task with linked data');
        }
    }
);

// Fetch tasks for a specific global action with their comments and files
export const fetchTasksWithCommentsForAction = createAsyncThunk(
    'tasks/fetchTasksWithCommentsForAction',
    async ({ actionId, isProjectAction }: { actionId: string, isProjectAction: boolean }, { dispatch, rejectWithValue }) => {
        try {
            console.log(`Fetching tasks with comments for ${isProjectAction ? 'project' : 'global'} action: ${actionId}`);

            // First fetch the tasks based on action type
            let tasks;
            if (isProjectAction) {
                const response = await dispatch(fetchTasksByActionId(actionId)).unwrap();
                tasks = response;
            } else {
                const response = await dispatch(fetchTasksByGlobalActionId(actionId)).unwrap();
                tasks = response;
            }

            if (!tasks || tasks.length === 0) {
                return {
                    tasks: [],
                    allComments: [],
                    allFiles: []
                };
            }

            // Then fetch detailed data for each task including comments
            const taskDetails = await Promise.all(
                tasks.map(async (task: any) => {
                    try {
                        const timestamp = new Date().getTime();
                        const response = await axios.get(`/tasks/${task._id}/with-linked-data?_t=${timestamp}`);
                        return response.data.data;
                    } catch (error) {
                        console.error(`Error fetching details for task ${task._id}:`, error);
                        return task; // Return original task if fetch fails
                    }
                })
            );

            // Combine all comments and files from all tasks with deduplication
            let allComments: any[] = [];
            let allFiles: any[] = [];

            // Track seen comment and file IDs to avoid duplicates
            const seenCommentIds = new Set<string>();
            const seenFileIds = new Set<string>();

            taskDetails.forEach(task => {
                if (task.allComments) {
                    task.allComments.forEach((comment: any) => {
                        if (comment._id && !seenCommentIds.has(comment._id)) {
                            seenCommentIds.add(comment._id);
                            allComments.push(comment);
                        }
                    });
                } else if (task.comments) {
                    task.comments.forEach((comment: any) => {
                        if (comment._id && !seenCommentIds.has(comment._id)) {
                            seenCommentIds.add(comment._id);
                            allComments.push(comment);
                        }
                    });
                }

                if (task.allFiles) {
                    task.allFiles.forEach((file: any) => {
                        if (file._id && !seenFileIds.has(file._id)) {
                            seenFileIds.add(file._id);
                            allFiles.push(file);
                        }
                    });
                } else if (task.files) {
                    task.files.forEach((file: any) => {
                        if (file._id && !seenFileIds.has(file._id)) {
                            seenFileIds.add(file._id);
                            allFiles.push(file);
                        }
                    });
                }
            });

            // Sort comments by date
            allComments.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            // Sort files by date
            allFiles.sort((a, b) => {
                const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
                const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            return {
                tasks: taskDetails,
                allComments,
                allFiles
            };
        } catch (error: any) {
            console.error('Error fetching tasks with comments:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch task details');
        }
    }
);

// Add comment to a task for action view
export const addCommentToActionTask = createAsyncThunk(
    'tasks/addCommentToActionTask',
    async (
        { taskId, text, actionId, isProjectAction }:
            { taskId: string, text: string, actionId: string, isProjectAction: boolean },
        { dispatch, rejectWithValue }
    ) => {
        try {
            // First add the comment to the task
            await dispatch(addComment({ taskId, text })).unwrap();

            // Then refresh all task data for the action view
            return await dispatch(fetchTasksWithCommentsForAction({
                actionId,
                isProjectAction
            })).unwrap();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
        }
    }
);

// Upload file to a task for action view
export const uploadFileToActionTask = createAsyncThunk(
    'tasks/uploadFileToActionTask',
    async (
        { taskId, file, actionId, isProjectAction }:
            { taskId: string, file: File, actionId: string, isProjectAction: boolean },
        { dispatch, rejectWithValue }
    ) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // First upload the file
            await axios.post(`/tasks/${taskId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Then refresh all task data for the action view
            return await dispatch(fetchTasksWithCommentsForAction({
                actionId,
                isProjectAction
            })).unwrap();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
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

            // fetchProjectActionTasks
            .addCase(fetchProjectActionTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectActionTasks.fulfilled, (state, action) => {
                state.loading = false;
                // Merge project action tasks with existing tasks
                // Keep all non-project action tasks and add the new project action tasks
                const nonProjectActionTasks = {
                    todo: state.tasks.todo.filter(t => !t.actionId),
                    inProgress: state.tasks.inProgress.filter(t => !t.actionId),
                    inReview: state.tasks.inReview.filter(t => !t.actionId),
                    done: state.tasks.done.filter(t => !t.actionId)
                };

                // Combine with the new project action tasks
                state.tasks = {
                    todo: [...nonProjectActionTasks.todo, ...(action.payload.todo || [])],
                    inProgress: [...nonProjectActionTasks.inProgress, ...(action.payload.inProgress || [])],
                    inReview: [...nonProjectActionTasks.inReview, ...(action.payload.inReview || [])],
                    done: [...nonProjectActionTasks.done, ...(action.payload.done || [])]
                };
            })
            .addCase(fetchProjectActionTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // fetchGlobalActionTasks
            .addCase(fetchGlobalActionTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGlobalActionTasks.fulfilled, (state, action) => {
                state.loading = false;
                // Merge global action tasks with existing tasks
                // Keep all non-global action tasks and add the new global action tasks
                const nonGlobalActionTasks = {
                    todo: state.tasks.todo.filter(t => !t.globalActionId),
                    inProgress: state.tasks.inProgress.filter(t => !t.globalActionId),
                    inReview: state.tasks.inReview.filter(t => !t.globalActionId),
                    done: state.tasks.done.filter(t => !t.globalActionId)
                };

                // Combine with the new global action tasks
                state.tasks = {
                    todo: [...nonGlobalActionTasks.todo, ...(action.payload.todo || [])],
                    inProgress: [...nonGlobalActionTasks.inProgress, ...(action.payload.inProgress || [])],
                    inReview: [...nonGlobalActionTasks.inReview, ...(action.payload.inReview || [])],
                    done: [...nonGlobalActionTasks.done, ...(action.payload.done || [])]
                };
            })
            .addCase(fetchGlobalActionTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // fetchTasksByGlobalActionId
            .addCase(fetchTasksByGlobalActionId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksByGlobalActionId.fulfilled, (state, action) => {
                state.loading = false;
                state.actionTasks = action.payload;
            })
            .addCase(fetchTasksByGlobalActionId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.actionTasks = [];
            })

            // fetchTasksByActionId
            .addCase(fetchTasksByActionId.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksByActionId.fulfilled, (state, action) => {
                state.loading = false;
                state.actionTasks = action.payload;
            })
            .addCase(fetchTasksByActionId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.actionTasks = [];
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
            .addCase(uploadTaskFile.fulfilled, (state, action) => {
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
            })

            // fetchTasksWithCommentsForAction
            .addCase(fetchTasksWithCommentsForAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksWithCommentsForAction.fulfilled, (state, action) => {
                state.loading = false;
                state.actionTasks = action.payload.tasks;
                state.actionComments = action.payload.allComments;
                state.actionFiles = action.payload.allFiles;
            })
            .addCase(fetchTasksWithCommentsForAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // addCommentToActionTask
            .addCase(addCommentToActionTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(addCommentToActionTask.fulfilled, (state, action) => {
                state.loading = false;
                state.actionTasks = action.payload.tasks;
                state.actionComments = action.payload.allComments;
                state.actionFiles = action.payload.allFiles;
            })
            .addCase(addCommentToActionTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // uploadFileToActionTask
            .addCase(uploadFileToActionTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(uploadFileToActionTask.fulfilled, (state, action) => {
                state.loading = false;
                state.actionTasks = action.payload.tasks;
                state.actionComments = action.payload.allComments;
                state.actionFiles = action.payload.allFiles;
            })
            .addCase(uploadFileToActionTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    }
});

// Export all the action creators
export const { addNewTask, updateTask } = taskSlice.actions;

// Export the reducer
export default taskSlice.reducer; 