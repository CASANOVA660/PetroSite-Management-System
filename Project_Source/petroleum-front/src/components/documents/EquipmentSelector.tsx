import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import { toast } from 'react-hot-toast';
import axios from '../../utils/axios';

interface User {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
}

interface EquipmentSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (equipment: {
        equipment: Equipment;
        description: string;
        needsValidation?: boolean;
        validationReason?: string;
        chefDeBaseId?: string;
        dossierType: string;
    }[]) => void;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { equipment, loading, error } = useSelector((state: RootState) => state.equipment);
    const { users } = useSelector((state: RootState) => state.users);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState<{
        equipment: Equipment;
        description: string;
        dossierType: string;
    }[]>([]);
    const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
    const [dossierTypes, setDossierTypes] = useState<{ [key: string]: string }>({});
    const [validationRequests, setValidationRequests] = useState<{
        [key: string]: {
            needsValidation: boolean;
            validationReason: string;
            chefDeBaseId: string;
        }
    }>({});
    const [allocatedEquipment, setAllocatedEquipment] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchEquipment());
            dispatch(fetchUsers());
            checkAllocatedEquipment();
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

    // Check if equipment is allocated to any project
    const checkAllocatedEquipment = async () => {
        try {
            const response = await axios.get('/equipment/active');
            const allocated: { [key: string]: string } = {};

            if (response.data?.data) {
                response.data.data.forEach((eq: any) => {
                    // Check for both uppercase and lowercase status formats
                    if (eq.status === 'working_non_disponible' ||
                        eq.status === 'IN_USE' ||
                        eq.status === 'WORKING_NON_DISPONIBLE') {
                        allocated[eq._id] = eq.projectName || 'un autre projet';
                    }
                });
            }

            setAllocatedEquipment(allocated);
        } catch (error) {
            console.error('Error checking allocated equipment:', error);
        }
    };

    const handleSelect = (item: Equipment) => {
        // Check if equipment is allocated
        if (allocatedEquipment[item._id]) {
            toast.error(`Cet équipement est déjà alloué à ${allocatedEquipment[item._id]}`);
            return;
        }

        if (!selectedEquipment.some(selected => selected.equipment._id === item._id)) {
            setSelectedEquipment([...selectedEquipment, {
                equipment: item,
                description: descriptions[item._id] || '',
                dossierType: 'Dossier Technique'
            }]);
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

    const handleValidationChange = (equipmentId: string, needsValidation: boolean) => {
        setValidationRequests(prev => ({
            ...prev,
            [equipmentId]: {
                ...prev[equipmentId],
                needsValidation
            }
        }));
    };

    const handleValidationReasonChange = (equipmentId: string, reason: string) => {
        setValidationRequests(prev => ({
            ...prev,
            [equipmentId]: {
                ...prev[equipmentId],
                validationReason: reason
            }
        }));
    };

    const handleChefDeBaseChange = (equipmentId: string, chefDeBaseId: string) => {
        setValidationRequests(prev => ({
            ...prev,
            [equipmentId]: {
                ...prev[equipmentId],
                chefDeBaseId
            }
        }));
    };

    const handleConfirm = () => {
        const equipmentWithValidation = selectedEquipment.map(item => ({
            ...item,
            needsValidation: validationRequests[item.equipment._id]?.needsValidation || false,
            validationReason: validationRequests[item.equipment._id]?.validationReason || '',
            chefDeBaseId: validationRequests[item.equipment._id]?.chefDeBaseId || '',
            dossierType: 'Dossier Technique'
        }));
        onSelect(equipmentWithValidation);
        setSelectedEquipment([]);
        setDescriptions({});
        setValidationRequests({});
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
                                                : allocatedEquipment[item._id]
                                                    ? 'bg-red-50 dark:bg-red-900/30 cursor-not-allowed'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {item.nom}
                                                </h4>
                                                <div className="flex items-center">
                                                    {allocatedEquipment[item._id] && (
                                                        <span className="mr-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                                                            Alloué
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${equipmentStatusColors[item.status]}`}>
                                                        {equipmentStatusLabels[item.status]}
                                                    </span>
                                                </div>
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
                                                {allocatedEquipment[item._id] && (
                                                    <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                                                        Cet équipement est déjà alloué à {allocatedEquipment[item._id]}
                                                    </p>
                                                )}
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

                                        <div className="mt-3 space-y-3">
                                            <textarea
                                                value={description}
                                                onChange={(e) => handleDescriptionChange(item._id, e.target.value)}
                                                placeholder="Ajouter une description..."
                                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                                                rows={2}
                                            />

                                            <div className="flex items-start space-x-3">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={validationRequests[item._id]?.needsValidation || false}
                                                        onChange={(e) => handleValidationChange(item._id, e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Demander validation au Chef de Base
                                                    </label>
                                                </div>
                                            </div>

                                            {validationRequests[item._id]?.needsValidation && (
                                                <div className="space-y-3 pl-7">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Sélectionner le Chef de Base
                                                        </label>
                                                        <select
                                                            value={validationRequests[item._id]?.chefDeBaseId || ''}
                                                            onChange={(e) => handleChefDeBaseChange(item._id, e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                                                        >
                                                            <option value="">Sélectionner un Chef de Base</option>
                                                            {users.map((user) => (
                                                                <option key={user._id} value={user._id}>
                                                                    {user.prenom} {user.nom} ({user.role})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Raison de la demande de validation
                                                        </label>
                                                        <textarea
                                                            value={validationRequests[item._id]?.validationReason || ''}
                                                            onChange={(e) => handleValidationReasonChange(item._id, e.target.value)}
                                                            placeholder="Raison de la demande de validation..."
                                                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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