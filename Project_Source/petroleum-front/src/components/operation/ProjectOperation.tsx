import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardDocumentListIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import OperationEquipment from './OperationEquipment';
import OperationEmployees from './OperationEmployees';
import OperationShifts from './OperationShifts';

interface ProjectOperationProps {
    projectId: string;
}

const ProjectOperation: React.FC<ProjectOperationProps> = ({ projectId }) => {
    const [activeTab, setActiveTab] = useState<'shifts' | 'employees' | 'equipment'>('shifts');

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('shifts')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center whitespace-nowrap ${activeTab === 'shifts'
                                ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
                            }`}
                        aria-current={activeTab === 'shifts' ? 'page' : undefined}
                    >
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Quarts de Travail
                    </button>

                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center whitespace-nowrap ${activeTab === 'employees'
                                ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
                            }`}
                        aria-current={activeTab === 'employees' ? 'page' : undefined}
                    >
                        <UserGroupIcon className="h-5 w-5 mr-2" />
                        Personnel
                    </button>

                    <button
                        onClick={() => setActiveTab('equipment')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center whitespace-nowrap ${activeTab === 'equipment'
                                ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-700'
                            }`}
                        aria-current={activeTab === 'equipment' ? 'page' : undefined}
                    >
                        <WrenchScrewdriverIcon className="h-5 w-5 mr-2" />
                        Équipement
                    </button>
                </nav>
            </div>

            <div className="p-6">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'shifts' && <OperationShifts projectId={projectId} />}
                    {activeTab === 'employees' && <OperationEmployees projectId={projectId} />}
                    {activeTab === 'equipment' && <OperationEquipment projectId={projectId} />}
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectOperation; 