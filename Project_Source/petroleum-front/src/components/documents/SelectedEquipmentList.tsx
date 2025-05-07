import React from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import { useNavigate } from 'react-router-dom';

interface SelectedEquipment {
    equipment: Equipment;
    description: string;
}

interface SelectedEquipmentListProps {
    equipment: SelectedEquipment[];
    onRemove: (equipmentId: string) => void;
}

const SelectedEquipmentList: React.FC<SelectedEquipmentListProps> = ({ equipment, onRemove }) => {
    const navigate = useNavigate();

    const handleViewDetails = (equipmentId: string) => {
        navigate(`/equipments/${equipmentId}`);
    };

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {equipment.map((item) => (
                    <motion.div
                        key={item.equipment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {item.equipment.nom}
                                    </h4>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${equipmentStatusColors[item.equipment.status]}`}>
                                        {equipmentStatusLabels[item.equipment.status]}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">Référence:</span> {item.equipment.reference}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">Matricule:</span> {item.equipment.matricule}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">Emplacement:</span> {item.equipment.location}
                                    </p>
                                    {item.description && (
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-md">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {item.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-3 ml-4">
                                <button
                                    onClick={() => handleViewDetails(item.equipment._id)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <EyeIcon className="h-4 w-4 mr-2" />
                                    Voir détails
                                </button>
                                <button
                                    onClick={() => onRemove(item.equipment._id)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    <XMarkIcon className="h-4 w-4 mr-2" />
                                    Retirer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SelectedEquipmentList; 