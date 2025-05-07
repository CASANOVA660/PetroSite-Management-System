import React, { useState, useEffect } from 'react';
import { WrenchScrewdriverIcon, PlusIcon } from '@heroicons/react/24/outline';
import BaseDocumentManager from './BaseDocumentManager';
import { motion } from 'framer-motion';
import EquipmentSelector from './EquipmentSelector';
import SelectedEquipmentList from './SelectedEquipmentList';
import axios from '../../utils/axios';
import { toast } from 'react-hot-toast';
import { Equipment } from '../../types/equipment';

interface ProjectEquipment {
    _id: string;
    equipmentId: Equipment;
    description: string;
    dossierType: string;
}

interface DossierTechniqueProps {
    projectId: string;
}

const DossierTechnique: React.FC<DossierTechniqueProps> = ({ projectId }) => {
    const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<ProjectEquipment[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch existing equipment when component mounts
    useEffect(() => {
        fetchProjectEquipment();
    }, [projectId]);

    const fetchProjectEquipment = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/projects/${projectId}/equipment/Dossier Technique`);
            setSelectedEquipment(response.data.data);
        } catch (error) {
            toast.error('Error fetching project equipment');
        } finally {
            setLoading(false);
        }
    };

    const handleEquipmentSelect = async (equipment: { equipment: Equipment; description: string }[]) => {
        try {
            const response = await axios.post(`/projects/${projectId}/equipment`, {
                equipment,
                dossierType: 'Dossier Technique'
            });
            setSelectedEquipment(response.data.data);
            toast.success('Equipment added successfully');
        } catch (error) {
            toast.error('Failed to add equipment');
        }
    };

    const handleRemoveEquipment = async (equipmentId: string) => {
        try {
            await axios.delete(`/projects/${projectId}/equipment/${equipmentId}/Dossier Technique`);
            setSelectedEquipment(prev => prev.filter(item => item.equipmentId._id !== equipmentId));
            toast.success('Equipment removed successfully');
        } catch (error) {
            toast.error('Failed to remove equipment');
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
                            equipment: item.equipmentId,
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

export default React.memo(DossierTechnique);


