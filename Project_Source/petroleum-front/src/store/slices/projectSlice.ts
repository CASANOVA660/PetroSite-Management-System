import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';
import { RootState } from '../../store';
import { toast } from 'react-hot-toast';

export interface Project {
    _id: string;
    projectNumber: string;
    name: string;
    clientName: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'En cours' | 'Clôturé' | 'Annulé' | 'En opération';
    statusNote?: string;
    creationDate: string;
    createdBy: {
        _id: string;
        nom: string;
        prenom: string;
    };
    equipment: {
        equipmentId: string;
        needsValidation: boolean;
        validationReason?: string;
        chefDeBaseId?: string;
    }[];
    requirements?: ProjectRequirement[];
}

// New interface for requirement
export interface Requirement {
    id: string;
    content: string;
    type: RequirementType;
    projectId: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

// Enum for requirement types
export enum RequirementType {
    REGULATORY = 'REGULATORY',
    TECHNICAL = 'TECHNICAL',
    BUSINESS = 'BUSINESS',
    ENVIRONMENTAL = 'ENVIRONMENTAL',
    SAFETY = 'SAFETY',
    OTHER = 'OTHER'
}

// Interface for project requirements
export interface ProjectRequirement {
    id: string;
    type: RequirementType;
    content: string;
}

interface ProjectState {
    projects: Project[];
    selectedProject: Project | null;
    loading: boolean;
    error: string | null;
    requirementsLoading: boolean;
    requirementsError: string | null;
}

interface CreateProjectData {
    name: string;
    clientName: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'En cours' | 'Fermé' | 'Annulé';
}

// Interface for creating/updating a requirement
interface RequirementData {
    content: string;
    type: RequirementType;
}

// Add new interface for validation request
interface ValidationRequest {
    projectId: string;
    equipmentId: string;
    chefDeBaseId: string;
    validationReason: string;
    needsValidation: boolean;
}

const initialState: ProjectState = {
    projects: [],
    selectedProject: null,
    loading: false,
    error: null,
    requirementsLoading: false,
    requirementsError: null,
};

// Add request interceptor to add auth token
axios.interceptors.request.use(
    (config: any) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token being sent:', token);
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Async thunks
export const fetchProjects = createAsyncThunk(
    'projects/fetchProjects',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/projects');
            console.log('Projects API Response:', response.data);

            // Handle different response formats
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (Array.isArray(response.data)) {
                return response.data;
            } else {
                console.error('Unexpected API response structure:', response.data);
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching projects:', error);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des projets');
        }
    }
);

export const fetchProjectById = createAsyncThunk(
    'projects/fetchProjectById',
    async (id: string, { rejectWithValue }) => {
        try {
            console.log('Fetching project with ID:', id);
            const response = await axios.get(`/projects/${id}`);
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
            } else if (error.response?.status === 403) {
                return rejectWithValue('Vous n\'êtes pas autorisé à accéder à ce projet');
            } else if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération du projet');
        }
    }
);

// New async thunks for requirements
export const fetchProjectRequirements = createAsyncThunk(
    'projects/fetchProjectRequirements',
    async (projectId: string, { rejectWithValue }) => {
        try {
            console.log('Fetching requirements for project:', projectId);
            const response = await axios.get(`/requirements/project/${projectId}`);
            console.log('Requirements API Response:', response.data);

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (Array.isArray(response.data)) {
                return response.data;
            } else {
                console.error('Unexpected API response structure:', response.data);
                return [];
            }
        } catch (error: any) {
            console.error('Error fetching requirements:', error);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des exigences');
        }
    }
);

export const addProjectRequirement = createAsyncThunk(
    'projects/addProjectRequirement',
    async ({ projectId, requirement }: { projectId: string, requirement: RequirementData }, { rejectWithValue }) => {
        try {
            console.log('Adding requirement to project:', projectId, requirement);
            const response = await axios.post(`/requirements/project/${projectId}`, requirement);
            console.log('Add requirement response:', response.data);

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (response.data) {
                return response.data;
            } else {
                console.error('Invalid response format:', response.data);
                return rejectWithValue('Format de réponse invalide');
            }
        } catch (error: any) {
            console.error('Error adding requirement:', error);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'ajout de l\'exigence');
        }
    }
);

export const updateProjectRequirement = createAsyncThunk(
    'projects/updateProjectRequirement',
    async ({ projectId, requirementId, requirement }: { projectId: string, requirementId: string, requirement: RequirementData }, { rejectWithValue }) => {
        try {
            console.log('Updating requirement:', requirementId, requirement);
            const response = await axios.put(`/requirements/${requirementId}/project/${projectId}`, requirement);
            console.log('Update requirement response:', response.data);

            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (response.data) {
                return response.data;
            } else {
                console.error('Invalid response format:', response.data);
                return rejectWithValue('Format de réponse invalide');
            }
        } catch (error: any) {
            console.error('Error updating requirement:', error);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'exigence');
        }
    }
);

export const deleteProjectRequirement = createAsyncThunk(
    'projects/deleteProjectRequirement',
    async ({ projectId, requirementId }: { projectId: string, requirementId: string }, { rejectWithValue }) => {
        try {
            console.log('Deleting requirement:', requirementId);
            const response = await axios.delete(`/requirements/${requirementId}/project/${projectId}`);
            console.log('Delete requirement response:', response.data);

            // Return the deleted requirement ID for state updates
            return { requirementId, projectId };
        } catch (error: any) {
            console.error('Error deleting requirement:', error);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression de l\'exigence');
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

            const response = await axios.post('/projects', projectWithUser);
            console.log('Create project response:', response.data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                // New format with success and data
                const project = response.data.data;

                // Validate the project data
                if (!project._id || !project.projectNumber) {
                    console.error('Project missing required fields:', project);
                    return rejectWithValue('Données du projet incomplètes');
                }

                return project;
            } else if (response.data && response.data._id) {
                // Fallback for direct project data
                return response.data;
            } else {
                console.error('Invalid project creation response:', response.data);
                return rejectWithValue('Erreur lors de la création du projet');
            }
        } catch (error: any) {
            console.error('Project creation error:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
            } else if (error.response?.status === 400) {
                return rejectWithValue(error.response.data?.message || 'Données de projet invalides');
            }
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création du projet');
        }
    }
);

export const updateProject = createAsyncThunk(
    'projects/updateProject',
    async ({ id, data }: { id: string; data: CreateProjectData }, { rejectWithValue, getState }) => {
        try {
            // Check if user is authenticated
            const state = getState() as RootState;
            const currentUser = state.auth.user;

            if (!currentUser || !currentUser._id) {
                console.error('Update project: No authenticated user found');
                return rejectWithValue('Vous devez être connecté pour modifier un projet');
            }

            console.log('Updating project with ID:', id);
            console.log('Update data:', data);
            console.log('Current user:', currentUser);

            const response = await axios.put(`/projects/${id}`, data);
            console.log('Update project response:', response.data);

            // Handle the standardized response format
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            } else if (response.data && response.data._id) {
                // Fallback for direct project data
                return response.data;
            } else {
                console.error('Invalid update response format:', response.data);
                return rejectWithValue('Format de réponse invalide');
            }
        } catch (error: any) {
            console.error('Project update error:', error);

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);

                // Handle specific error status codes
                if (error.response.status === 401) {
                    return rejectWithValue('Session expirée. Veuillez vous reconnecter.');
                } else if (error.response.status === 403) {
                    return rejectWithValue('Vous n\'êtes pas autorisé à modifier ce projet');
                } else if (error.response.status === 404) {
                    return rejectWithValue('Projet non trouvé');
                }
            }

            // Handle TypeError that might occur with authentication issues
            if (error instanceof TypeError && error.message.includes('undefined')) {
                return rejectWithValue('Erreur d\'authentification. Veuillez vous reconnecter.');
            }

            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du projet');
        }
    }
);

// Add new async thunk for validation request
export const sendValidationRequest = createAsyncThunk(
    'projects/sendValidationRequest',
    async ({ projectId, equipmentId, chefDeBaseId, validationReason, needsValidation }: ValidationRequest) => {
        try {
            console.log('Sending validation request with data:', {
                projectId,
                equipmentId,
                chefDeBaseId,
                validationReason,
                needsValidation
            });

            const url = `/projects/${projectId}/equipment`;
            console.log('Validation request URL:', url);

            const requestData = {
                equipment: [{
                    equipment: { _id: equipmentId },
                    description: '',
                    dossierType: 'Dossier Technique'
                }],
                needsValidation,
                validationReason,
                chefDeBaseId
            };
            console.log('Validation request payload:', requestData);

            const response = await axios.post(url, requestData);
            console.log('Validation request response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Validation request error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            });
            throw error;
        }
    }
);

// Update project status
export const updateProjectStatus = createAsyncThunk(
    'projects/updateStatus',
    async ({ id, status }: { id: string, status: 'En cours' | 'Clôturé' | 'Annulé' | 'En opération' }, { rejectWithValue }) => {
        try {
            // This would make an API call to update the project status
            // const response = await axios.patch(`${API_URL}/projects/${id}/status`, { status });
            // return response.data;

            // For now, we'll simulate a successful update
            console.log(`Project ${id} status updated to ${status}`);
            return { id, status };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update project status');
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
        clearProjectError: (state) => {
            state.error = null;
        }
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
            })
            // Send Validation Request
            .addCase(sendValidationRequest.pending, (state) => {
                state.loading = true;
            })
            .addCase(sendValidationRequest.fulfilled, (state) => {
                state.loading = false;
                toast.success('Demande de validation envoyée avec succès');
            })
            .addCase(sendValidationRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Une erreur est survenue';
                toast.error('Erreur lors de l\'envoi de la demande de validation');
            })

            // Fetch Project Requirements
            .addCase(fetchProjectRequirements.pending, (state) => {
                state.requirementsLoading = true;
                state.requirementsError = null;
            })
            .addCase(fetchProjectRequirements.fulfilled, (state, action) => {
                state.requirementsLoading = false;
                if (state.selectedProject) {
                    state.selectedProject.requirements = action.payload;
                }
            })
            .addCase(fetchProjectRequirements.rejected, (state, action) => {
                state.requirementsLoading = false;
                state.requirementsError = action.payload as string;
                toast.error('Erreur lors de la récupération des exigences');
            })

            // Add Project Requirement
            .addCase(addProjectRequirement.pending, (state) => {
                state.requirementsLoading = true;
                state.requirementsError = null;
            })
            .addCase(addProjectRequirement.fulfilled, (state, action) => {
                state.requirementsLoading = false;
                if (state.selectedProject) {
                    if (!state.selectedProject.requirements) {
                        state.selectedProject.requirements = [];
                    }
                    state.selectedProject.requirements.push(action.payload);
                    toast.success('Exigence ajoutée avec succès');
                }
            })
            .addCase(addProjectRequirement.rejected, (state, action) => {
                state.requirementsLoading = false;
                state.requirementsError = action.payload as string;
                toast.error('Erreur lors de l\'ajout de l\'exigence');
            })

            // Update Project Requirement
            .addCase(updateProjectRequirement.pending, (state) => {
                state.requirementsLoading = true;
                state.requirementsError = null;
            })
            .addCase(updateProjectRequirement.fulfilled, (state, action) => {
                state.requirementsLoading = false;
                if (state.selectedProject && state.selectedProject.requirements) {
                    const index = state.selectedProject.requirements.findIndex(
                        req => req.id === action.payload.id
                    );
                    if (index !== -1) {
                        state.selectedProject.requirements[index] = action.payload;
                        toast.success('Exigence mise à jour avec succès');
                    }
                }
            })
            .addCase(updateProjectRequirement.rejected, (state, action) => {
                state.requirementsLoading = false;
                state.requirementsError = action.payload as string;
                toast.error('Erreur lors de la mise à jour de l\'exigence');
            })

            // Delete Project Requirement
            .addCase(deleteProjectRequirement.pending, (state) => {
                state.requirementsLoading = true;
                state.requirementsError = null;
            })
            .addCase(deleteProjectRequirement.fulfilled, (state, action) => {
                state.requirementsLoading = false;
                const { requirementId, projectId } = action.payload;
                if (state.selectedProject &&
                    state.selectedProject._id === projectId &&
                    state.selectedProject.requirements) {
                    state.selectedProject.requirements = state.selectedProject.requirements.filter(
                        req => req.id !== requirementId
                    );
                    toast.success('Exigence supprimée avec succès');
                }
            })
            .addCase(deleteProjectRequirement.rejected, (state, action) => {
                state.requirementsLoading = false;
                state.requirementsError = action.payload as string;
                toast.error('Erreur lors de la suppression de l\'exigence');
            })

            // Handle updateProjectStatus
            .addCase(updateProjectStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProjectStatus.fulfilled, (state, action) => {
                state.loading = false;
                // Update the project status in the state
                if (state.projects) {
                    const index = state.projects.findIndex(p => p._id === action.payload.id);
                    if (index !== -1) {
                        state.projects[index].status = action.payload.status;
                    }
                }
                if (state.selectedProject && state.selectedProject._id === action.payload.id) {
                    state.selectedProject.status = action.payload.status;
                }
            })
            .addCase(updateProjectStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSelectedProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;