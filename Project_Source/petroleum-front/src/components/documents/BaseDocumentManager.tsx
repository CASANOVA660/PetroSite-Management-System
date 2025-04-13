import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    fetchDocumentsGlobale,
    fetchDossierAdministratif,
    fetchDossierTechnique,
    fetchDossierRH,
    fetchDossierHSE,
    uploadDocumentsGlobale,
    uploadDossierAdministratif,
    uploadDossierTechnique,
    uploadDossierRH,
    uploadDossierHSE,
    Document,
    CreateDocumentData
} from '../../store/slices/documentSlice';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';
import DocumentViewer from './DocumentViewer';

interface BaseDocumentManagerProps {
    projectId: string;
    category: 'Documents globale' | 'Dossier Administratif' | 'Dossier Technique' | 'Dossier RH' | 'Dossier HSE';
    title: string;
    icon: React.ReactNode;
}

// ... existing code ...
const BaseDocumentManager: React.FC<BaseDocumentManagerProps> = ({ projectId, category, title, icon }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { documentsByCategory, loading, error } = useSelector((state: RootState) => state.documents);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    // Memoize the fetch documents call based on category
    const fetchProjectDocuments = useCallback(() => {
        console.log(`[DEBUG] Fetching documents for category: ${category}`);
        switch (category) {
            case 'Documents globale':
                dispatch(fetchDocumentsGlobale(projectId));
                break;
            case 'Dossier Administratif':
                dispatch(fetchDossierAdministratif(projectId));
                break;
            case 'Dossier Technique':
                dispatch(fetchDossierTechnique(projectId));
                break;
            case 'Dossier RH':
                dispatch(fetchDossierRH(projectId));
                break;
            case 'Dossier HSE':
                dispatch(fetchDossierHSE(projectId));
                break;
            default:
                console.error(`[ERROR] Unknown category for fetch: ${category}`);
        }
    }, [dispatch, projectId, category]);

    useEffect(() => {
        fetchProjectDocuments();
    }, [fetchProjectDocuments]);

    const handleUpload = useCallback(async (documentData: CreateDocumentData) => {
        try {
            console.log(`[DEBUG] Starting upload for category: ${category}`);
            console.log(`[DEBUG] Document data:`, documentData);

            // Ensure we use the category from the component props
            const uploadData = {
                ...documentData,
                category // This ensures we use the correct category from the component
            };

            console.log(`[DEBUG] Final upload data:`, uploadData);

            // Use the correct upload action based on category
            switch (category) {
                case 'Documents globale':
                    await dispatch(uploadDocumentsGlobale(uploadData)).unwrap();
                    break;
                case 'Dossier Administratif':
                    await dispatch(uploadDossierAdministratif(uploadData)).unwrap();
                    break;
                case 'Dossier Technique':
                    await dispatch(uploadDossierTechnique(uploadData)).unwrap();
                    break;
                case 'Dossier RH':
                    await dispatch(uploadDossierRH(uploadData)).unwrap();
                    break;
                case 'Dossier HSE':
                    await dispatch(uploadDossierHSE(uploadData)).unwrap();
                    break;
                default:
                    console.error(`[ERROR] Unknown category: ${category}`);
                    throw new Error(`Unknown category: ${category}`);
            }

            console.log(`[DEBUG] Upload successful for category: ${category}`);
            fetchProjectDocuments();
        } catch (error) {
            console.error(`[ERROR] Upload failed for category ${category}:`, error);
            throw error;
        }
    }, [dispatch, fetchProjectDocuments, category]);

    const handleViewDocument = useCallback((document: Document) => {
        setSelectedDocument(document);
        setShowViewer(true);
    }, []);

    const handleCloseViewer = useCallback(() => {
        setShowViewer(false);
        setSelectedDocument(null);
    }, []);

    // Get documents for the current category
    const documents = documentsByCategory[category] || [];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center py-4">
                Une erreur est survenue lors du chargement des documents: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    {icon}
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>
                <DocumentUploader
                    projectId={projectId}
                    category={category}
                    onUpload={handleUpload}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <DocumentList
                    documents={documents}
                    onViewDocument={handleViewDocument}
                    onAddDocument={() => {
                        // This will open the document uploader or show a form
                        console.log("Add document clicked for category:", category);
                        // You can implement the logic to show the document uploader here
                    }}
                />
            </div>

            {showViewer && selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    onClose={handleCloseViewer}
                />
            )}
        </div>
    );
};
// ... existing code ...

export default React.memo(BaseDocumentManager);