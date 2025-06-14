import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchEquipment } from '../../store/slices/equipmentSlice';
import { Equipment, equipmentStatusLabels, equipmentStatusColors } from '../../types/equipment';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { EyeIcon, PlusIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Map API status values to our internal status values
const mapApiStatus = (apiStatus: string): string => {
    // Convert API status to our internal status values
    const statusMap: Record<string, string> = {
        'available': 'disponible',
        'inUse': 'working_non_disponible',
        'maintenance': 'on_repair',
        'reserved': 'disponible_needs_repair',
        // Add other mappings as needed
    };

    return statusMap[apiStatus] || apiStatus;
};

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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [paginatedEquipment, setPaginatedEquipment] = useState<Equipment[]>([]);
    const [totalPages, setTotalPages] = useState(1);

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

    useEffect(() => {
        let result = [...equipment];
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                e =>
                    e.nom.toLowerCase().includes(searchLower) ||
                    e.reference.toLowerCase().includes(searchLower) ||
                    e.matricule.toLowerCase().includes(searchLower)
            );
        }
        if (filters.status) {
            result = result.filter(e => e.status === filters.status);
        }
        if (filters.location) {
            result = result.filter(e => e.location.toLowerCase().includes(filters.location.toLowerCase()));
        }
        setFilteredEquipment(result);
        setCurrentPage(1);
    }, [equipment, filters]);

    useEffect(() => {
        const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
        setTotalPages(totalPages || 1);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setPaginatedEquipment(filteredEquipment.slice(start, end));
    }, [filteredEquipment, currentPage, itemsPerPage]);

    const equipmentStats = React.useMemo(() => {
        const stats = {
            total: equipment.length,
            byStatus: {} as Record<string, number>
        };

        console.log('Equipment status values:', equipment.map(item => item.status));

        equipment.forEach(item => {
            // Map API status to our internal status if needed
            const status = mapApiStatus(item.status);

            if (!stats.byStatus[status]) {
                stats.byStatus[status] = 0;
            }
            stats.byStatus[status]++;
        });

        console.log('Equipment stats by status:', stats.byStatus);
        return stats;
    }, [equipment]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

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

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    if (loading && equipment.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title="Magasin des équipements"
                description="Gestion et suivi des équipements"
            />
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
                className="z-[9999]"
            />
            <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
                <div className="mb-6">
                    <PageBreadcrumb pageTitle="Magasin des équipements" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Équipements</h1>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRefresh}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                                title="Actualiser"
                            >
                                <RefreshIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <Link
                                to="/equipments/add"
                                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors duration-200 font-medium"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Ajouter
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md relative">
                        <h3 className="text-sm font-medium">Total Équipements</h3>
                        <p className="text-2xl font-bold mt-1">{equipmentStats.total}</p>
                        <p className="text-xs mt-1">Across all projects</p>
                        <svg className="absolute top-4 right-4 w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-md relative">
                        <h3 className="text-sm font-medium">Disponible Bon État</h3>
                        <p className="text-2xl font-bold mt-1">{equipmentStats.byStatus['disponible_bon_etat'] || 0}</p>
                        <p className="text-xs mt-1">Available</p>
                        <svg className="absolute top-4 right-4 w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 shadow-md relative">
                        <h3 className="text-sm font-medium">En Réparation</h3>
                        <p className="text-2xl font-bold mt-1">{equipmentStats.byStatus['on_repair'] || 0}</p>
                        <p className="text-xs mt-1">In progress</p>
                        <svg className="absolute top-4 right-4 w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-700 mb-4 sm:mb-0">Filtres</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors duration-200 text-sm"
                            >
                                Actualiser
                            </button>
                            <span className="text-sm text-gray-500">Dernière mise à jour: {formatDate(lastRefreshTime)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-600 mb-1">Recherche</label>
                            <input
                                type="text"
                                id="search"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Nom, référence, matricule..."
                                className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-1">Statut</label>
                            <select
                                id="status"
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                            <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-1">Emplacement</label>
                            <select
                                id="location"
                                name="location"
                                value={filters.location}
                                onChange={handleFilterChange}
                                className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    <div className="text-sm text-gray-600">
                        {filteredEquipment.length} équipement(s) trouvé(s)
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 text-sm"
                        >
                            Effacer les filtres
                        </button>
                    </div>
                </div>

                {/* Equipment Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Nom & Détails</th>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Emplacement</th>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Statut</th>
                                <th className="py-3 px-4 text-left text-gray-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEquipment.length > 0 ? (
                                paginatedEquipment.map((item) => {
                                    // Map API status to our internal status if needed
                                    const mappedStatus = mapApiStatus(item.status);
                                    const statusKey = mappedStatus as keyof typeof equipmentStatusColors;

                                    return (
                                        <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-800">{item.nom}</div>
                                                <div className="text-gray-600">
                                                    Réf: {item.reference} | Mat: {item.matricule} | Dim: H:{item.dimensions.height}cm L:{item.dimensions.length}cm l:{item.dimensions.width}cm P:{item.dimensions.weight}kg
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">{item.location}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${equipmentStatusColors[statusKey] || 'bg-gray-100 text-gray-800'}`}>
                                                    {equipmentStatusLabels[statusKey] || item.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Link
                                                    to={`/equipments/${item._id}`}
                                                    className="inline-flex items-center text-orange-500 hover:text-orange-600 transition-colors duration-200"
                                                >
                                                    <EyeIcon className="w-5 h-5 mr-1" />
                                                    Voir
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-gray-600">
                                        {loading ? (
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                                            </div>
                                        ) : error ? (
                                            <div className="text-red-500">Une erreur est survenue lors du chargement des équipements.</div>
                                        ) : (
                                            "Aucun équipement trouvé avec les filtres actuels."
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredEquipment.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                            Affichage de{' '}
                            <span className="font-medium">
                                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEquipment.length)}
                            </span>{' '}
                            à{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * itemsPerPage, filteredEquipment.length)}
                            </span>{' '}
                            sur <span className="font-medium">{filteredEquipment.length}</span> équipements
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors duration-200"
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <span className="text-sm text-gray-600">Page {currentPage} sur {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition-colors duration-200"
                            >
                                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <select
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="rounded-full border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="5">5 par page</option>
                                <option value="10">10 par page</option>
                                <option value="25">25 par page</option>
                                <option value="50">50 par page</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default EquipmentList;