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
import { EyeIcon, PlusIcon } from '../../icons';
import { toast } from 'react-toastify';

const EquipmentList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { equipment, loading, error } = useSelector((state: RootState) => state.equipment);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        location: ''
    });

    // Load equipment data on mount
    useEffect(() => {
        dispatch(fetchEquipment())
            .unwrap()
            .catch(err => {
                toast.error(`Erreur lors du chargement des équipements: ${err}`);
            });
    }, [dispatch]);

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
    }, [equipment, filters]);

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

            <div className="container mx-auto px-4 py-6">
                {/* Header with title and add button */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-0">
                        Liste des équipements
                    </h1>
                    <Link
                        to="/equipments/add"
                        className="inline-flex items-center px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Ajouter un équipement
                    </Link>
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
                            {filteredEquipment.length > 0 ? (
                                filteredEquipment.map((item) => {
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
                                    <TableCell colSpan={7} className="px-5 py-4 text-sm text-gray-500 text-center">
                                        {error ? (
                                            `Erreur: ${error}`
                                        ) : (
                                            loading ?
                                                "Chargement des équipements..." :
                                                "Aucun équipement trouvé correspondant aux critères"
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
};

export default EquipmentList; 