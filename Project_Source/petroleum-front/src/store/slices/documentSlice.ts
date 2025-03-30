import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

export interface Document {
    _id: string;
    name: string;
    url: string;
    publicId: string;
    category: 'Documents globale' | 'Dossier Administratif' | 'Dossier Technique' | 'Dossier RH' | 'Dossier HSE';
    projectId: string;
    createdAt: string;
    type: string;
    uploadedBy: {
        _id: string;
        nom: string;
        prenom: string;
    };
    format?: string;
    resourceType?: string;
    size?: number;
    width?: number;
    height?: number;
    optimizedUrl?: string;
    transformedUrl?: string;
}

export interface CreateDocumentData {
    file: File;
    projectId: string;
    category: 'Documents globale' | 'Dossier Administratif' | 'Dossier Technique' | 'Dossier RH' | 'Dossier HSE';
    name: string;
}

interface DocumentState {
    documentsByCategory: {
        [key: string]: Document[];
    };
    loading: boolean;
    error: string | null;
}

const initialState: DocumentState = {
    documentsByCategory: {},
    loading: false,
    error: null,
};

// Fetch documents for each category
export const fetchDocumentsGlobale = createAsyncThunk(
    'documents/fetchDocumentsGlobale',
    async (projectId: string) => {
        const response = await api.get(`/documents/project/${projectId}/documents-globale`);
        return response.data;
    }
);

export const fetchDossierAdministratif = createAsyncThunk(
    'documents/fetchDossierAdministratif',
    async (projectId: string) => {
        const response = await api.get(`/documents/project/${projectId}/dossier-administratif`);
        return response.data;
    }
);

export const fetchDossierTechnique = createAsyncThunk(
    'documents/fetchDossierTechnique',
    async (projectId: string) => {
        const response = await api.get(`/documents/project/${projectId}/dossier-technique`);
        return response.data;
    }
);

export const fetchDossierRH = createAsyncThunk(
    'documents/fetchDossierRH',
    async (projectId: string) => {
        const response = await api.get(`/documents/project/${projectId}/dossier-rh`);
        return response.data;
    }
);

export const fetchDossierHSE = createAsyncThunk(
    'documents/fetchDossierHSE',
    async (projectId: string) => {
        const response = await api.get(`/documents/project/${projectId}/dossier-hse`);
        return response.data;
    }
);

// Upload documents for each category
export const uploadDocumentsGlobale = createAsyncThunk(
    'documents/uploadDocumentsGlobale',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('[DEBUG] Uploading document globale:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId,
                category: documentData.category
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);
            formData.append('category', documentData.category);

            const response = await api.post('/documents/documents-globale/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[DEBUG] Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[ERROR] Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadDossierAdministratif = createAsyncThunk(
    'documents/uploadDossierAdministratif',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('[DEBUG] Uploading dossier administratif:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId,
                category: documentData.category
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);
            formData.append('category', documentData.category);

            const response = await api.post('/documents/dossier-administratif/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[DEBUG] Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[ERROR] Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadDossierTechnique = createAsyncThunk(
    'documents/uploadDossierTechnique',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('[DEBUG] Uploading dossier technique:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId,
                category: documentData.category
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);
            formData.append('category', documentData.category);

            const response = await api.post('/documents/dossier-technique/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[DEBUG] Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[ERROR] Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadDossierRH = createAsyncThunk(
    'documents/uploadDossierRH',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('[DEBUG] Uploading dossier RH:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId,
                category: documentData.category
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);
            formData.append('category', documentData.category);

            const response = await api.post('/documents/dossier-rh/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[DEBUG] Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[ERROR] Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadDossierHSE = createAsyncThunk(
    'documents/uploadDossierHSE',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('[DEBUG] Uploading dossier HSE:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId,
                category: documentData.category
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);
            formData.append('category', documentData.category);

            const response = await api.post('/documents/dossier-hse/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[DEBUG] Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[ERROR] Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const documentSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch documents
            .addCase(fetchDocumentsGlobale.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDocumentsGlobale.fulfilled, (state, action) => {
                state.loading = false;
                state.documentsByCategory['Documents globale'] = action.payload;
            })
            .addCase(fetchDocumentsGlobale.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents';
            })
            // Fetch Dossier Administratif
            .addCase(fetchDossierAdministratif.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierAdministratif.fulfilled, (state, action) => {
                state.loading = false;
                state.documentsByCategory['Dossier Administratif'] = action.payload;
            })
            .addCase(fetchDossierAdministratif.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents';
            })
            // Fetch Dossier Technique
            .addCase(fetchDossierTechnique.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierTechnique.fulfilled, (state, action) => {
                state.loading = false;
                state.documentsByCategory['Dossier Technique'] = action.payload;
            })
            .addCase(fetchDossierTechnique.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents';
            })
            // Fetch Dossier RH
            .addCase(fetchDossierRH.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierRH.fulfilled, (state, action) => {
                state.loading = false;
                state.documentsByCategory['Dossier RH'] = action.payload;
            })
            .addCase(fetchDossierRH.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents';
            })
            // Fetch Dossier HSE
            .addCase(fetchDossierHSE.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierHSE.fulfilled, (state, action) => {
                state.loading = false;
                state.documentsByCategory['Dossier HSE'] = action.payload;
            })
            .addCase(fetchDossierHSE.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents';
            })
            // Upload Documents Globale
            .addCase(uploadDocumentsGlobale.fulfilled, (state, action) => {
                const category = action.meta.arg.category;
                if (!state.documentsByCategory[category]) {
                    state.documentsByCategory[category] = [];
                }
                state.documentsByCategory[category].unshift(action.payload);
            })
            // Upload Dossier Administratif
            .addCase(uploadDossierAdministratif.fulfilled, (state, action) => {
                const category = action.meta.arg.category;
                if (!state.documentsByCategory[category]) {
                    state.documentsByCategory[category] = [];
                }
                state.documentsByCategory[category].unshift(action.payload);
            })
            // Upload Dossier Technique
            .addCase(uploadDossierTechnique.fulfilled, (state, action) => {
                const category = action.meta.arg.category;
                if (!state.documentsByCategory[category]) {
                    state.documentsByCategory[category] = [];
                }
                state.documentsByCategory[category].unshift(action.payload);
            })
            // Upload Dossier RH
            .addCase(uploadDossierRH.fulfilled, (state, action) => {
                const category = action.meta.arg.category;
                if (!state.documentsByCategory[category]) {
                    state.documentsByCategory[category] = [];
                }
                state.documentsByCategory[category].unshift(action.payload);
            })
            // Upload Dossier HSE
            .addCase(uploadDossierHSE.fulfilled, (state, action) => {
                const category = action.meta.arg.category;
                if (!state.documentsByCategory[category]) {
                    state.documentsByCategory[category] = [];
                }
                state.documentsByCategory[category].unshift(action.payload);
            });
    },
});

export default documentSlice.reducer;