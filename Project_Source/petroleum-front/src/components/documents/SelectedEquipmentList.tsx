import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Equipment } from '../../types/equipment';

interface SelectedEquipment {
    equipment: Equipment;
    description: string;
}

interface SelectedEquipmentListProps {
    equipment: SelectedEquipment[];
    onRemove: (equipmentId: string) => void;
}

const SelectedEquipmentList: React.FC<SelectedEquipmentListProps> = ({ equipment, onRemove }) => {
    return (
        <div className="space-y-4">
            <AnimatePresence>
                {equipment.map((item) => (
                    <motion.div
                        key={item.equipment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-gray-700 rounded-lg shadow p-4"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {item.equipment.nom}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {item.equipment.reference}
                                </p>
                                {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onRemove(item.equipment._id)}
                                className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SelectedEquipmentList; 