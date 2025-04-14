import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipmentById, fetchEquipmentHistory } from '../../store/slices/equipmentSlice';
import { equipmentStatusLabels, equipmentStatusColors, Equipment } from '../../types/equipment';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { toast } from 'react-toastify';
import { PencilIcon } from '../../icons';

type TabType = 'details' | 'placement' | 'operation' | 'maintenance';

const EquipmentDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedEquipment, equipmentHistory, loading, error } = useSelector((state: RootState) => state.equipment);
    const [activeTab, setActiveTab] = useState<TabType>('details');

    useEffect(() => {
        if (id) {
            dispatch(fetchEquipmentById(id))
                .unwrap()
                .catch(err => {
                    toast.error(`Erreur lors du chargement de l'équipement: ${err}`);
                });

            dispatch(fetchEquipmentHistory(id))
                .unwrap()
                .catch(err => {
                    toast.error(`Erreur lors du chargement de l'historique: ${err}`);
                });
        }
    }, [dispatch, id]);

    if (loading && !selectedEquipment) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error || !selectedEquipment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {error || "Équipement non trouvé"}
                </h2>
                <button
                    onClick={() => navigate('/equipments')}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    // Ensure status is a valid key for the status color/label maps
    const status = selectedEquipment.status as keyof typeof equipmentStatusColors;

    return (
        <>
            <PageMeta
                title={`Équipement | ${selectedEquipment.nom}`}
                description={`Détails de l'équipement ${selectedEquipment.nom}`}
            />
            <PageBreadcrumb pageTitle="Détails de l'équipement" />

            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">
                        {selectedEquipment.nom}
                    </h1>
                    <button
                        onClick={() => navigate(`/equipments/${id}/edit`)}
                        className="inline-flex items-center px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                    >
                        <PencilIcon className="w-5 h-5 mr-2" />
                        Modifier
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Référence</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.reference}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Matricule</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.matricule}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Emplacement</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.location}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                            <p className="mt-1">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${equipmentStatusColors[status]}`}>
                                    {equipmentStatusLabels[status]}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex -mb-px">
                            <button
                                className={`px-6 py-3 border-b-2 text-sm font-medium ${activeTab === 'details'
                                        ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('details')}
                            >
                                Détails
                            </button>
                            <button
                                className={`px-6 py-3 border-b-2 text-sm font-medium ${activeTab === 'placement'
                                        ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('placement')}
                            >
                                Historique de placement
                            </button>
                            <button
                                className={`px-6 py-3 border-b-2 text-sm font-medium ${activeTab === 'operation'
                                        ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('operation')}
                            >
                                Historique d'opération
                            </button>
                            <button
                                className={`px-6 py-3 border-b-2 text-sm font-medium ${activeTab === 'maintenance'
                                        ? 'border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('maintenance')}
                            >
                                Historique de maintenance
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Caractéristiques techniques</h3>

                                <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Dimensions</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Hauteur</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.dimensions.height} cm</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Largeur</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.dimensions.width} cm</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Longueur</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.dimensions.length} cm</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Poids</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.dimensions.weight} kg</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Volume</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.dimensions.volume} m³</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Conditions d'opération</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Température</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.operatingConditions.temperature}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Pression</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{selectedEquipment.operatingConditions.pressure}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'placement' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historique de placement</h3>
                                {equipmentHistory.placement.length > 0 ? (
                                    <div className="space-y-6">
                                        <p className="text-gray-500 dark:text-gray-400">En cours de développement</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucun historique de placement disponible</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'operation' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historique d'opération</h3>
                                {equipmentHistory.operation.length > 0 ? (
                                    <div className="space-y-6">
                                        <p className="text-gray-500 dark:text-gray-400">En cours de développement</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucun historique d'opération disponible</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'maintenance' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historique de maintenance</h3>
                                {equipmentHistory.maintenance.length > 0 ? (
                                    <div className="space-y-6">
                                        <p className="text-gray-500 dark:text-gray-400">En cours de développement</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucun historique de maintenance disponible</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EquipmentDetailView;