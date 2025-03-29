import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DocumentsGlobaleProps {
    projectId: string;
}

const DocumentsGlobale: React.FC<DocumentsGlobaleProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Documents globale"
            title="Documents Globale"
            icon={<DocumentIcon className="h-6 w-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DocumentsGlobale); 