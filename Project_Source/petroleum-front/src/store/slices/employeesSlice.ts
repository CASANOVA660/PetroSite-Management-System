import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../utils/axios';
import { AppDispatch } from '../store';

// Folder and Document types
export interface DocumentFile {
    url: string;
    type?: string;
    name?: string;
    folderId?: string;
    publicId?: string;
    documentId?: string;
}
export interface Folder {
    id: string;
    name: string;
    parentId?: string | null;
    documents: DocumentFile[];
    subfolders: Folder[];
}
// Employee type matching backend model
export interface Employee {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    status?: 'active' | 'onleave' | 'pending' | 'terminated';
    hireDate?: string;
    profileImage?: string;
    folders?: Folder[];
    createdAt?: string;
    updatedAt?: string;
}

const API_BASE = '/gestion-rh/employees';

export const fetchEmployees = createAsyncThunk<Employee[]>('employees/fetchAll', async (_, thunkAPI) => {
    try {
        const res = await axios.get(API_BASE);
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const fetchEmployeeById = createAsyncThunk<Employee, string>('employees/fetchById', async (id, thunkAPI) => {
    try {
        const res = await axios.get(`${API_BASE}/${id}`);
        const employeeData = {
            ...res.data,
            folders: Array.isArray(res.data.folders) ? res.data.folders : []
        };
        return employeeData;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const addEmployee = createAsyncThunk<Employee, FormData>('employees/add', async (formData, thunkAPI) => {
    try {
        const res = await axios.post(API_BASE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const updateEmployee = createAsyncThunk<Employee, { id: string, formData: FormData }>('employees/update', async ({ id, formData }, thunkAPI) => {
    try {
        const res = await axios.put(`${API_BASE}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const deleteEmployee = createAsyncThunk<string, string>('employees/delete', async (id, thunkAPI) => {
    try {
        await axios.delete(`${API_BASE}/${id}`);
        return id;
    } catch (err: any) {
        return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
});

export const addFolder = createAsyncThunk<Folder, { employeeId: string; name: string; parentId?: string | null }>(
    'employees/addFolder',
    async ({ employeeId, name, parentId }, thunkAPI) => {
        try {
            const res = await axios.post(`${API_BASE}/${employeeId}/folders`, { name, parentId });
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
        }
    }
);

export const renameFolder = createAsyncThunk<Folder, { employeeId: string; folderId: string; newName: string }>(
    'employees/renameFolder',
    async ({ employeeId, folderId, newName }, thunkAPI) => {
        try {
            const res = await axios.patch(`${API_BASE}/${employeeId}/folders/${folderId}`, { folderId, newName });
            return res.data;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
        }
    }
);

export const deleteFolder = createAsyncThunk<string, { employeeId: string; folderId: string }>(
    'employees/deleteFolder',
    async ({ employeeId, folderId }, thunkAPI) => {
        try {
            await axios.delete(`${API_BASE}/${employeeId}/folders/${folderId}`);
            return folderId;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
        }
    }
);

export const addDocumentToFolder = createAsyncThunk<DocumentFile, { employeeId: string; folderId: string; file: File }>(
    'employees/addDocumentToFolder',
    async ({ employeeId, folderId, file }, thunkAPI) => {
        try {
            if (!file) {
                throw new Error('No file selected');
            }

            console.log('[DEBUG] Uploading file to folder:', {
                folderId,
                fileName: file.name,
                type: file.type,
                size: file.size
            });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderId', folderId);

            const res = await axios.post(
                `${API_BASE}/${employeeId}/folders/${folderId}/documents`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        console.log(`Upload Progress: ${percentCompleted}%`);
                    }
                }
            );

            console.log('[DEBUG] Upload response:', res.data);

            // Return the document data from the response
            return {
                url: res.data.document.url,
                type: res.data.document.type,
                name: res.data.document.name,
                publicId: res.data.document.publicId,
                folderId: folderId,
                documentId: res.data.document.documentId
            };
        } catch (err: any) {
            console.error('[ERROR] Document upload error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            return thunkAPI.rejectWithValue(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Failed to upload document'
            );
        }
    }
);

export const deleteDocumentFromFolder = createAsyncThunk<string, { employeeId: string; folderId: string; url: string; publicId?: string }>(
    'employees/deleteDocumentFromFolder',
    async ({ employeeId, folderId, url, publicId }, thunkAPI) => {
        try {
            await axios.delete(`${API_BASE}/${employeeId}/folders/${folderId}/documents`, {
                data: { url, publicId }
            });
            return url;
        } catch (err: any) {
            return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
        }
    }
);

// Thunks for folder/document operations that also refresh the employee
export const addFolderAndRefresh = (params: { employeeId: string; name: string; parentId?: string | null }) => async (dispatch: AppDispatch) => {
    try {
        await dispatch(addFolder(params));
        await new Promise(resolve => setTimeout(resolve, 500));
        const refreshedEmployee = await dispatch(fetchEmployeeById(params.employeeId));
        const employeeData = refreshedEmployee.payload as Employee;
        if (!employeeData.folders) {
            employeeData.folders = [];
        }
        return employeeData;
    } catch (error) {
        throw error;
    }
};
export const renameFolderAndRefresh = (params: { employeeId: string; folderId: string; newName: string }) => async (dispatch: AppDispatch) => {
    await dispatch(renameFolder(params));
    await dispatch(fetchEmployeeById(params.employeeId));
};
export const deleteFolderAndRefresh = (params: { employeeId: string; folderId: string }) => async (dispatch: AppDispatch) => {
    await dispatch(deleteFolder(params));
    await dispatch(fetchEmployeeById(params.employeeId));
};
export const addDocumentToFolderAndRefresh = (params: { employeeId: string; folderId: string; file: File }) => async (dispatch: AppDispatch) => {
    try {
        const result = await dispatch(addDocumentToFolder(params));
        if (result.type === 'employees/addDocumentToFolder/rejected') {
            throw new Error(result.payload as string);
        }

        // Fetch fresh employee data
        const refreshedEmployee = await dispatch(fetchEmployeeById(params.employeeId));
        if (refreshedEmployee.type === 'employees/fetchById/rejected') {
            throw new Error('Failed to refresh employee data');
        }

        // Update the state with the new document
        const employeeData = refreshedEmployee.payload as Employee;
        const documentData = result.payload as DocumentFile;

        if (employeeData.folders) {
            const updateFolderWithDocument = (folders: Folder[]): Folder[] => {
                return folders.map(folder => {
                    if (folder.id === params.folderId) {
                        // Check if document already exists
                        const docExists = folder.documents.some(doc => doc.url === documentData.url);
                        if (!docExists) {
                            // Create new folder object with updated documents array
                            return {
                                ...folder,
                                documents: [...(folder.documents || []), {
                                    url: documentData.url,
                                    type: documentData.type,
                                    name: documentData.name,
                                    publicId: documentData.publicId,
                                    folderId: folder.id,
                                    documentId: documentData.documentId
                                }]
                            };
                        }
                    }
                    if (folder.subfolders && folder.subfolders.length > 0) {
                        // Recursively update subfolders
                        return {
                            ...folder,
                            subfolders: updateFolderWithDocument(folder.subfolders)
                        };
                    }
                    return folder;
                });
            };

            // Update the entire folders array immutably
            employeeData.folders = updateFolderWithDocument(employeeData.folders);
        }

        // Force a state update
        dispatch({ type: 'employees/forceUpdate' });

        return employeeData;
    } catch (error) {
        console.error('Error in addDocumentToFolderAndRefresh:', error);
        throw error;
    }
};
export const deleteDocumentFromFolderAndRefresh = (params: { employeeId: string; folderId: string; url: string }) => async (dispatch: AppDispatch) => {
    await dispatch(deleteDocumentFromFolder(params));
    await dispatch(fetchEmployeeById(params.employeeId));
};

interface EmployeesState {
    employees: Employee[];
    selectedEmployee: Employee | null;
    loading: boolean;
    error: string | null;
}

const initialState: EmployeesState = {
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
};

const employeesSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        clearSelectedEmployee(state) {
            state.selectedEmployee = null;
        },
        forceUpdate(state) {
            // This is a dummy reducer to force a state update
            state.loading = state.loading;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEmployees.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action: PayloadAction<Employee[]>) => {
                state.loading = false;
                state.employees = action.payload;
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(fetchEmployeeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployeeById.fulfilled, (state, action: PayloadAction<Employee>) => {
                state.loading = false;
                const employeeData = {
                    ...action.payload,
                    folders: Array.isArray(action.payload.folders) ? action.payload.folders : []
                };
                state.selectedEmployee = employeeData;
            })
            .addCase(fetchEmployeeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(addEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addEmployee.fulfilled, (state, action: PayloadAction<Employee>) => {
                state.loading = false;
                state.employees.unshift(action.payload);
            })
            .addCase(addEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(updateEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<Employee>) => {
                state.loading = false;
                state.employees = state.employees.map(emp => emp._id === action.payload._id ? action.payload : emp);
                if (state.selectedEmployee && state.selectedEmployee._id === action.payload._id) {
                    state.selectedEmployee = action.payload;
                }
            })
            .addCase(updateEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(deleteEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteEmployee.fulfilled, (state, action: PayloadAction<string>) => {
                state.loading = false;
                state.employees = state.employees.filter(emp => emp._id !== action.payload);
                if (state.selectedEmployee && state.selectedEmployee._id === action.payload) {
                    state.selectedEmployee = null;
                }
            })
            .addCase(deleteEmployee.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as any;
            })
            .addCase(addFolder.fulfilled, (state, action: PayloadAction<Folder>) => {
                if (state.selectedEmployee) {
                    if (!state.selectedEmployee.folders) {
                        state.selectedEmployee.folders = [];
                    }
                    state.selectedEmployee.folders.push(action.payload);
                }
            })
            .addCase(renameFolder.fulfilled, (state, action: PayloadAction<Folder>) => {
                if (state.selectedEmployee?.folders) {
                    const updateFolder = (folders: Folder[]): boolean => {
                        for (let i = 0; i < folders.length; i++) {
                            if (folders[i].id === action.payload.id) {
                                folders[i] = action.payload;
                                return true;
                            }
                            if (folders[i].subfolders && updateFolder(folders[i].subfolders)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    updateFolder(state.selectedEmployee.folders);
                }
            })
            .addCase(deleteFolder.fulfilled, (state, action: PayloadAction<string>) => {
                if (state.selectedEmployee?.folders) {
                    const deleteFolderRecursive = (folders: Folder[]): boolean => {
                        for (let i = 0; i < folders.length; i++) {
                            if (folders[i].id === action.payload) {
                                folders.splice(i, 1);
                                return true;
                            }
                            if (folders[i].subfolders && deleteFolderRecursive(folders[i].subfolders)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    deleteFolderRecursive(state.selectedEmployee.folders);
                }
            })
            .addCase(addDocumentToFolder.fulfilled, (state, action: PayloadAction<DocumentFile>) => {
                if (state.selectedEmployee?.folders) {
                    const updateFolderWithDocument = (folders: Folder[]): Folder[] => {
                        return folders.map(folder => {
                            if (folder.id === action.payload.folderId) {
                                // Check if document already exists
                                const docExists = folder.documents.some(doc => doc.url === action.payload.url);
                                if (!docExists) {
                                    // Create new folder object with updated documents array
                                    return {
                                        ...folder,
                                        documents: [...(folder.documents || []), {
                                            url: action.payload.url,
                                            type: action.payload.type,
                                            name: action.payload.name,
                                            publicId: action.payload.publicId,
                                            folderId: folder.id,
                                            documentId: action.payload.documentId
                                        }]
                                    };
                                }
                            }
                            if (folder.subfolders && folder.subfolders.length > 0) {
                                // Recursively update subfolders
                                return {
                                    ...folder,
                                    subfolders: updateFolderWithDocument(folder.subfolders)
                                };
                            }
                            return folder;
                        });
                    };

                    // Update the entire folders array immutably
                    state.selectedEmployee.folders = updateFolderWithDocument(state.selectedEmployee.folders);
                }
            })
            .addCase(deleteDocumentFromFolder.fulfilled, (state, action: PayloadAction<string>) => {
                if (state.selectedEmployee?.folders) {
                    const deleteDocumentFromFolderRecursive = (folders: Folder[]): boolean => {
                        for (let i = 0; i < folders.length; i++) {
                            const docIndex = folders[i].documents.findIndex(doc => doc.url === action.payload);
                            if (docIndex !== -1) {
                                folders[i].documents.splice(docIndex, 1);
                                return true;
                            }
                            if (folders[i].subfolders && deleteDocumentFromFolderRecursive(folders[i].subfolders)) {
                                return true;
                            }
                        }
                        return false;
                    };
                    deleteDocumentFromFolderRecursive(state.selectedEmployee.folders);
                }
            });
    },
});

export const { clearSelectedEmployee, forceUpdate } = employeesSlice.actions;
export default employeesSlice.reducer; 