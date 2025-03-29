import React, { useCallback, useState } from 'react';
import { CreateDocumentData } from '../../store/slices/documentSlice';
import { toast } from 'react-hot-toast';

interface DocumentUploaderProps {
    projectId: string;
    category: 'Documents globale' | 'Dossier Administratif' | 'Dossier Technique' | 'Dossier RH' | 'Dossier HSE';
    onUpload: (documentData: CreateDocumentData) => Promise<void>;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ projectId, category, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of files) {
                console.log('Uploading file with category:', category);
                await onUpload({
                    file,
                    projectId,
                    category,
                    name: file.name
                });
                toast.success('Document uploadé avec succès');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error('Erreur lors de l\'upload du document');
        } finally {
            setIsUploading(false);
        }
    }, [onUpload, projectId, category]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-end">
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
                    className="inline-flex items-center px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#F28C38]/90 cursor-pointer"
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
        </div>
    );
};

export default React.memo(DocumentUploader);