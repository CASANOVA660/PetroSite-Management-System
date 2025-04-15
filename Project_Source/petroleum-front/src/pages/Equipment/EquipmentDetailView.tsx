import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipmentById, fetchEquipmentHistory } from '../../store/slices/equipmentSlice';
import { equipmentStatusLabels, equipmentStatusColors, Equipment, EquipmentHistoryEntry } from '../../types/equipment';
import {
    HistoryFilterPanel,
    HistoryEntryCard,
    EmptyHistoryState,
    DateFilterType
} from '../../components/equipment';
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

    // History filtering states
    const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filtered history entries
    const [filteredPlacementHistory, setFilteredPlacementHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [filteredOperationHistory, setFilteredOperationHistory] = useState<EquipmentHistoryEntry[]>([]);
    const [filteredMaintenanceHistory, setFilteredMaintenanceHistory] = useState<EquipmentHistoryEntry[]>([]);

    // Initialize date filter values if needed
    useEffect(() => {
        if (dateFilter === 'custom' && !startDate) {
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    }, [dateFilter, startDate]);

    // Apply filters function
    const applyFilters = () => {
        // Calculate the date ranges based on filter
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
            // Set to end of day
            toDate.setHours(23, 59, 59, 999);
        }

        // Filter function for history entries
        const filterEntry = (entry: EquipmentHistoryEntry) => {
            const entryDate = new Date(entry.fromDate);

            // Date filter
            if (fromDate && entryDate < fromDate) {
                return false;
            }

            if (toDate && entryDate > toDate) {
                return false;
            }

            // Search term filter
            if (searchTerm && searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                const descriptionMatch = entry.description.toLowerCase().includes(searchLower);
                const responsibleMatch = entry.responsiblePerson &&
                    entry.responsiblePerson.name.toLowerCase().includes(searchLower);
                const locationMatch = entry.location && entry.location.toLowerCase().includes(searchLower);

                return descriptionMatch || responsibleMatch || locationMatch;
            }

            return true;
        };

        // Apply filters to each history type
        setFilteredPlacementHistory(equipmentHistory.placement.filter(filterEntry));
        setFilteredOperationHistory(equipmentHistory.operation.filter(filterEntry));
        setFilteredMaintenanceHistory(equipmentHistory.maintenance.filter(filterEntry));
    };

    // Reset filters
    const resetFilters = () => {
        setDateFilter('all');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');

        // Reset to original data
        setFilteredPlacementHistory(equipmentHistory.placement);
        setFilteredOperationHistory(equipmentHistory.operation);
        setFilteredMaintenanceHistory(equipmentHistory.maintenance);
    };

    // Initialize filtered data when original data changes
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
                        <nav className="flex flex-wrap -mb-px">
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
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historique d'opération</h3>

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
                                    <EmptyHistoryState message="Aucun historique d'opération disponible" />
                                )}
                            </div>
                        )}

                        {activeTab === 'maintenance' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Historique de maintenance</h3>

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