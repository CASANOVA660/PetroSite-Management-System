import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DossierHSEProps {
    projectId: string;
}

const DossierHSE: React.FC<DossierHSEProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Dossier HSE"
            title="Dossier HSE"
            icon={<ShieldCheckIcon className="w-6 h-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DossierHSE); 