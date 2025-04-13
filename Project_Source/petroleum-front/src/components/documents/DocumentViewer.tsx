import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DocumentIcon, PhotoIcon, DocumentTextIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';
import { Document } from '../../store/slices/documentSlice';

interface DocumentViewerProps {
    document: Document;
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
    const cld = new Cloudinary({ cloud: { cloudName: 'dx9psug39' } });
    const [isLoading, setIsLoading] = useState(true);

    const isImage = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    };

    const isPDF = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    const isOfficeDocument = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '');
    };

    const getDocumentIcon = () => {
        if (isImage(document.name)) {
            return <PhotoIcon className="h-6 w-6 text-indigo-500" />;
        } else if (isPDF(document.name)) {
            return <DocumentTextIcon className="h-6 w-6 text-red-500" />;
        } else if (isOfficeDocument(document.name)) {
            const extension = document.name.split('.').pop()?.toLowerCase();
            if (['doc', 'docx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-6 w-6 text-blue-500" />;
            } else if (['xls', 'xlsx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-6 w-6 text-green-500" />;
            } else if (['ppt', 'pptx'].includes(extension || '')) {
                return <DocumentDuplicateIcon className="h-6 w-6 text-orange-500" />;
            }
        }
        return <DocumentIcon className="h-6 w-6 text-gray-500" />;
    };

    const getCloudinaryImage = (publicId: string) => {
        return cld
            .image(publicId)
            .format('auto')
            .quality('auto')
            .resize(auto().gravity(autoGravity()));
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Non spécifié';

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Non définie';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Date invalide';
            }
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date invalide';
        }
    };

    const handleDownload = async () => {
        try {
            // Show download feedback to user
            const button = window.document.querySelector('button[title="Télécharger"]');
            if (button) {
                const originalText = button.textContent || 'Télécharger';
                button.textContent = 'Téléchargement...';
                button.setAttribute('disabled', 'true');

                // Reset button after 3 seconds regardless of outcome
                setTimeout(() => {
                    button.textContent = originalText;
                    button.removeAttribute('disabled');
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

            if (button) {
                button.textContent = 'Téléchargé!';
            }
        } catch (error) {
            console.error('Download failed:', error);
            window.open(document.url, '_blank'); // Fallback to opening in new tab
        }
    };

    const onIframeLoad = () => {
        setIsLoading(false);
    };

    const renderDocument = () => {
        if (isImage(document.name)) {
            return (
                <div className="flex justify-center items-center h-full bg-white p-4">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                        </div>
                    )}
                    <AdvancedImage
                        cldImg={getCloudinaryImage(document.publicId)}
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            );
        }

        if (isPDF(document.name)) {
            return (
                <div className="h-full relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                        </div>
                    )}
                    <iframe
                        src={document.url}
                        className="w-full h-full"
                        title={document.name}
                        onLoad={onIframeLoad}
                    />
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full p-8 bg-white">
                <div className="p-6 mb-6 bg-gray-100 rounded-full shadow-sm">
                    {getDocumentIcon()}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{document.name}</h3>
                <p className="text-gray-500 mb-6 text-center">
                    Ce type de document ne peut pas être prévisualisé directement.
                </p>
                <button
                    onClick={handleDownload}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Télécharger le document
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-10 flex items-center justify-end p-4 pr-8">
            <div className="bg-white rounded-lg shadow-xl w-[calc(100%-300px)] h-[calc(90vh-80px)] ml-64 mt-16 flex flex-col overflow-hidden transition-opacity duration-300 ease-in-out opacity-100 z-50">
                <div className="flex items-center p-4 border-b border-gray-200">
                    <div className="flex items-center flex-1">
                        <PhotoIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-medium text-gray-800 truncate">
                            {document.name}
                        </h2>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={handleDownload}
                            className="mr-2 px-3 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                            title="Télécharger"
                        >
                            Télécharger
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                            aria-label="Fermer"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        {renderDocument()}
                    </div>

                    <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-gray-800 mb-5">Informations</h3>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">NOM DU FICHIER</h4>
                                    <p className="text-sm text-gray-800 break-all">{document.name}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">TYPE</h4>
                                    <p className="text-sm text-gray-800">{document.type || 'Non spécifié'}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">TAILLE</h4>
                                    <p className="text-sm text-gray-800">{formatFileSize(document.size)}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">DATE D'AJOUT</h4>
                                    <p className="text-sm text-gray-800">{formatDate(document.createdAt)}</p>
                                </div>

                                {document.uploadedBy && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">AJOUTÉ PAR</h4>
                                        <p className="text-sm text-gray-800">
                                            {document.uploadedBy.prenom} {document.uploadedBy.nom}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-1">CATÉGORIE</h4>
                                    <p className="text-sm text-gray-800">{document.category || 'Non catégorisé'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer; 