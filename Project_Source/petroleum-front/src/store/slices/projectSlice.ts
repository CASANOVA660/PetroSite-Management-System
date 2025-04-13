import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../../store';

interface Project {
    _id: string;
    projectNumber: string;
    name: string;
    clientName: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'En cours' | 'Fermé' | 'Annulé';
    creationDate: string;
    createdBy: {
        _id: string;
        nom: string;
        prenom: string;
    };
}

interface ProjectState {
    projects: Project[];
    selectedProject: Project | null;
    loading: boolean;
    error: string | null;
}

interface CreateProjectData {
    name: string;
    clientName: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'En cours' | 'Fermé' | 'Annulé';
}

const initialState: ProjectState = {
    projects: [],
    selectedProject: null,
    loading: false,
    error: null,
};

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            // Make sure to add 'Bearer ' prefix
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token being sent:', token);
            console.log('Headers:', config.headers);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Async thunks
export const fetchProjects = createAsyncThunk(
    'projects/fetchProjects',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/projects');
            console.log('Projects API Response:', response.data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                // New format with success and data
                return response.data.data;
            } else if (Array.isArray(response.data)) {
                // Old format, direct array response
                return response.data;
            } else {
                console.error('Unexpected API response structure:', response.data);
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching projects:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
        }
    }
);

export const fetchProjectById = createAsyncThunk(
    'projects/fetchProjectById',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log('Fetching project with ID:', id);
            const response = await api.get(`/projects/${id}`);
            console.log('Project API Response:', response.data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                // New format with success and data
                const projectData = response.data.data;

                // Validate project data
                if (!projectData._id || !projectData.projectNumber) {
                    console.error('Project missing required fields:', projectData);
                    return rejectWithValue('Données du projet incomplètes');
                }

                return projectData;
            } else if (response.data && response.data._id) {
                // Old format, direct project response
                return response.data;
            } else {
                console.error('No project data in response:', response.data);
                return rejectWithValue('Projet non trouvé');
            }
        } catch (error: any) {
            console.error('Error fetching project:', error);
            if (error.response?.status === 404) {
                return rejectWithValue('Projet non trouvé');
            }
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
        }
    }
);

export const createProject = createAsyncThunk(
    'projects/createProject',
    async (projectData: CreateProjectData, { rejectWithValue, getState }) => {
        try {
            // Get the current user from the auth state
            const state = getState() as RootState;
            const currentUser = state.auth.user;

            if (!currentUser || !currentUser._id) {
                console.error('No authenticated user found');
                return rejectWithValue('Vous devez être connecté pour créer un projet');
            }

            // Include createdBy field in the project data
            const projectWithUser = {
                ...projectData,
                createdBy: currentUser._id
            };

            // Log the request data
            console.log('Creating project with data:', projectWithUser);
            console.log('Current user:', currentUser);
            console.log('Token:', localStorage.getItem('token'));

            const response = await api.post('/projects', projectWithUser);
            console.log('Create project response:', response.data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                // New format with success and data
                const projectData = response.data.data;

                // Validate the project data
                if (!projectData._id || !projectData.projectNumber) {
                    console.error('Project missing required fields:', projectData);
                    return rejectWithValue('Données du projet incomplètes');
                }

                return projectData;
            } else if (response.data && response.data._id) {
                // Fallback for direct project data
                return response.data;
            } else {
                console.error('Invalid project creation response:', response.data);
                return rejectWithValue('Erreur lors de la création du projet');
            }
        } catch (error: any) {
            console.error('Project creation error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Failed to create project');
        }
    }
);

export const updateProject = createAsyncThunk(
    'projects/updateProject',
    async ({ id, data }: { id: string; data: CreateProjectData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/projects/${id}`, data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (response.data && response.data._id) {
                // Fallback for direct project data
                return response.data;
            } else {
                return rejectWithValue('Invalid response format');
            }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update project');
        }
    }
);

const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        clearSelectedProject: (state) => {
            state.selectedProject = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Projects
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Project By Id
            .addCase(fetchProjectById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProject = action.payload;
            })
            .addCase(fetchProjectById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create Project
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;
                if (!state.projects) {
                    state.projects = [];
                }
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update Project
            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedProject = action.payload;
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSelectedProject } = projectSlice.actions;
export default projectSlice.reducer;