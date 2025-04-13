import React, { useCallback, useState } from 'react';
import { CreateDocumentData } from '../../store/slices/documentSlice';
import { toast } from 'react-hot-toast';


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

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);

        // Initialize upload progress tracking
        const initialUploadingFiles = files.map(file => ({
            name: file.name,
            size: formatFileSize(file.size),
            progress: 0
        }));
        setUploadingFiles(initialUploadingFiles);

        try {
            // Upload files one at a time with progress tracking
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Create a document data object
                const documentData: CreateDocumentData = {
                    file,
                    projectId,
                    category,
                    name: file.name
                };

                // Use the upload handler provided as prop with a custom progress handler
                const originalXHR = XMLHttpRequest.prototype.open;

                // Override the XHR to capture upload progress
                XMLHttpRequest.prototype.open = function () {
                    this.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = Math.round((event.loaded / event.total) * 100);
                            setUploadingFiles(prev => {
                                const newFiles = [...prev];
                                if (newFiles[i]) {
                                    newFiles[i].progress = percentComplete;
                                }
                                return newFiles;
                            });
                        }
                    });
                    originalXHR.apply(this, arguments as any);
                };

                // Call the provided upload handler
                await onUpload(documentData);

                // Restore original XHR
                XMLHttpRequest.prototype.open = originalXHR;
            }

            toast.success(`${files.length} document(s) uploadés avec succès`);
        } catch (error) {
            console.error('[ERROR] Error uploading document:', error);
            toast.error('Erreur lors de l\'upload du document');
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadingFiles([]);
                // Reset input to allow same file re-upload
                e.target.value = '';
            }, 1000); // Keep progress visible for a second after completion
        }
    }, [onUpload, projectId, category]);

    return (
        <div className="w-full">
            <div className="flex flex-col">
                <div className="flex items-center justify-end mb-4">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        id={`file-upload-${category}`}
                        onChange={handleFileInput}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor={`file-upload-${category}`}
                        className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${isUploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#F28C38] hover:bg-[#F28C38]/90 cursor-pointer text-white'
                            }`}
                    >
                        {isUploading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Upload en cours...
                            </span>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Ajouter un document
                            </>
                        )}
                    </label>
                </div>

                {/* Upload Progress Bars */}
                {uploadingFiles.length > 0 && (
                    <div className="space-y-4 mt-2">
                        {uploadingFiles.map((file, index) => (
                            <div key={index} className="border border-gray-200 rounded-md p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                    <span className="text-sm text-gray-500">{file.size}</span>
                                </div>
                                <div className="relative pt-1">
                                    <div className="flex items-center justify-between">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${file.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 ml-2 min-w-[40px] text-right">
                                            {file.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(DocumentUploader);