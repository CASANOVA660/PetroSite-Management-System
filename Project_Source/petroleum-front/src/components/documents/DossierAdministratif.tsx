import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DossierAdministratifProps {
    projectId: string;
}

const DossierAdministratif: React.FC<DossierAdministratifProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Dossier Administratif"
            title="Dossier Administratif"
            icon={<FolderIcon className="h-6 w-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DossierAdministratif); 