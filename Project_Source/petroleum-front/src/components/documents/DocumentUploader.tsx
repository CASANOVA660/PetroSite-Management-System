import React, { useCallback, useState } from 'react';
import { CreateDocumentData } from '../../store/slices/documentSlice';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { DocumentIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';


interface DocumentUploaderProps {
    projectId: string;
    category: 'Documents globale' | 'Dossier Administratif' | 'Dossier Technique' | 'Dossier RH' | 'Dossier HSE';
    onUpload: (documentData: CreateDocumentData) => Promise<void>;
}

interface UploadingFile {
    name: string;
    size: string;
    progress: number;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ projectId, category, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadingFiles([{
            name: selectedFile.name,
            size: formatFileSize(selectedFile.size),
            progress: 0
        }]);

        try {
            const documentData: CreateDocumentData = {
                file: selectedFile,
                projectId,
                category,
                name: selectedFile.name
            };

            // Override XHR to track progress
            const originalXHR = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function () {
                this.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadingFiles(prev => {
                            const newFiles = [...prev];
                            if (newFiles[0]) {
                                newFiles[0].progress = percentComplete;
                            }
                            return newFiles;
                        });
                    }
                });
                originalXHR.apply(this, arguments as any);
            };

            await onUpload(documentData);
            XMLHttpRequest.prototype.open = originalXHR;

            toast.success('Document uploadé avec succès');
            setSelectedFile(null);
        } catch (error) {
            console.error('[ERROR] Error uploading document:', error);
            toast.error('Erreur lors de l\'upload du document');
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadingFiles([]);
            }, 1000);
        }
    }, [onUpload, projectId, category, selectedFile]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                {selectedFile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <DocumentIcon className="h-8 w-8 text-[#F28C38]" />
                            <span className="text-gray-900 dark:text-white">{selectedFile.name}</span>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#F28C38]/90 transition-colors disabled:opacity-50"
                            >
                                {isUploading ? 'Upload en cours...' : 'Upload'}
                            </button>
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                        <div className="space-y-2">
                            <PlusIcon className="h-12 w-12 text-[#F28C38] mx-auto" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Glissez et déposez votre fichier ici, ou cliquez pour sélectionner
                            </p>
                        </div>
                    </label>
                )}
            </div>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mt-4"
                >
                    {uploadingFiles.map((file, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{file.size}</span>
                            </div>
                            <div className="relative pt-1">
                                <div className="flex items-center justify-between">
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${file.progress}%` }}
                                            className="bg-[#F28C38] h-2 rounded-full transition-all duration-300 ease-out"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2 min-w-[40px] text-right">
                                        {file.progress}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default React.memo(DocumentUploader);