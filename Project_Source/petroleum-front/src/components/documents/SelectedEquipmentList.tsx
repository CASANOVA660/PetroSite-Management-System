import React from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import { useNavigate } from 'react-router-dom';

interface SelectedEquipment {
    _id: string;
    equipment: Equipment | {
        _id: string;
        nom: string;
        reference: string;
        status: string;
    };
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
            <AnimatePresence mode="wait">
                {equipment.map((item) => (
                    <motion.div
                        key={`equipment-${item._id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
                    >
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {item.equipment.nom}
                                </h4>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${equipmentStatusColors[item.equipment.status as keyof typeof equipmentStatusColors]}`}>
                                    {equipmentStatusLabels[item.equipment.status as keyof typeof equipmentStatusLabels]}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-medium">Référence:</span> {item.equipment.reference}
                                </p>
                                {'matricule' in item.equipment && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">Matricule:</span> {item.equipment.matricule}
                                    </p>
                                )}
                                {'location' in item.equipment && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">Emplacement:</span> {item.equipment.location}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-medium">Description:</span> {item.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => handleViewDetails(item.equipment._id)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Voir détails
                            </button>
                            <button
                                onClick={() => onRemove(item._id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <XMarkIcon className="h-4 w-4 mr-2" />
                                Supprimer
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SelectedEquipmentList; 