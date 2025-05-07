import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';
import { motion } from 'framer-motion';

interface DossierHSEProps {
    projectId: string;
}

const DossierHSE: React.FC<DossierHSEProps> = ({ projectId }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
            <BaseDocumentManager
                projectId={projectId}
                category="Dossier HSE"
                title="Dossier HSE"
                icon={<ShieldCheckIcon className="w-6 h-6 text-[#F28C38]" />}
            />
        </motion.div>
    );
};

export default React.memo(DossierHSE); 