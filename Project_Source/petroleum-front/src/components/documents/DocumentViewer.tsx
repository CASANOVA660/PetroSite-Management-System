import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

    const getCloudinaryImage = (publicId: string) => {
        return cld
            .image(publicId)
            .format('auto')
            .quality('auto')
            .resize(auto().gravity(autoGravity()).width(800).height(600));
    };

    const renderDocument = () => {
        if (isImage(document.name)) {
            return (
                <div className="flex justify-center items-center h-full">
                    <AdvancedImage
                        cldImg={getCloudinaryImage(document.publicId)}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            );
        }

        if (isPDF(document.name)) {
            return (
                <iframe
                    src={document.url}
                    className="w-full h-full"
                    title={document.name}
                />
            );
        }

        if (isOfficeDocument(document.name)) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-gray-500 mb-4">
                        Ce type de document ne peut pas être prévisualisé directement.
                    </p>
                    <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                    >
                        Télécharger le document
                    </a>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-4">
                    Ce type de document ne peut pas être prévisualisé directement.
                </p>
                <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                >
                    Télécharger le document
                </a>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {document.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                    {renderDocument()}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer; 