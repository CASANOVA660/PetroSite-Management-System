import { useState } from 'react';
import { XMarkIcon, FolderIcon, DocumentIcon, PlusCircleIcon, ArrowUpTrayIcon, DocumentDuplicateIcon, ArrowsUpDownIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Types
interface Employee {
    id: string;
    name: string;
    department: string;
    position: string;
    status: string;
    lastUpdated: string;
    profileImage?: string;
}

interface Folder {
    id: string;
    name: string;
    type: string;
    files: File[];
    subfolders: Folder[];
}

interface File {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadDate: string;
    preview?: string;
}

interface DocumentFolderViewProps {
    employee: Employee;
    onClose: () => void;
}

export default function DocumentFolderView({ employee, onClose }: DocumentFolderViewProps) {
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [path, setPath] = useState<Folder[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Mock folders and files - would be fetched from an API
    const rootFolders: Folder[] = [
        {
            id: 'folder-1',
            name: 'Documents Personnels',
            type: 'personal',
            files: [
                {
                    id: 'file-1',
                    name: 'Pièce d\'identité.pdf',
                    type: 'pdf',
                    size: '2.5 MB',
                    uploadedBy: 'Sarah Dupont',
                    uploadDate: '2023-09-15T10:30:00Z'
                },
                {
                    id: 'file-2',
                    name: 'Attestation de résidence.pdf',
                    type: 'pdf',
                    size: '1.2 MB',
                    uploadedBy: 'Marie Lambert',
                    uploadDate: '2023-10-22T14:15:00Z'
                }
            ],
            subfolders: []
        },
        {
            id: 'folder-2',
            name: 'Contrats',
            type: 'contract',
            files: [
                {
                    id: 'file-3',
                    name: 'Contrat Initial.pdf',
                    type: 'pdf',
                    size: '3.1 MB',
                    uploadedBy: 'Sarah Dupont',
                    uploadDate: '2021-03-15T09:00:00Z'
                },
                {
                    id: 'file-4',
                    name: 'Avenant - 2022.pdf',
                    type: 'pdf',
                    size: '1.8 MB',
                    uploadedBy: 'Thomas Martin',
                    uploadDate: '2022-04-10T11:20:00Z'
                }
            ],
            subfolders: []
        },
        {
            id: 'folder-3',
            name: 'Évaluations',
            type: 'evaluation',
            files: [
                {
                    id: 'file-5',
                    name: 'Évaluation - 2022.pdf',
                    type: 'pdf',
                    size: '4.2 MB',
                    uploadedBy: 'Thomas Martin',
                    uploadDate: '2022-12-15T16:45:00Z'
                }
            ],
            subfolders: [
                {
                    id: 'subfolder-1',
                    name: 'Objectifs',
                    type: 'objectives',
                    files: [
                        {
                            id: 'file-6',
                            name: 'Objectifs 2023.docx',
                            type: 'docx',
                            size: '1.5 MB',
                            uploadedBy: 'Thomas Martin',
                            uploadDate: '2023-01-15T14:30:00Z'
                        }
                    ],
                    subfolders: []
                }
            ]
        }
    ];

    // Navigate to a folder
    const handleOpenFolder = (folder: Folder) => {
        setPath(currentFolder ? [...path, currentFolder] : []);
        setCurrentFolder(folder);
    };

    // Navigate back one level
    const handleBack = () => {
        if (path.length > 0) {
            // Go back to the previous folder
            const previousFolder = path[path.length - 1];
            setCurrentFolder(previousFolder);
            setPath(path.slice(0, -1));
        } else {
            // Back to root
            setCurrentFolder(null);
            setPath([]);
        }
    };

    // Navigate to root
    const handleHomeClick = () => {
        setCurrentFolder(null);
        setPath([]);
    };

    // Format date string
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get file icon based on file type
    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return (
                    <div className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                        <DocumentIcon className="h-5 w-5" />
                    </div>
                );
            case 'docx':
                return (
                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <DocumentIcon className="h-5 w-5" />
                    </div>
                );
            default:
                return (
                    <div className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                        <DocumentIcon className="h-5 w-5" />
                    </div>
                );
        }
    };

    // Get folder icon based on folder type
    const getFolderIcon = (folderType: string) => {
        const colorMap: Record<string, string> = {
            personal: 'text-blue-500 bg-blue-100',
            contract: 'text-green-500 bg-green-100',
            evaluation: 'text-orange-500 bg-orange-100',
            objectives: 'text-purple-500 bg-purple-100'
        };

        const bgColor = colorMap[folderType] || 'text-gray-500 bg-gray-100';

        return (
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bgColor}`}>
                <FolderIcon className="h-5 w-5" />
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative h-full flex flex-col"
        >
            {/* Header with title and close button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Documents de {employee.name}</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 flex flex-wrap gap-3 mb-4">
                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700">
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    <span>Importer</span>
                </button>
                <button className="px-3 py-1.5 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-500">
                    <FolderPlusIcon className="h-4 w-4" />
                    <span>Nouveau Dossier</span>
                </button>
                <div className="ml-auto flex items-center">
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-slate-500"
                    >
                        <ArrowsUpDownIcon className="h-4 w-4" />
                        <span>Vue {viewMode === 'grid' ? 'Liste' : 'Grille'}</span>
                    </button>
                </div>
            </div>

            {/* Navigation breadcrumbs */}
            <div className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                <button
                    onClick={handleHomeClick}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                    Racine
                </button>
                {path.map((folder, index) => (
                    <div key={folder.id} className="flex items-center">
                        <span className="mx-1">/</span>
                        <button
                            onClick={() => {
                                // Navigate to this specific point in path
                                setCurrentFolder(folder);
                                setPath(path.slice(0, index));
                            }}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {folder.name}
                        </button>
                    </div>
                ))}
                {currentFolder && (
                    <>
                        <span className="mx-1">/</span>
                        <span className="font-medium text-gray-900 dark:text-white">{currentFolder.name}</span>
                    </>
                )}
            </div>

            {/* Folder Contents */}
            <div className="flex-1 overflow-y-auto">
                {/* Show current folder contents or root folders */}
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'}>
                    {/* Folders */}
                    {(currentFolder?.subfolders || (!currentFolder ? rootFolders : [])).map((folder: Folder) => (
                        <div
                            key={folder.id}
                            onClick={() => handleOpenFolder(folder)}
                            className={
                                viewMode === 'grid'
                                    ? 'p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center'
                                    : 'p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex items-center'
                            }
                        >
                            {getFolderIcon(folder.type)}
                            <div className={viewMode === 'grid' ? 'mt-2 text-center' : 'ml-3 flex-1'}>
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {folder.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {folder.files.length} fichier{folder.files.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            {viewMode === 'list' && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                    Dossier
                                </span>
                            )}
                        </div>
                    ))}

                    {/* Files */}
                    {currentFolder?.files.map(file => (
                        <div
                            key={file.id}
                            className={
                                viewMode === 'grid'
                                    ? 'p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center'
                                    : 'p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex items-center'
                            }
                        >
                            {getFileIcon(file.type)}
                            <div className={viewMode === 'grid' ? 'mt-2 text-center' : 'ml-3 flex-1'}>
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {file.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {file.size} • {formatDate(file.uploadDate)}
                                </div>
                            </div>
                            {viewMode === 'list' && (
                                <div className="flex gap-2">
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                        <DocumentDuplicateIcon className="h-4 w-4" />
                                    </button>
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Empty state */}
                    {currentFolder && currentFolder.files.length === 0 && currentFolder.subfolders.length === 0 && (
                        <div className="col-span-full p-8 text-center">
                            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <FolderIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun fichier</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Ce dossier est vide. Commencez par ajouter des fichiers.
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                                    Ajouter des fichiers
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
} 