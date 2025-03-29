import React, { useMemo } from 'react';
import { DocumentIcon, EyeIcon, ArrowDownTrayIcon, PhotoIcon, DocumentTextIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';
import { Document } from '../../store/slices/documentSlice';

interface DocumentListProps {
    documents: Document[];
    onViewDocument: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onViewDocument }) => {
    const cld = new Cloudinary({ cloud: { cloudName: 'dx9psug39' } });

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

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <PhotoIcon className="h-6 w-6 text-[#F28C38]" />;
        } else if (type === 'application/pdf') {
            return <DocumentTextIcon className="h-6 w-6 text-[#F28C38]" />;
        } else if (type.includes('word') || type.includes('excel') || type.includes('powerpoint')) {
            return <DocumentDuplicateIcon className="h-6 w-6 text-[#F28C38]" />;
        }
        return <DocumentIcon className="h-6 w-6 text-[#F28C38]" />;
    };

    const isImage = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    };

    const getCloudinaryImage = (publicId: string) => {
        return cld
            .image(publicId)
            .format('auto')
            .quality('auto')
            .resize(auto().gravity(autoGravity()).width(200).height(200));
    };

    const handleDownload = (document: Document) => {
        window.open(document.url, '_blank');
    };

    const sortedDocuments = useMemo(() => {
        return [...documents].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [documents]);

    if (documents.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4">
                Aucun document dans cette catégorie
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDocuments.map((document) => (
                <div
                    key={document._id}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            {getFileIcon(document.type || '')}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {document.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(document.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDownload(document)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full"
                            title="Télécharger"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-500 hover:text-[#F28C38]" />
                        </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={() => onViewDocument(document)}
                            className="text-sm text-[#F28C38] hover:text-orange-600"
                        >
                            Voir
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DocumentList; 