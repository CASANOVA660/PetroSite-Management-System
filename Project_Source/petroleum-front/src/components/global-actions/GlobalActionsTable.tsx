import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { updateGlobalActionStatus, deleteGlobalAction, fetchGlobalActions, GlobalAction, updateGlobalAction } from '../../store/slices/globalActionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow
} from '../ui/table';

import Badge from "../ui/badge/Badge";
import { Eye, Trash, Edit, CheckCircle, ChevronLeft, ChevronRight, Search, X, Calendar } from 'lucide-react';
import { Modal } from '../ui/modal';
import GlobalActionUpdateForm from './GlobalActionUpdateForm';

// Define a more flexible CombinedAction type
export type CombinedAction = any;

interface GlobalActionsTableProps {
    actions: any[];
    projects: any[];
    users?: any[];
    onViewAction: (action: any) => void;
}

const GlobalActionsTable: React.FC<GlobalActionsTableProps> = ({ actions: initialActions, projects, users = [], onViewAction }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [allActions, setAllActions] = useState<any[]>([]);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedActionForUpdate, setSelectedActionForUpdate] = useState<GlobalAction | null>(null);
    const [updateFormData, setUpdateFormData] = useState({
        title: '',
        content: '',
        category: '',
        projectId: '',
        projectCategory: '',
        responsibleForRealization: '',
        responsibleForFollowUp: '',
        startDate: '',
        endDate: '',
        status: ''
    });

    // Filter state
    const [filterQuery, setFilterQuery] = useState({
        title: '',
        responsible: '',
        category: '',
        startDate: '',
        endDate: ''
    });

    // Helper functions - moved to the top before they are used in hooks

    // Helper function to safely get user name
    const getUserName = (user: any) => {
        if (!user) return 'Non assigné';

        try {
            // Handle object with nom/prenom
            if (typeof user === 'object') {
                if (user.nom && user.prenom) {
                    return `${user.nom} ${user.prenom}`.trim();
                }
                if (user.nom) {
                    return user.nom;
                }
                if (user.prenom) {
                    return user.prenom;
                }
                if (user.name) {
                    return user.name;
                }
            }

            // Handle direct string values
            if (typeof user === 'string') return user;
        } catch (error) {
            console.error('Error getting user name:', error);
        }

        return 'Non assigné';
    };

    // Helper function to get project name
    const getProjectName = (action: any) => {
        if (!action) return 'Projet non spécifié';

        try {
            // For project actions
            if (action.source === 'Project') {
                const project = projects.find(p => p?._id === action.projectId);
                return project?.name || 'Projet non spécifié';
            }

            // For global actions
            if (action.projectId) {
                // If projectId is a string (ID)
                if (typeof action.projectId === 'string') {
                    const project = projects.find(p => p?._id === action.projectId);
                    return project?.name || 'Projet non spécifié';
                }
                // If projectId is an object
                if (typeof action.projectId === 'object') {
                    if (action.projectId?._id) {
                        const project = projects.find(p => p?._id === action.projectId._id);
                        return project?.name || action.projectId?.name || 'Projet non spécifié';
                    }
                    return action.projectId?.name || 'Projet non spécifié';
                }
            }
        } catch (error) {
            console.error('Error getting project name:', error);
        }

        return 'Projet non spécifié';
    };

    // Helper function to get manager info
    const getManagerInfo = (action: any) => {
        if (!action) return null;

        try {
            // For project actions - use the manager who created the action
            if (action.source === 'Project') {
                return action.manager;
            }

            // For global actions - use responsibleForFollowUp
            return action.responsibleForFollowUp;
        } catch (error) {
            console.error('Error getting manager info:', error);
            return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'in_progress':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'warning';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Terminé';
            case 'in_progress':
                return 'En cours';
            case 'cancelled':
                return 'Annulé';
            default:
                return 'En attente';
        }
    };

    // Reset to first page when filter query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterQuery]);

    // Initialize actions when they change
    useEffect(() => {
        if (Array.isArray(initialActions)) {
            console.log("Setting all actions:", initialActions.length);
            setAllActions(initialActions);
        } else {
            console.warn("Actions prop is not an array:", initialActions);
            setAllActions([]);
        }
    }, [initialActions]);

    // Fetch global actions on component mount if not provided
    useEffect(() => {
        const loadActions = async () => {
            try {
                console.log("Fetching initial global actions...");
                setIsLoading(true);
                const result = await dispatch(fetchGlobalActions({})).unwrap();
                console.log("Initial global actions fetched:", result);

                if (result && result.actions && Array.isArray(result.actions)) {
                    setAllActions(result.actions);
                }
            } catch (error) {
                console.error("Error fetching initial global actions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!initialActions || initialActions.length === 0) {
            loadActions();
        }
    }, [dispatch, initialActions]);

    // Handle filter input changes - real-time filtering
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilterQuery(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilterQuery({
            title: '',
            responsible: '',
            category: '',
            startDate: '',
            endDate: ''
        });
    };

    // Apply filters in real-time (client-side filtering)
    const filteredActions = useMemo(() => {
        if (!Array.isArray(allActions) || allActions.length === 0) {
            return [];
        }

        let filtered = [...allActions];

        // Filter by title
        if (filterQuery.title) {
            filtered = filtered.filter(action =>
                action?.title?.toLowerCase().includes(filterQuery.title.toLowerCase())
            );
        }

        // Filter by responsible
        if (filterQuery.responsible) {
            filtered = filtered.filter(action => {
                if (!action) return false;

                const realizationName = action.source === 'Project'
                    ? getUserName(action.responsible)
                    : getUserName(action.responsibleForRealization);

                const followUpName = getUserName(getManagerInfo(action));

                return (realizationName && realizationName.toLowerCase().includes(filterQuery.responsible.toLowerCase())) ||
                    (followUpName && followUpName.toLowerCase().includes(filterQuery.responsible.toLowerCase()));
            });
        }

        // Filter by category
        if (filterQuery.category) {
            filtered = filtered.filter(action =>
                action?.category?.toLowerCase() === filterQuery.category.toLowerCase()
            );
        }

        // Filter by start date
        if (filterQuery.startDate) {
            filtered = filtered.filter(action =>
                action?.startDate && new Date(action.startDate) >= new Date(filterQuery.startDate)
            );
        }

        // Filter by end date
        if (filterQuery.endDate) {
            filtered = filtered.filter(action =>
                action?.endDate && new Date(action.endDate) <= new Date(filterQuery.endDate)
            );
        }

        return filtered;
    }, [allActions, filterQuery]);

    // Sort actions by createdAt date (newest first)
    const sortedActions = useMemo(() => {
        console.log("Sorting filtered actions:", filteredActions.length);
        const sorted = Array.isArray(filteredActions) ? [...filteredActions].sort((a, b) => {
            // If createdAt exists, use it for sorting
            if (a?.createdAt && b?.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            // Fallback to _id if createdAt doesn't exist (less ideal)
            return (a?._id || '') > (b?._id || '') ? -1 : 1;
        }) : [];

        return sorted;
    }, [filteredActions]);

    // Calculate pagination
    const totalPages = Math.ceil(sortedActions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedActions.slice(indexOfFirstItem, indexOfLastItem);

    console.log("Current page:", currentPage, "Total items:", sortedActions.length, "Items per page:", itemsPerPage);
    console.log("Current items:", currentItems.length);

    // Pagination controls
    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const goToPage = (pageNumber: number) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    const handleUpdateStatus = (actionId: string, status: string) => {
        dispatch(updateGlobalActionStatus({ actionId, status }));
    };

    const handleOpenUpdateModal = (action: any) => {
        setSelectedActionForUpdate(action);

        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };

        // Initialize form data with action values
        setUpdateFormData({
            title: action.title || '',
            content: action.content || '',
            category: action.category || '',
            projectId: action.projectId?._id || '',
            projectCategory: action.projectCategory || '',
            responsibleForRealization: action.responsibleForRealization?._id || '',
            responsibleForFollowUp: action.responsibleForFollowUp?._id || '',
            startDate: formatDateForInput(action.startDate),
            endDate: formatDateForInput(action.endDate),
            status: action.status || 'pending'
        });

        setIsUpdateModalOpen(true);
    };

    const handleUpdateAction = () => {
        if (!selectedActionForUpdate) return;

        // Check for required fields
        const missingFields = [];
        if (!updateFormData.title) missingFields.push('titre');
        if (!updateFormData.content) missingFields.push('contenu');
        if (!updateFormData.category) missingFields.push('catégorie');
        if (!updateFormData.responsibleForRealization) missingFields.push('responsable de réalisation');
        if (!updateFormData.responsibleForFollowUp) missingFields.push('responsable de suivi');
        if (!updateFormData.startDate) missingFields.push('date de début');
        if (!updateFormData.endDate) missingFields.push('date de fin');
        if (!updateFormData.status) missingFields.push('statut');

        if (missingFields.length > 0) {
            alert(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`);
            return;
        }

        const actionData = {
            title: updateFormData.title,
            content: updateFormData.content,
            category: updateFormData.category,
            responsibleForRealization: updateFormData.responsibleForRealization,
            responsibleForFollowUp: updateFormData.responsibleForFollowUp,
            startDate: new Date(updateFormData.startDate).toISOString(),
            endDate: new Date(updateFormData.endDate).toISOString(),
            status: updateFormData.status
        };

        // Add projectId only if it exists
        if (updateFormData.projectId) {
            Object.assign(actionData, {
                projectId: updateFormData.projectId,
                projectCategory: updateFormData.projectCategory
            });
        }

        dispatch(updateGlobalAction({
            actionId: selectedActionForUpdate._id,
            actionData
        }));

        setIsUpdateModalOpen(false);
    };

    const handleDeleteAction = (actionId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
            dispatch(deleteGlobalAction(actionId));
        }
    };

    // Get unique categories for the dropdown
    const uniqueCategories = Array.from(new Set(allActions.map(action => action.category))).filter(Boolean);

    return (
        <div className="overflow-hidden">
            {/* Filter Form */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Titre
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={filterQuery.title}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Filtrer par titre"
                            />
                        </div>

                        <div>
                            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Responsable
                            </label>
                            <input
                                type="text"
                                id="responsible"
                                name="responsible"
                                value={filterQuery.responsible}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                placeholder="Filtrer par responsable"
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Catégorie
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={filterQuery.category}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="">Toutes les catégories</option>
                                {uniqueCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={filterQuery.startDate}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={filterQuery.endDate}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {isLoading ? (
                                "Chargement en cours..."
                            ) : (
                                <>
                                    {sortedActions.length} action(s) trouvée(s)
                                    {sortedActions.length === 0 && filterQuery.title &&
                                        <span className="ml-2 text-orange-500">
                                            Aucun résultat pour "{filterQuery.title}"
                                        </span>
                                    }
                                </>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600"
                                disabled={isLoading}
                            >
                                <X className="mr-1.5 h-4 w-4" />
                                Effacer les filtres
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Titre & Description
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Responsables
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Catégorie
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Dates
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Statut
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {currentItems.length > 0 ? (
                                currentItems.map((action) => (
                                    <TableRow key={action._id}>
                                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                                            <div>
                                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                    {action.title}
                                                </span>
                                                <span className="block text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                                    {action.content}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <div className="space-y-1">
                                                <div>
                                                    <span className="text-xs text-gray-400">Réalisation:</span>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {action.source === 'Project'
                                                            ? getUserName(action.responsible)
                                                            : getUserName(action.responsibleForRealization)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-400">Suivi:</span>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {getUserName(getManagerInfo(action))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <div>
                                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                    {action.category}
                                                </span>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    Projet: {getProjectName(action)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <div className="space-y-1 text-xs">
                                                <div>
                                                    <span className="text-gray-400">Début:</span>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {action.startDate && !isNaN(new Date(action.startDate).getTime())
                                                            ? format(new Date(action.startDate), 'dd MMM yyyy', { locale: fr })
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Fin:</span>
                                                    <div className="font-medium text-gray-800 dark:text-white/90">
                                                        {action.endDate && !isNaN(new Date(action.endDate).getTime())
                                                            ? format(new Date(action.endDate), 'dd MMM yyyy', { locale: fr })
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <Badge
                                                size="sm"
                                                color={getStatusColor(action.status)}
                                            >
                                                {getStatusText(action.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onViewAction(action)}
                                                    className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="size-4" />
                                                </button>
                                                {(action.status === 'pending' || action.status === 'in_progress') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(action._id, action.status === 'pending' ? 'in_progress' : 'completed')}
                                                            className="p-1 hover:bg-green-50 rounded-full transition-colors text-green-600"
                                                            title={action.status === 'pending' ? 'Démarrer' : 'Terminer'}
                                                        >
                                                            {action.status === 'pending' ? (
                                                                <Calendar className="size-4" />
                                                            ) : (
                                                                <CheckCircle className="size-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenUpdateModal(action)}
                                                            className="p-1 hover:bg-blue-50 rounded-full transition-colors text-blue-600"
                                                            title="Modifier"
                                                        >
                                                            <Edit className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAction(action._id)}
                                                            className="p-1 hover:bg-red-50 rounded-full transition-colors text-red-600"
                                                            title="Supprimer"
                                                        >
                                                            <Trash className="size-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-4 py-12 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                                                <p className="mt-2 text-gray-500">Chargement des résultats...</p>
                                            </div>
                                        ) : filterQuery.title || filterQuery.responsible || filterQuery.category ||
                                            filterQuery.startDate || filterQuery.endDate ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-gray-400 text-xl mb-2">🔍</span>
                                                <p className="text-gray-500 text-lg font-medium">Aucun résultat trouvé</p>
                                                <p className="text-gray-400 mt-1">
                                                    Essayez d'autres termes de recherche ou <button
                                                        className="text-blue-500 hover:underline"
                                                        onClick={clearFilters}
                                                    >
                                                        effacez les filtres
                                                    </button>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune action trouvée</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    Précédent
                                </button>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    Suivant
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                                        <span className="font-medium">
                                            {Math.min(indexOfLastItem, sortedActions.length)}
                                        </span>{' '}
                                        sur <span className="font-medium">{sortedActions.length}</span> actions
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={goToPreviousPage}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="sr-only">Précédent</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>

                                        {/* Page number buttons */}
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Calculate page numbers to show
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                // If 5 or fewer pages, show all pages
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                // If current page is near the start
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                // If current page is near the end
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                // If current page is in the middle
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-400'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={goToNextPage}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="sr-only">Suivant</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Modal */}
            <Modal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                className="max-w-2xl mx-auto"
            >
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-3">Modifier l'action</h2>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {selectedActionForUpdate && (
                            <GlobalActionUpdateForm
                                action={selectedActionForUpdate}
                                formData={updateFormData}
                                setFormData={setUpdateFormData}
                                projects={projects}
                                users={users}
                            />
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleUpdateAction}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GlobalActionsTable; 