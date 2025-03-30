import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DocumentsGlobaleProps {
    projectId: string;
}

const DocumentsGlobale: React.FC<DocumentsGlobaleProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Documents globale"
            title="Documents globale"
            icon={<FolderIcon className="w-6 h-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DocumentsGlobale); 