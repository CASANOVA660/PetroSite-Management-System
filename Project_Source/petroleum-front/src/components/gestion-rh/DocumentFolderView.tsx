import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
    addFolderAndRefresh,
    renameFolderAndRefresh,
    deleteFolderAndRefresh,
    addDocumentToFolderAndRefresh,
    deleteDocumentFromFolderAndRefresh,
    fetchEmployeeById,
    Employee,
    Folder,
    DocumentFile,
} from '../../store/slices/employeesSlice';
import { XMarkIcon, FolderIcon, DocumentIcon, PlusCircleIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, ArrowsUpDownIcon, FolderPlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface DocumentFolderViewProps {
    employeeId: string;
    onClose: () => void;
    maxTableHeight: number;
}

export default function DocumentFolderView({ employeeId, onClose, maxTableHeight }: DocumentFolderViewProps) {
    const dispatch = useDispatch<AppDispatch>();
    const employee = useSelector((state: RootState) => state.employees.selectedEmployee);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [path, setPath] = useState<Folder[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // Load employee data when component mounts
    useEffect(() => {
        console.log('🔄 DocumentFolderView mounted, loading employee data...');
        dispatch(fetchEmployeeById(employeeId));
    }, [dispatch, employeeId]);

    // Log employee data changes
    useEffect(() => {
        console.log('📝 Employee data updated:', employee);
        console.log('📁 Current folders:', employee?.folders);
    }, [employee]);

    // Helper to get folders/files for current view
    const getCurrentFolders = () => currentFolder ? currentFolder.subfolders : (employee?.folders || []);
    const getCurrentFiles = () => currentFolder ? currentFolder.documents : [];

    // Navigation
    const handleOpenFolder = (folder: Folder) => {
        setPath(currentFolder ? [...path, currentFolder] : []);
        setCurrentFolder(folder);
    };
    const handleBack = () => {
        if (path.length > 0) {
            const previousFolder = path[path.length - 1];
            setCurrentFolder(previousFolder);
            setPath(path.slice(0, -1));
        } else {
            setCurrentFolder(null);
            setPath([]);
        }
    };
    const handleHomeClick = () => {
        setCurrentFolder(null);
        setPath([]);
    };

    // Folder actions
    const handleAddFolder = async () => {
        if (!newFolderName.trim()) {
            alert('Le nom du dossier ne peut pas être vide.');
            return;
        }
        await dispatch(addFolderAndRefresh({ employeeId, name: newFolderName, parentId: currentFolder?.id || null }) as any);
        setNewFolderName('');
    };
    const handleRenameFolder = async (folderId: string) => {
        await dispatch(renameFolderAndRefresh({ employeeId, folderId, newName: renameValue }) as any);
        setRenamingFolderId(null);
        setRenameValue('');
    };
    const handleDeleteFolder = async (folderId: string) => {
        await dispatch(deleteFolderAndRefresh({ employeeId, folderId }) as any);
        if (currentFolder && currentFolder.id === folderId) handleBack();
    };

    // Document actions
    const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        if (!currentFolder?.id) {
            alert('Please select a folder first');
            return;
        }

        const file = e.target.files[0];
        console.log('[DEBUG] Uploading file:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        try {
            await dispatch(addDocumentToFolderAndRefresh({
                employeeId,
                folderId: currentFolder.id,
                file
            }) as any);

            // Reset input to allow same file re-upload
            e.target.value = '';
        } catch (error) {
            console.error('[ERROR] Error uploading document:', error);
            toast.error('Erreur lors de l\'upload du document');
        }
    };
    const handleDeleteDocument = async (url: string) => {
        await dispatch(deleteDocumentFromFolderAndRefresh({ employeeId, folderId: currentFolder?.id || '', url }) as any);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // File/folder icons
    const getFileIcon = (fileType: string) => (
        <div className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
            <DocumentIcon className="h-5 w-5" />
        </div>
    );
    const getFolderIcon = () => (
        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-500 bg-blue-100">
            <FolderIcon className="h-5 w-5" />
        </div>
    );

    // Recursive folder rendering
    const renderFolders = (folders: Folder[]) => folders.map(folder => (
        <div key={folder.id} className="relative group">
            <div onClick={() => handleOpenFolder(folder)} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md flex flex-col items-center">
                {getFolderIcon()}
                <div className="mt-2 text-center">
                    {renamingFolderId === folder.id ? (
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)} onBlur={() => handleRenameFolder(folder.id)} autoFocus className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-blue-500" />
                    ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                            {folder.name}
                            <button onClick={e => { e.stopPropagation(); setRenamingFolderId(folder.id); setRenameValue(folder.name); }} className="ml-1 text-xs text-blue-500"><PencilIcon className="h-3 w-3" /></button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="ml-1 text-xs text-red-500"><TrashIcon className="h-3 w-3" /></button>
                        </div>
                    )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{folder.documents.length} fichier{folder.documents.length !== 1 ? 's' : ''}</div>
            </div>
        </div>
    ));

    // File rendering
    const renderFiles = (files: DocumentFile[]) => files.map(file => (
        <div key={file.url} className="relative group">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                {getFileIcon(file.type || '')}
                <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{file.type}</div>
                </div>
                <button onClick={() => handleDeleteDocument(file.url)} className="absolute top-1 right-1 text-xs text-red-500"><TrashIcon className="h-4 w-4" /></button>
            </div>
        </div>
    ));

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="relative h-full flex flex-col" style={{ height: maxTableHeight }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Documents de {employee?.name}</h2>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 flex flex-wrap gap-3 mb-4">
                <label className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700 cursor-pointer">
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    <span>Importer</span>
                    <input type="file" className="hidden" onChange={handleUploadDocument} />
                </label>
                <div className="flex items-center gap-2">
                    <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nouveau dossier" className="px-2 py-1 rounded border text-sm" />
                    <button onClick={handleAddFolder} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-500">
                        <FolderPlusIcon className="h-4 w-4" />
                        <span>Créer</span>
                    </button>
                </div>
                <div className="ml-auto flex items-center">
                    <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="px-3 py-1.5 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-500">
                        <ArrowsUpDownIcon className="h-4 w-4" />
                        <span>Vue {viewMode === 'grid' ? 'Liste' : 'Grille'}</span>
                    </button>
                </div>
            </div>
            <div className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                <button onClick={handleHomeClick} className="hover:text-blue-600 dark:hover:text-blue-400">Racine</button>
                {path.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                        <span className="mx-1">/</span>
                        <button onClick={() => { setCurrentFolder(folder); setPath(path.slice(0, index)); }} className="hover:text-blue-600 dark:hover:text-blue-400">{folder.name}</button>
                    </div>
                ))}
                {currentFolder && <><span className="mx-1">/</span><span className="font-medium text-gray-900 dark:text-white">{currentFolder.name}</span></>}
            </div>
            <div className="flex-1">
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'}>
                    {renderFolders(getCurrentFolders())}
                    {renderFiles(getCurrentFiles())}
                    {getCurrentFolders().length === 0 && getCurrentFiles().length === 0 && (
                        <div className="col-span-full p-8 text-center">
                            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <FolderIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun fichier</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ce dossier est vide. Commencez par ajouter des fichiers.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
} 