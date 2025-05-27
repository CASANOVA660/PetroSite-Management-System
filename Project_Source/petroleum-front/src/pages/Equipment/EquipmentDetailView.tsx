import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipmentById, fetchEquipmentHistory } from '../../store/slices/equipmentSlice';
import { equipmentStatusLabels, equipmentStatusColors, Equipment, EquipmentHistoryEntry } from '../../types/equipment';
import { HistoryFilterPanel, HistoryEntryCard, EmptyHistoryState, DateFilterType } from '../../components/equipment';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { toast } from 'react-toastify';
import { PencilIcon } from '../../icons';
import EquipmentStatusView from '../../components/equipment/EquipmentStatusView';

type TabType = 'details' | 'placement' | 'operation' | 'maintenance' | 'status';

const EquipmentDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedEquipment, equipmentHistory, loading, error } = useSelector((state: RootState) => state.equipment);
    const [activeTab, setActiveTab] = useState<TabType>('details');

    // History filtering states
    const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filtered history entries
    const [filteredPlacementHistory, setFilteredPlacementHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [filteredOperationHistory, setFilteredOperationHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [filteredMaintenanceHistory, setFilteredMaintenanceHistory] = useState<EquipmentHistoryEntry[]>([]);

    useEffect(() => {
        if (dateFilter === 'custom' && !startDate) {
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    }, [dateFilter, startDate]);

    const applyFilters = () => {
        let fromDate: Date | null = null;
        const today = new Date();

        if (dateFilter === 'past-month') {
            fromDate = new Date();
            fromDate.setMonth(today.getMonth() - 1);
        } else if (dateFilter === 'past-6-months') {
            fromDate = new Date();
            fromDate.setMonth(today.getMonth() - 6);
        } else if (dateFilter === 'past-year') {
            fromDate = new Date();
            fromDate.setFullYear(today.getFullYear() - 1);
        } else if (dateFilter === 'custom' && startDate) {
            fromDate = new Date(startDate);
        }

        let toDate: Date | null = null;
        if (dateFilter === 'custom' && endDate) {
            toDate = new Date(endDate);
            toDate.setHours(23, 59, 59, 999);
        }

        const filterEntry = (entry: EquipmentHistoryEntry) => {
            const entryDate = new Date(entry.fromDate);

            if (fromDate && entryDate < fromDate) {
                return false;
            }

            if (toDate && entryDate > toDate) {
                return false;
            }

            if (searchTerm && searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                const descriptionMatch = entry.description.toLowerCase().includes(searchLower);
                const responsibleMatch = entry.responsiblePerson && entry.responsiblePerson.name.toLowerCase().includes(searchLower);
                const locationMatch = entry.location && entry.location.toLowerCase().includes(searchLower);

                return descriptionMatch || responsibleMatch || locationMatch;
            }

            return true;
        };

        setFilteredPlacementHistory(equipmentHistory.placement.filter(filterEntry));
        setFilteredOperationHistory(equipmentHistory.operation.filter(filterEntry));
        setFilteredMaintenanceHistory(equipmentHistory.maintenance.filter(filterEntry));
    };

    const resetFilters = () => {
        setDateFilter('all');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');

        setFilteredPlacementHistory(equipmentHistory.placement);
        setFilteredOperationHistory(equipmentHistory.operation);
        setFilteredMaintenanceHistory(equipmentHistory.maintenance);
    };

    useEffect(() => {
        setFilteredPlacementHistory(equipmentHistory.placement);
        setFilteredOperationHistory(equipmentHistory.operation);
        setFilteredMaintenanceHistory(equipmentHistory.maintenance);
    }, [equipmentHistory]);

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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error || !selectedEquipment) {
        return (
            <div className="text-center py-12 bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    {error || "Équipement non trouvé"}
                </h2>
                <button
                    onClick={() => navigate('/equipments')}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-full hover:bg-[#E67E2E] transition-colors duration-200 shadow-md"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    const status = selectedEquipment.status as keyof typeof equipmentStatusColors;

    return (
        <>
            <PageMeta
                title={`Équipement | ${selectedEquipment.nom}`}
                description={`Détails de l'équipement ${selectedEquipment.nom}`}
            />
            <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
                <PageBreadcrumb pageTitle="Détails de l'équipement" />
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
                        {selectedEquipment.nom}
                    </h1>
                    <button
                        onClick={() => navigate(`/equipments/${id}/edit`)}
                        className="inline-flex items-center px-6 py-2 bg-[#F28C38] text-white rounded-full hover:bg-[#E67E2E] transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                    >
                        <PencilIcon className="w-5 h-5 mr-2" />
                        Modifier
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Référence</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.reference}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Matricule</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.matricule}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Emplacement</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.location}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</p>
                            <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${equipmentStatusColors[status]} mt-1`}>
                                {equipmentStatusLabels[status]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
                    <div className="mt-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`${activeTab === 'details'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Détails
                            </button>
                            <button
                                onClick={() => setActiveTab('status')}
                                className={`${activeTab === 'status'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Statut et Activités
                            </button>
                            <button
                                onClick={() => setActiveTab('placement')}
                                className={`${activeTab === 'placement'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Placement
                            </button>
                            <button
                                onClick={() => setActiveTab('operation')}
                                className={`${activeTab === 'operation'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Opération
                            </button>
                            <button
                                onClick={() => setActiveTab('maintenance')}
                                className={`${activeTab === 'maintenance'
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Maintenance
                            </button>
                        </nav>
                    </div>

                    <div className="py-6">
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Caractéristiques techniques</h3>
                                <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dimensions</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hauteur</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.dimensions.height} cm</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Largeur</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.dimensions.width} cm</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Longueur</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.dimensions.length} cm</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Poids</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.dimensions.weight} kg</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.dimensions.volume} m³</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Conditions d’opération</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Température</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.operatingConditions.temperature}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pression</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{selectedEquipment.operatingConditions.pressure}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'status' && id && (
                            <div>
                                <EquipmentStatusView equipmentId={id} />
                            </div>
                        )}

                        {activeTab === 'placement' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Historique de placement</h3>
                                <HistoryFilterPanel
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                    startDate={startDate}
                                    endDate={endDate}
                                    setStartDate={setStartDate}
                                    setEndDate={setEndDate}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onApplyFilters={applyFilters}
                                    onResetFilters={resetFilters}
                                />
                                {filteredPlacementHistory.length > 0 ? (
                                    <div className="ml-6 pl-6 relative">
                                        {filteredPlacementHistory.map((entry, index) => (
                                            <HistoryEntryCard
                                                key={entry._id}
                                                entry={entry}
                                                isFirst={index === 0}
                                                isLast={index === filteredPlacementHistory.length - 1}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyHistoryState message="Aucun historique de placement disponible" />
                                )}
                            </div>
                        )}

                        {activeTab === 'operation' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Historique d’opération</h3>
                                <HistoryFilterPanel
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                    startDate={startDate}
                                    endDate={endDate}
                                    setStartDate={setStartDate}
                                    setEndDate={setEndDate}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onApplyFilters={applyFilters}
                                    onResetFilters={resetFilters}
                                />
                                {filteredOperationHistory.length > 0 ? (
                                    <div className="ml-6 pl-6 relative">
                                        {filteredOperationHistory.map((entry, index) => (
                                            <HistoryEntryCard
                                                key={entry._id}
                                                entry={entry}
                                                isFirst={index === 0}
                                                isLast={index === filteredOperationHistory.length - 1}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyHistoryState message="Aucun historique d’opération disponible" />
                                )}
                            </div>
                        )}

                        {activeTab === 'maintenance' && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Historique de maintenance</h3>
                                <HistoryFilterPanel
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                    startDate={startDate}
                                    endDate={endDate}
                                    setStartDate={setStartDate}
                                    setEndDate={setEndDate}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onApplyFilters={applyFilters}
                                    onResetFilters={resetFilters}
                                />
                                {filteredMaintenanceHistory.length > 0 ? (
                                    <div className="ml-6 pl-6 relative">
                                        {filteredMaintenanceHistory.map((entry, index) => (
                                            <HistoryEntryCard
                                                key={entry._id}
                                                entry={entry}
                                                isFirst={index === 0}
                                                isLast={index === filteredMaintenanceHistory.length - 1}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyHistoryState message="Aucun historique de maintenance disponible" />
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