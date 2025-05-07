import React, { useMemo, useState } from 'react';
import { DocumentIcon, EyeIcon, ArrowDownTrayIcon, PhotoIcon, DocumentTextIcon, DocumentDuplicateIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';
import { Document } from '../../store/slices/documentSlice';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentListProps {
    documents: Document[];
    onViewDocument: (document: Document) => void;
    onAddDocument?: () => void;
}

interface CategoryDisplayInfo {
    name: string;
    order: number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
}

type CategoryDisplayMap = {
    [key: string]: CategoryDisplayInfo;
};

const DocumentList: React.FC<DocumentListProps> = ({ documents, onViewDocument, onAddDocument }) => {
    const cld = new Cloudinary({ cloud: { cloudName: 'dx9psug39' } });
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date non définie';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Date invalide';
            }
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date invalide';
        }
    };

    const getFileIcon = (type: string | undefined, name: string) => {
        if (!type) {
            // If type is undefined, try to determine from name
            const extension = name.split('.').pop()?.toLowerCase();
            if (extension === 'pdf') {
                return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
            } else if (['doc', 'docx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />;
            } else if (['xls', 'xlsx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-5 w-5 text-green-500" />;
            } else if (['ppt', 'pptx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-5 w-5 text-orange-500" />;
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
                return <PhotoIcon className="h-5 w-5 text-indigo-500" />;
            }
            return <DocumentIcon className="h-5 w-5 text-gray-500" />;
        }

        if (type.startsWith('image/')) {
            return <PhotoIcon className="h-5 w-5 text-indigo-500" />;
        } else if (type === 'application/pdf') {
            return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
        } else if (type.includes('word')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />;
        } else if (type.includes('excel') || type.includes('spreadsheet')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-green-500" />;
        } else if (type.includes('powerpoint') || type.includes('presentation')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-orange-500" />;
        }

        // Fallback to extension-based detection
        const extension = name.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
            return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
        } else if (['doc', 'docx'].includes(extension || '')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />;
        } else if (['xls', 'xlsx'].includes(extension || '')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-green-500" />;
        } else if (['ppt', 'pptx'].includes(extension || '')) {
            return <DocumentDuplicateIcon className="h-5 w-5 text-orange-500" />;
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            return <PhotoIcon className="h-5 w-5 text-indigo-500" />;
        }

        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    };

    const handleDownload = async (document: Document) => {
        try {
            const downloadButton = window.document.querySelector(`button[data-document-id="${document._id}"]`);

            if (downloadButton) {
                const downloadIcon = downloadButton.querySelector('svg');
                const downloadText = downloadButton.querySelector('span');

                if (downloadText) {
                    downloadText.textContent = 'Téléchargement...';
                }

                downloadButton.setAttribute('disabled', 'true');

                // Reset button after 3 seconds regardless of outcome
                setTimeout(() => {
                    if (downloadText) {
                        downloadText.innerHTML = '<span class="flex items-center"><svg class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-2.25m-4.5-9l-4.5 4.5m0 0l-4.5-4.5m4.5 4.5V3"></path></svg>Télécharger</span>';
                    }
                    downloadButton.removeAttribute('disabled');
                }, 3000);
            }

            // Fetch the file as a blob
            const response = await fetch(document.url);
            const blob = await response.blob();

            // Create a local URL for the blob
            const blobUrl = window.URL.createObjectURL(blob);

            // Create download link
            const link = window.document.createElement('a');
            link.href = blobUrl;
            link.download = document.name;
            link.style.display = 'none';
            window.document.body.appendChild(link);
            link.click();

            // Clean up
            window.document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            if (downloadButton) {
                const downloadText = downloadButton.querySelector('span');
                if (downloadText) {
                    downloadText.textContent = 'Téléchargé!';
                }
            }
        } catch (error) {
            console.error('Download failed:', error);
            window.open(document.url, '_blank'); // Fallback to opening in new tab
        }
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));

        if (activeCategory === category) {
            setActiveCategory(null);
        } else {
            setActiveCategory(category);
        }
    };

    // Define categories display data
    const categoryDisplay: CategoryDisplayMap = {
        'Documents globale': {
            name: 'Documents Globaux',
            order: 1,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            icon: <FolderIcon className="h-6 w-6 text-blue-600" />
        },
        'Dossier Administratif': {
            name: 'Dossier Administratif',
            order: 2,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            icon: <FolderIcon className="h-6 w-6 text-emerald-600" />
        },
        'Dossier Technique': {
            name: 'Dossier Technique',
            order: 3,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            icon: <FolderIcon className="h-6 w-6 text-amber-600" />
        },
        'Dossier RH': {
            name: 'Dossier RH',
            order: 4,
            color: 'text-rose-600',
            bgColor: 'bg-rose-50',
            borderColor: 'border-rose-200',
            icon: <FolderIcon className="h-6 w-6 text-rose-600" />
        },
        'Dossier HSE': {
            name: 'Dossier HSE',
            order: 5,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            icon: <FolderIcon className="h-6 w-6 text-purple-600" />
        },
        'Autres': {
            name: 'Autres Documents',
            order: 6,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            icon: <FolderIcon className="h-6 w-6 text-gray-600" />
        }
    };

    // Group documents by category
    const documentsByCategory = useMemo(() => {
        const categories: Record<string, Document[]> = {};

        // Sort documents by date (newest first)
        const sortedDocs = [...documents].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        sortedDocs.forEach(doc => {
            const category = doc.category || 'Autres';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(doc);
        });

        return categories;
    }, [documents]);

    // Initialize expanded state
    useMemo(() => {
        const initialState: Record<string, boolean> = {};
        Object.keys(documentsByCategory).forEach(category => {
            initialState[category] = false;
        });
        if (Object.keys(expandedCategories).length === 0) {
            setExpandedCategories(initialState);
        }
    }, [documentsByCategory]);

    // Sort categories by order
    const sortedCategories = useMemo(() => {
        return Object.entries(documentsByCategory).sort((a, b) => {
            const orderA = categoryDisplay[a[0]]?.order || 999;
            const orderB = categoryDisplay[b[0]]?.order || 999;
            return orderA - orderB;
        });
    }, [documentsByCategory]);

    if (documents.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center">
                <div className="mb-4 p-4 rounded-full bg-gray-100">
                    <FolderIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun document disponible</h3>
                <p className="text-gray-500 text-center mb-4">
                    Commencez par ajouter des documents à cette catégorie
                </p>

            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
                <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                    <button
                        onClick={() => toggleCategory(category)}
                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${activeCategory === category
                            ? 'bg-gray-50 dark:bg-gray-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            {categoryDisplay[category]?.icon || <FolderIcon className="h-6 w-6 text-gray-500" />}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {categoryDisplay[category]?.name || category}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({docs.length})
                            </span>
                        </div>
                        {expandedCategories[category] ? (
                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                        )}
                    </button>

                    <AnimatePresence>
                        {expandedCategories[category] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {docs.map((doc, index) => (
                                        <motion.div
                                            key={doc._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {getFileIcon(doc.type, doc.name)}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {doc.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(doc.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => onViewDocument(doc)}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                    >
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(doc)}
                                                        data-document-id={doc._id}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                    >
                                                        <span className="flex items-center">
                                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

export default React.memo(DocumentList); 