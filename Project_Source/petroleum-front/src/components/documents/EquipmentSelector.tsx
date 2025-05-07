import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import { toast } from 'react-hot-toast';

interface EquipmentSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (equipment: { equipment: Equipment; description: string }[]) => void;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { equipment, loading, error } = useSelector((state: RootState) => state.equipment);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState<{ equipment: Equipment; description: string }[]>([]);
    const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchEquipment());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    useEffect(() => {
        const filtered = equipment.filter(item =>
            item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.reference.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEquipment(filtered);
    }, [searchTerm, equipment]);

    const handleSelect = (item: Equipment) => {
        if (!selectedEquipment.some(selected => selected.equipment._id === item._id)) {
            setSelectedEquipment([...selectedEquipment, { equipment: item, description: descriptions[item._id] || '' }]);
        }
    };

    const handleRemove = (equipmentId: string) => {
        setSelectedEquipment(selectedEquipment.filter(item => item.equipment._id !== equipmentId));
        const newDescriptions = { ...descriptions };
        delete newDescriptions[equipmentId];
        setDescriptions(newDescriptions);
    };

    const handleDescriptionChange = (equipmentId: string, description: string) => {
        setDescriptions(prev => ({ ...prev, [equipmentId]: description }));
        setSelectedEquipment(prev =>
            prev.map(item =>
                item.equipment._id === equipmentId
                    ? { ...item, description }
                    : item
            )
        );
    };

    const handleConfirm = () => {
        onSelect(selectedEquipment);
        setSelectedEquipment([]);
        setDescriptions({});
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-50 overflow-y-auto"
        >
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

                <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                            Sélectionner des équipements
                        </Dialog.Title>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher un équipement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Équipements disponibles
                            </h3>
                            {loading ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {filteredEquipment.map((item) => (
                                        <div
                                            key={item._id}
                                            onClick={() => handleSelect(item)}
                                            className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedEquipment.some(selected => selected.equipment._id === item._id)
                                                    ? 'bg-blue-50 dark:bg-blue-900'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {item.nom}
                                                </h4>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${equipmentStatusColors[item.status]}`}>
                                                    {equipmentStatusLabels[item.status]}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium">Référence:</span> {item.reference}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium">Matricule:</span> {item.matricule}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium">Emplacement:</span> {item.location}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Équipements sélectionnés
                            </h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {selectedEquipment.map(({ equipment: item, description }) => (
                                    <div
                                        key={item._id}
                                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {item.nom}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {item.reference}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemove(item._id);
                                                }}
                                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => handleDescriptionChange(item._id, e.target.value)}
                                            placeholder="Ajouter une description..."
                                            className="w-full mt-2 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedEquipment.length === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default EquipmentSelector; 