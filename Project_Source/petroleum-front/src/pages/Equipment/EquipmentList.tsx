import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { EyeIcon, PlusIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import { toast, ToastContainer } from 'react-toastify';

const EquipmentList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { equipment, loading, error } = useSelector((state: RootState) => state.equipment);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        location: ''
    });
    const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [paginatedEquipment, setPaginatedEquipment] = useState<Equipment[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // Load equipment data on mount
    useEffect(() => {
        loadEquipment();
    }, [dispatch]);

    const loadEquipment = () => {
        dispatch(fetchEquipment())
            .unwrap()
            .then(() => {
                setLastRefreshTime(new Date());
            })
            .catch(err => {
                toast.error(`Erreur lors du chargement des équipements: ${err}`);
            });
    };

    // Update filtered equipment whenever equipment or filters change
    useEffect(() => {
        let result = [...equipment];

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                e =>
                    e.nom.toLowerCase().includes(searchLower) ||
                    e.reference.toLowerCase().includes(searchLower) ||
                    e.matricule.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (filters.status) {
            result = result.filter(e => e.status === filters.status);
        }

        // Apply location filter
        if (filters.location) {
            result = result.filter(e => e.location.toLowerCase().includes(filters.location.toLowerCase()));
        }

        setFilteredEquipment(result);
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [equipment, filters]);

    // Apply pagination to filtered equipment
    useEffect(() => {
        const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
        setTotalPages(totalPages || 1); // Ensure at least 1 page even when empty

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setPaginatedEquipment(filteredEquipment.slice(start, end));
    }, [filteredEquipment, currentPage, itemsPerPage]);

    // Calculate equipment statistics
    const equipmentStats = React.useMemo(() => {
        const stats = {
            total: equipment.length,
            byStatus: {} as Record<string, number>
        };

        // Count equipment by status
        equipment.forEach(item => {
            if (!stats.byStatus[item.status]) {
                stats.byStatus[item.status] = 0;
            }
            stats.byStatus[item.status]++;
        });

        return stats;
    }, [equipment]);

    // Format date for display
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Get unique locations for the filter dropdown
    const uniqueLocations = React.useMemo(() => {
        const locations = equipment.map((e: Equipment) => e.location);
        return [...new Set(locations)] as string[];
    }, [equipment]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            location: ''
        });
    };

    const handleRefresh = () => {
        loadEquipment();
        toast.info("Actualisation des données...");
    };

    const toggleStats = () => {
        setIsStatsOpen(!isStatsOpen);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    if (loading && equipment.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title="Magasin des équipments"
                description="Gestion et suivi des équipements"
            />
            <PageBreadcrumb pageTitle="Magasin des équipments" />

            {/* Toast container with proper positioning */}
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                style={{ zIndex: 9999 }}
            />

            <div className="container mx-auto px-4 py-6">
                {/* Header with title and add button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">

                    </h1>
                    <Link
                        to="/equipments/add"
                        className="inline-flex items-center px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Ajouter un équipement
                    </Link>
                </div>

                {/* Statistics Cards - Collapsible */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
                    <div
                        className="p-4 flex justify-between items-center cursor-pointer"
                        onClick={toggleStats}
                    >
                        <div className="flex items-center">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                Statistiques des équipements
                            </h2>
                            <div className="flex items-center ml-4">
                                <span className="text-sm text-gray-500">
                                    {equipmentStats.total} équipements au total
                                </span>
                                <span className="text-sm text-gray-500 ml-4">
                                    Dernière actualisation: {formatDate(lastRefreshTime)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefresh();
                                }}
                                className="p-2 mr-2 text-gray-500 hover:text-[#F28C38] focus:outline-none rounded-full hover:bg-gray-100"
                                title="Actualiser les données"
                            >
                                <RefreshIcon className="w-5 h-5" />
                            </button>
                            {isStatsOpen ? (
                                <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                    </div>

                    {isStatsOpen && (
                        <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
                                {/* Total count card */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex flex-col">
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Total</span>
                                    <span className="text-3xl font-bold text-blue-800 dark:text-blue-300">{equipmentStats.total}</span>
                                    <span className="text-sm text-blue-600 dark:text-blue-400 mt-2">Équipements</span>
                                </div>

                                {/* Status count cards */}
                                {Object.entries(equipmentStatusLabels).map(([status, label]) => {
                                    const count = equipmentStats.byStatus[status] || 0;
                                    const colorClass = status === 'disponible_bon_etat' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                        status === 'on_repair' ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                            status === 'disponible_needs_repair' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                                status === 'working_non_disponible' ? 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                                    'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';

                                    return (
                                        <div key={status} className={`rounded-lg p-4 flex flex-col ${colorClass}`}>
                                            <span className="text-sm font-medium">{label}</span>
                                            <span className="text-3xl font-bold">{count}</span>
                                            <button
                                                onClick={() => {
                                                    setFilters(prev => ({ ...prev, status }));
                                                    setIsStatsOpen(false);
                                                }}
                                                className="text-sm mt-2 hover:underline"
                                            >
                                                Voir détails
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Recherche
                            </label>
                            <input
                                type="text"
                                id="search"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Nom, référence, matricule..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Statut
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                            >
                                <option value="">Tous les statuts</option>
                                {Object.entries(equipmentStatusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Emplacement
                            </label>
                            <select
                                id="location"
                                name="location"
                                value={filters.location}
                                onChange={handleFilterChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                            >
                                <option value="">Tous les emplacements</option>
                                {uniqueLocations.map((location: string) => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Effacer les filtres
                        </button>
                    </div>
                </div>

                {/* Equipment Table */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nom
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Référence
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Matricule
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dimensions
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Emplacement
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </TableCell>
                                <TableCell className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {paginatedEquipment.length > 0 ? (
                                paginatedEquipment.map((item) => {
                                    // Type assertion for status
                                    const status = item.status as keyof typeof equipmentStatusColors;

                                    return (
                                        <TableRow key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <TableCell className="px-5 py-4 text-sm text-gray-900 dark:text-white">
                                                {item.nom}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {item.reference}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {item.matricule}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <div>H: {item.dimensions.height} cm</div>
                                                <div>L: {item.dimensions.length} cm</div>
                                                <div>l: {item.dimensions.width} cm</div>
                                                <div>P: {item.dimensions.weight} kg</div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {item.location}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${equipmentStatusColors[status]}`}>
                                                    {equipmentStatusLabels[status]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                <Link
                                                    to={`/equipments/${item._id}`}
                                                    className="text-[#F28C38] hover:text-[#E67E2E] inline-flex items-center"
                                                >
                                                    <EyeIcon className="w-5 h-5 mr-1" />
                                                    Voir
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {loading ? (
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#F28C38]"></div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-red-500">Une erreur est survenue lors du chargement des équipements.</div>
                                        ) : (
                                            "Aucun équipement trouvé avec les filtres actuels."
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {filteredEquipment.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row items-center justify-between">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Affichage de{' '}
                                    <span className="font-medium">
                                        {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEquipment.length)}
                                    </span>{' '}
                                    à{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, filteredEquipment.length)}
                                    </span>{' '}
                                    sur <span className="font-medium">{filteredEquipment.length}</span> équipements
                                </span>
                                <div className="ml-4">
                                    <label htmlFor="itemsPerPage" className="sr-only">Éléments par page</label>
                                    <select
                                        id="itemsPerPage"
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                                    >
                                        <option value="5">5 par page</option>
                                        <option value="10">10 par page</option>
                                        <option value="25">25 par page</option>
                                        <option value="50">50 par page</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-[#F28C38] hover:bg-orange-50'
                                        }`}
                                >
                                    Premier
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded-md ${currentPage === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-[#F28C38] hover:bg-orange-50'
                                        }`}
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Create a window of 5 pages centered around current page
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            // Less than 5 pages, show all
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            // Near start, show first 5 pages
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            // Near end, show last 5 pages
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            // Middle, show current and 2 on each side
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-1 rounded-md ${currentPage === pageNum
                                                    ? 'bg-[#F28C38] text-white'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1 rounded-md ${currentPage === totalPages
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-[#F28C38] hover:bg-orange-50'
                                        }`}
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-[#F28C38] hover:bg-orange-50'
                                        }`}
                                >
                                    Dernier
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EquipmentList; 