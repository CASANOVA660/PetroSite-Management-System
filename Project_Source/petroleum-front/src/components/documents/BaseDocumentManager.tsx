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

const BaseDocumentManager: React.FC<BaseDocumentManagerProps> = ({ projectId, category, title, icon }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { documents, loading, error } = useSelector((state: RootState) => state.documents);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    // Memoize the fetch documents call based on category
    const fetchProjectDocuments = useCallback(() => {
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
        }
    }, [dispatch, projectId, category]);

    useEffect(() => {
        fetchProjectDocuments();
    }, [fetchProjectDocuments]);

    // BaseDocumentManager.tsx
    const handleUpload = useCallback(async (documentData: CreateDocumentData) => {
        try {
            console.log('[DEBUG] Actual category:', category); // Check exact value

            switch (category) {
                case 'Dossier Administratif':
                    console.log('[DEBUG] Dispatching uploadDossierAdministratif');
                    await dispatch(uploadDossierAdministratif(documentData)).unwrap();
                    break;
                // ... other cases
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }, [dispatch, category, fetchProjectDocuments]);

    const handleViewDocument = useCallback((document: Document) => {
        setSelectedDocument(document);
        setShowViewer(true);
    }, []);

    const handleCloseViewer = useCallback(() => {
        setShowViewer(false);
        setSelectedDocument(null);
    }, []);

    // Memoize filtered documents with strict category matching
    const filteredDocuments = useMemo(() => {
        return documents?.filter(doc => doc.category === category) || [];
    }, [documents, category]);

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
                    documents={filteredDocuments}
                    onViewDocument={handleViewDocument}
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

export default React.memo(BaseDocumentManager);