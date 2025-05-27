import React, { useState } from 'react';
import { UserGroupIcon, DocumentIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';
import { motion } from 'framer-motion';
import ProjectEmployees from '../projects/ProjectEmployees';

interface DossierRHProps {
    projectId: string;
}

const DossierRH: React.FC<DossierRHProps> = ({ projectId }) => {
    const [activeTab, setActiveTab] = useState<'documents' | 'employees'>('documents');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
            <div className="mb-6 border-b border-gray-200">
                <div className="flex space-x-4">
                    <button
                        className={`py-3 px-4 font-medium text-sm focus:outline-none ${activeTab === 'documents'
                                ? 'border-b-2 border-[#F28C38] text-[#F28C38]'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('documents')}
                    >
                        <div className="flex items-center space-x-2">
                            <DocumentIcon className="w-5 h-5" />
                            <span>Documents</span>
                        </div>
                    </button>
                    <button
                        className={`py-3 px-4 font-medium text-sm focus:outline-none ${activeTab === 'employees'
                                ? 'border-b-2 border-[#F28C38] text-[#F28C38]'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <div className="flex items-center space-x-2">
                            <UserGroupIcon className="w-5 h-5" />
                            <span>Équipe</span>
                        </div>
                    </button>
                </div>
            </div>

            {activeTab === 'documents' && (
                <BaseDocumentManager
                    projectId={projectId}
                    category="Dossier RH"
                    title="Documents RH"
                    icon={<UserGroupIcon className="w-6 h-6 text-[#F28C38]" />}
                />
            )}

            {activeTab === 'employees' && (
                <ProjectEmployees projectId={projectId} />
            )}
        </motion.div>
    );
};

export default React.memo(DossierRH); 