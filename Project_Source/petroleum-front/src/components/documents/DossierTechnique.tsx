import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';

interface DossierTechniqueProps {
    projectId: string;
}

const DossierTechnique: React.FC<DossierTechniqueProps> = ({ projectId }) => {
    return (
        <BaseDocumentManager
            projectId={projectId}
            category="Dossier Technique"
            title="Dossier Technique"
            icon={<WrenchScrewdriverIcon className="w-6 h-6 text-[#F28C38]" />}
        />
    );
};

export default React.memo(DossierTechnique);


