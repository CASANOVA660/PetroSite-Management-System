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
    documents: Document[];
    loading: boolean;
    error: string | null;
}

const initialState: DocumentState = {
    documents: [],
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
            console.log('Uploading document globale:', {
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

            console.log('Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// documentSlice.ts
export const uploadDossierAdministratif = createAsyncThunk(
    'documents/uploadDossierAdministratif',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);

            // ✅ CORRECT ENDPOINT
            const response = await api.post(
                '/documents/dossier-administratif/upload', // Exact URL
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const uploadDossierTechnique = createAsyncThunk(
    'documents/uploadDossierTechnique',
    async (documentData: CreateDocumentData, { rejectWithValue }) => {
        try {
            console.log('Uploading dossier technique:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);

            const response = await api.post('/documents/dossier-technique/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Upload error:', {
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
            console.log('Uploading dossier RH:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);

            const response = await api.post('/documents/dossier-rh/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Upload error:', {
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
            console.log('Uploading dossier HSE:', {
                fileName: documentData.file.name,
                projectId: documentData.projectId
            });

            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('projectId', documentData.projectId);
            formData.append('name', documentData.name);

            const response = await api.post('/documents/dossier-hse/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Upload error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteDocument = createAsyncThunk(
    'documents/deleteDocument',
    async (documentId: string, { rejectWithValue }) => {
        try {
            await api.delete(`/documents/${documentId}`);
            return documentId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
        }
    }
);

const documentSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        clearDocuments: (state) => {
            state.documents = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch documents globale
            .addCase(fetchDocumentsGlobale.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDocumentsGlobale.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDocumentsGlobale.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch documents globale';
            })
            // Upload documents globale
            .addCase(uploadDocumentsGlobale.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            // Fetch dossier administratif
            .addCase(fetchDossierAdministratif.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierAdministratif.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDossierAdministratif.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dossier administratif';
            })
            // Upload dossier administratif
            .addCase(uploadDossierAdministratif.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            // Fetch dossier technique
            .addCase(fetchDossierTechnique.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierTechnique.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDossierTechnique.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dossier technique';
            })
            // Upload dossier technique
            .addCase(uploadDossierTechnique.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            // Fetch dossier RH
            .addCase(fetchDossierRH.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierRH.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDossierRH.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dossier RH';
            })
            // Upload dossier RH
            .addCase(uploadDossierRH.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            // Fetch dossier HSE
            .addCase(fetchDossierHSE.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDossierHSE.fulfilled, (state, action) => {
                state.loading = false;
                state.documents = action.payload;
            })
            .addCase(fetchDossierHSE.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dossier HSE';
            })
            // Upload dossier HSE
            .addCase(uploadDossierHSE.fulfilled, (state, action) => {
                state.documents.unshift(action.payload);
            })
            // Delete document
            .addCase(deleteDocument.fulfilled, (state, action) => {
                state.documents = state.documents.filter(doc => doc._id !== action.payload);
            });
    },
});

export const { clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;