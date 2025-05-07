import React, { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon, PlusIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';
import { motion } from 'framer-motion';
import EquipmentSelector from './EquipmentSelector';
import SelectedEquipmentList from './SelectedEquipmentList';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { Equipment } from '../../types/equipment';
import { useDispatch } from 'react-redux';
import { sendValidationRequest } from '../../store/slices/projectSlice';
import { AppDispatch } from '../../store';

interface ProjectEquipment {
    _id: string;
    equipmentId: string | Equipment;
    description: string;
    dossierType: string;
}

interface DossierTechniqueProps {
    projectId: string;
}

const DossierTechnique: React.FC<DossierTechniqueProps> = ({ projectId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [selectedEquipment, setSelectedEquipment] = useState<ProjectEquipment[]>([]);
    const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProjectEquipment();
    }, [projectId]);

    const loadProjectEquipment = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/projects/${projectId}/equipment/Dossier Technique`);
            setSelectedEquipment(response.data.data);
        } catch (error) {
            console.error('Error loading project equipment:', error);
            toast.error('Erreur lors du chargement des équipements');
        } finally {
            setLoading(false);
        }
    };

    const handleEquipmentSelect = async (equipment: {
        equipment: Equipment;
        description: string;
        dossierType: string;
        needsValidation?: boolean;
        validationReason?: string;
        chefDeBaseId?: string;
    }[]) => {
        try {
            setLoading(true);

            console.log('Selected equipment data:', equipment);

            // First, add the equipment to the project
            const response = await axios.post(`/projects/${projectId}/equipment`, {
                equipment: equipment.map(item => ({
                    equipment: item.equipment,
                    description: item.description,
                    dossierType: item.dossierType
                })),
                needsValidation: equipment.some(item => item.needsValidation),
                validationReason: equipment.find(item => item.needsValidation)?.validationReason,
                chefDeBaseId: equipment.find(item => item.needsValidation)?.chefDeBaseId
            });

            console.log('Equipment added response:', response.data);
            setSelectedEquipment(response.data.data);

            // Show success message
            toast.success('Équipements ajoutés avec succès');
            if (equipment.some(item => item.needsValidation)) {
                toast.success('Demande de validation envoyée avec succès');
            }

            setIsEquipmentSelectorOpen(false);
        } catch (error) {
            console.error('Error adding equipment:', error);
            toast.error('Erreur lors de l\'ajout des équipements');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEquipment = async (equipmentId: string) => {
        try {
            setLoading(true);
            await axios.delete(`/projects/${projectId}/equipment/${equipmentId}/Dossier Technique`);
            setSelectedEquipment(prev => prev.filter(item => item._id !== equipmentId));
            toast.success('Équipement supprimé avec succès');
        } catch (error) {
            console.error('Error removing equipment:', error);
            toast.error('Erreur lors de la suppression de l\'équipement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
            <div className="mb-6">
                <button
                    onClick={() => setIsEquipmentSelectorOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Choisir équipement
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : selectedEquipment.length > 0 ? (
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Équipements sélectionnés
                    </h3>
                    <SelectedEquipmentList
                        equipment={selectedEquipment.map(item => ({
                            _id: item._id,
                            equipment: {
                                _id: typeof item.equipmentId === 'string' ? item.equipmentId : item.equipmentId._id,
                                nom: typeof item.equipmentId === 'string' ? '' : item.equipmentId.nom,
                                reference: typeof item.equipmentId === 'string' ? '' : item.equipmentId.reference,
                                status: typeof item.equipmentId === 'string' ? 'disponible' : item.equipmentId.status
                            },
                            description: item.description
                        }))}
                        onRemove={handleRemoveEquipment}
                    />
                </div>
            ) : null}

            <BaseDocumentManager
                projectId={projectId}
                category="Dossier Technique"
                title="Dossier Technique"
                icon={<WrenchScrewdriverIcon className="w-6 h-6 text-[#F28C38]" />}
            />

            <EquipmentSelector
                isOpen={isEquipmentSelectorOpen}
                onClose={() => setIsEquipmentSelectorOpen(false)}
                onSelect={handleEquipmentSelect}
            />
        </motion.div>
    );
};

export default DossierTechnique;


