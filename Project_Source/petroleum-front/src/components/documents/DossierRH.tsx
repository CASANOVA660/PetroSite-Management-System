import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DossierRHProps {
    projectId: string;
}

const DossierRH: React.FC<DossierRHProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Dossier RH"
            title="Dossier RH"
            icon={<UserGroupIcon className="h-6 w-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DossierRH); 