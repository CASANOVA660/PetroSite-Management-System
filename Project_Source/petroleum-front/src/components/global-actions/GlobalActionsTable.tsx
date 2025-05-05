import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { updateGlobalActionStatus, deleteGlobalAction, fetchGlobalActions, GlobalAction, updateGlobalAction } from '../../store/slices/globalActionSlice';
import { updateActionStatus, deleteAction } from '../../store/slices/actionSlice';
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
import axios from '../../utils/axios';

// Define a more flexible CombinedAction type
export type CombinedAction = any;

interface GlobalActionsTableProps {
    actions: any[];
    projects: any[];
    users?: any[];
    onViewAction: (action: any) => void;
    onRefresh?: () => void; // Optional callback for refreshing parent component
}

const GlobalActionsTable: React.FC<GlobalActionsTableProps> = ({ actions: initialActions, projects, users = [], onViewAction, onRefresh }) => {
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
        status: '',
        needsValidation: false
    });

    // Filter state
    const [filterQuery, setFilterQuery] = useState({
        title: '',
        responsible: '',
        category: '',
        startDate: '',
        endDate: ''
    });

    // Add polling interval and last update tracking
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const POLLING_INTERVAL = 900000; // Increased from 300000 (5 min) to 900000 (15 min)

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
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-orange-100 text-orange-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
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

    // First, add this function to check if tasks need validation
    const getNeedsValidationStatus = (action: any) => {
        // Check if the action itself has the needsValidation property
        if (action.needsValidation !== undefined) {
            return action.needsValidation;
        }

        // For project actions
        if (action.isProjectAction && action.tasks && action.tasks.length > 0) {
            return action.tasks.some((task: any) => task.needsValidation);
        }

        // For global actions with tasks
        if (action.tasks && action.tasks.length > 0) {
            return action.tasks.some((task: any) => task.needsValidation);
        }

        // Default to false if we can't determine
        return false;
    };

    // Reset to first page when filter query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterQuery]);

    // Initialize actions when they change
    useEffect(() => {
        if (Array.isArray(initialActions)) {
            setAllActions(initialActions);
            // Update last refresh time when initialActions change
            setLastUpdateTime(new Date());
        } else {
            console.warn("Actions prop is not an array:", initialActions);
            setAllActions([]);
        }
    }, [initialActions]);

    // Set up polling for automatic refresh
    useEffect(() => {
        const startPolling = () => {
            // Clear any existing interval first
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }

            // Set new polling interval
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    console.log("Auto-refreshing global actions...");
                    const result = await dispatch(fetchGlobalActions({})).unwrap();
                    console.log("Auto-refresh completed:", result);

                    if (result && result.actions && Array.isArray(result.actions)) {
                        setAllActions(result.actions);
                        setLastUpdateTime(new Date());
                    }
                } catch (error) {
                    console.error("Error during auto-refresh:", error);
                }
            }, POLLING_INTERVAL);
        };

        // Start polling
        startPolling();

        // Clean up on component unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [dispatch]);

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

    // Handle update status with parent refresh
    const handleUpdateStatus = (actionId: string, status: string, isProjectAction: boolean) => {
        const typedStatus = status as 'pending' | 'in_progress' | 'completed' | 'cancelled';
        if (isProjectAction) {
            dispatch(updateActionStatus({ actionId, status: typedStatus }))
                .then(() => {
                    // Update the local state immediately
                    const newActions = [...allActions];
                    const index = newActions.findIndex(a => a._id === actionId);
                    if (index !== -1) {
                        newActions[index] = { ...newActions[index], status: typedStatus };
                        setAllActions(newActions);
                    }
                    // Update last refresh time
                    setLastUpdateTime(new Date());
                    // Refresh all actions to ensure we have fresh data
                    dispatch(fetchGlobalActions({}));

                    // Notify parent component to refresh
                    if (onRefresh) {
                        onRefresh();
                    }
                });
        } else {
            dispatch(updateGlobalActionStatus({ actionId, status: typedStatus }))
                .then(() => {
                    // Update the local state immediately
                    const newActions = [...allActions];
                    const index = newActions.findIndex(a => a._id === actionId);
                    if (index !== -1) {
                        newActions[index] = { ...newActions[index], status: typedStatus };
                        setAllActions(newActions);
                    }
                    // Update last refresh time
                    setLastUpdateTime(new Date());
                    // Refresh all actions to ensure we have fresh data
                    dispatch(fetchGlobalActions({}));

                    // Notify parent component to refresh
                    if (onRefresh) {
                        onRefresh();
                    }
                });
        }
    };

    const handleOpenUpdateModal = (action: any) => {
        setSelectedActionForUpdate(action);

        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        };

        // For project-specific actions, handle different field structure
        if (action.source === 'Project') {
            setUpdateFormData({
                title: action.title || '',
                content: action.content || '',
                category: action.category || '',
                projectId: action.projectId || '',
                projectCategory: '',
                // For project actions, responsible is in a different field
                responsibleForRealization: action.responsible?._id || '',
                // For project actions, manager is always responsibleForFollowUp
                responsibleForFollowUp: action.manager?._id || '',
                startDate: formatDateForInput(action.startDate),
                endDate: formatDateForInput(action.endDate),
                status: action.status || 'pending',
                needsValidation: action.needsValidation === true
            });
        } else {
            // Standard global action
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
                status: action.status || 'pending',
                needsValidation: action.needsValidation === true
            });
        }

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
        if (!updateFormData.startDate) missingFields.push('date de début');
        if (!updateFormData.endDate) missingFields.push('date de fin');
        // Status is now managed by task updates, so we don't check it here

        if (missingFields.length > 0) {
            alert(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`);
            return;
        }

        // Track if responsible persons changed for notification
        const originalRealizationId = selectedActionForUpdate.responsibleForRealization?._id || '';
        const originalFollowUpId = selectedActionForUpdate.responsibleForFollowUp?._id || '';
        const newRealizationId = updateFormData.responsibleForRealization;
        const newFollowUpId = updateFormData.responsibleForFollowUp;

        // Check if assignment changed
        const responsibleChanged = originalRealizationId !== newRealizationId || originalFollowUpId !== newFollowUpId;

        const isProjectAction = selectedActionForUpdate.source === 'Project';

        if (isProjectAction) {
            // For project action, we need to use a different structure and endpoint
            const actionData = {
                title: updateFormData.title,
                content: updateFormData.content,
                category: updateFormData.category,
                // For project actions, responsible is the field name
                responsible: updateFormData.responsibleForRealization,
                startDate: new Date(updateFormData.startDate).toISOString(),
                endDate: new Date(updateFormData.endDate).toISOString(),
                needsValidation: updateFormData.needsValidation,
                // Keep the existing source, projectId and status
                source: selectedActionForUpdate.source || 'Project',
                projectId: selectedActionForUpdate.projectId,
                status: selectedActionForUpdate.status, // Preserve original status
                // Add flag for notification
                sendNotification: responsibleChanged
            };

            // Close the modal first for better UX
            setIsUpdateModalOpen(false);

            // Use the correct URL format with the base URL from axios instance
            axios.put(`/actions/${selectedActionForUpdate._id}`, actionData)
                .then(response => {

                    // Update the local state immediately with the updated action
                    const updatedAction = response.data.data;
                    const newActions = [...allActions];
                    const index = newActions.findIndex(a => a._id === updatedAction._id);
                    if (index !== -1) {
                        newActions[index] = updatedAction;
                        setAllActions(newActions);
                    }

                    // Then fetch all actions to ensure we have fresh data
                    dispatch(fetchGlobalActions({}));

                    // Update last refresh time
                    setLastUpdateTime(new Date());

                    // Notify parent component to refresh
                    if (onRefresh) {
                        onRefresh();
                    }

                    // Show notification feedback if responsible changed
                    if (responsibleChanged) {
                        alert('Action mise à jour et notification envoyée au(x) nouveau(x) responsable(s)');
                    } else {
                        alert('Action mise à jour avec succès');
                    }
                })
                .catch(error => {
                    console.error('Error updating project action:', error);
                    console.error('Error details:', error.response?.data || error.message);
                    alert('Erreur lors de la mise à jour de l\'action: ' + (error.response?.data?.message || error.message));
                });
        } else {
            // Standard global action
            const actionData = {
                title: updateFormData.title,
                content: updateFormData.content,
                category: updateFormData.category,
                responsibleForRealization: updateFormData.responsibleForRealization,
                responsibleForFollowUp: updateFormData.responsibleForFollowUp,
                startDate: new Date(updateFormData.startDate).toISOString(),
                endDate: new Date(updateFormData.endDate).toISOString(),
                needsValidation: updateFormData.needsValidation,
                status: selectedActionForUpdate.status, // Preserve original status
                // Add flag for notification
                sendNotification: responsibleChanged
            };

            // Add projectId only if it exists
            if (updateFormData.projectId) {
                Object.assign(actionData, {
                    projectId: updateFormData.projectId,
                    projectCategory: updateFormData.projectCategory
                });
            }

            // Close the modal first for better UX
            setIsUpdateModalOpen(false);

            // Dispatch the update action
            dispatch(updateGlobalAction({
                actionId: selectedActionForUpdate._id,
                actionData
            })).then((response: any) => {
                if (response.payload && response.payload.data) {
                    // Update the local state immediately with the updated action
                    const updatedAction = response.payload.data;
                    const newActions = [...allActions];
                    const index = newActions.findIndex(a => a._id === updatedAction._id);
                    if (index !== -1) {
                        newActions[index] = updatedAction;
                        setAllActions(newActions);
                    }
                }

                // Then fetch all actions to ensure we have fresh data
                dispatch(fetchGlobalActions({}));

                // Update last refresh time
                setLastUpdateTime(new Date());

                // Notify parent component to refresh
                if (onRefresh) {
                    onRefresh();
                }

                // Show notification feedback if responsible changed
                if (responsibleChanged) {
                    alert('Action mise à jour et notification envoyée au(x) nouveau(x) responsable(s)');
                } else {
                    alert('Action mise à jour avec succès');
                }
            }).catch((error: any) => {
                console.error('Error updating global action:', error);
                alert('Erreur lors de la mise à jour de l\'action: ' + (error.message || 'Erreur inconnue'));
            });
        }
    };

    // Force refresh function
    const handleForceRefresh = useCallback(async () => {
        try {
            setIsLoading(true);

            // Add visual feedback for the user
            const loadingMessage = 'Actualisation des données en cours...';

            const result = await dispatch(fetchGlobalActions({})).unwrap();

            if (result && result.actions && Array.isArray(result.actions)) {
                setAllActions(result.actions);
                setLastUpdateTime(new Date());
            }

            // Also call the parent refresh if available
            if (onRefresh) {
                onRefresh();
            }

            // Add a small delay before clearing the loading state to ensure the user sees the loading indicator
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error during manual refresh:", error);
            setIsLoading(false);
            // Provide feedback to the user about the error
            alert('Erreur lors de l\'actualisation des données. Veuillez réessayer.');
        }
    }, [dispatch, onRefresh]);

    const handleDeleteAction = (actionId: string, isProjectAction: boolean) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
            if (isProjectAction) {
                // Delete project-specific action
                axios.delete(`/actions/${actionId}`)
                    .then(response => {
                        console.log('Project action deleted:', response.data);
                        // Refresh the actions list
                        dispatch(fetchGlobalActions({})).then(() => {
                            // Remove the deleted action from local state immediately for better UX
                            setAllActions(prev => prev.filter(a => a._id !== actionId));
                            // Update last refresh time
                            setLastUpdateTime(new Date());

                            // Notify parent component to refresh
                            if (onRefresh) {
                                onRefresh();
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error deleting project action:', error);
                        alert('Erreur lors de la suppression de l\'action: ' + (error.response?.data?.message || error.message));
                    });
            } else {
                // Delete global action
                dispatch(deleteGlobalAction(actionId)).then(() => {
                    // Remove the deleted action from local state immediately for better UX
                    setAllActions(prev => prev.filter(a => a._id !== actionId));
                    // Update last refresh time
                    setLastUpdateTime(new Date());
                    // Refresh the actions list to ensure we have fresh data
                    dispatch(fetchGlobalActions({}));

                    // Notify parent component to refresh
                    if (onRefresh) {
                        onRefresh();
                    }
                });
            }
        }
    };

    // Get unique categories for the dropdown
    const uniqueCategories = Array.from(new Set(allActions.map(action => action.category))).filter(Boolean);

    return (
        <div className="overflow-hidden">
            {/* Filter Form */}
            <div className="mb-6 bg-[#FDFBF7] p-6 rounded-2xl shadow-lg border border-gray-100 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Filtres</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleForceRefresh}
                            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-md border border-gray-200 hover:bg-orange-50 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="animate-spin mr-2">⟳</span>
                            ) : (
                                <span className="mr-2">⟳</span>
                            )}
                            Actualiser
                        </button>
                        <span className="text-xs text-gray-600 font-medium">
                            Dernière mise à jour: {format(lastUpdateTime, 'HH:mm:ss', { locale: fr })}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Title Filter */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Titre
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={filterQuery.title}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50 pl-10 shadow-inner"
                                    placeholder="Filtrer par titre"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>

                        {/* Responsible Filter */}
                        <div>
                            <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                                Responsable
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="responsible"
                                    name="responsible"
                                    value={filterQuery.responsible}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50 pl-10 shadow-inner"
                                    placeholder="Filtrer par responsable"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                Catégorie
                            </label>
                            <div className="relative">
                                <select
                                    id="category"
                                    name="category"
                                    value={filterQuery.category}
                                    onChange={handleFilterChange}
                                    className="appearance-none w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50 shadow-inner"
                                >
                                    <option value="">Toutes les catégories</option>
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">▼</span>
                            </div>
                        </div>

                        {/* Start Date Filter */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Date de début
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={filterQuery.startDate}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50 pl-10 shadow-inner"
                                />
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>

                        {/* End Date Filter */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Date de fin
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={filterQuery.endDate}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50 pl-10 shadow-inner"
                                />
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600 font-medium">
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
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-md border border-gray-200 hover:bg-orange-50 transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Effacer les filtres
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                    <Table>
                        <TableHeader className="bg-[#FDFBF7] border-b border-gray-100 shadow-inner">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Titre & Description
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Responsables
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Catégorie
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Dates
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Statut
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-700 text-sm uppercase tracking-wider"
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100">
                            {currentItems.length > 0 ? (
                                currentItems.map((action) => (
                                    <TableRow key={action._id} className="hover:bg-[#F9F5EF] transition-all duration-300">
                                        <TableCell className="px-6 py-4">
                                            <div>
                                                <span className="block font-semibold text-gray-800 text-base">
                                                    {action.title}
                                                </span>
                                                <span className="block text-gray-600 text-sm mt-1">
                                                    {action.content}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-600 text-sm">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-xs text-gray-500">Réalisation:</span>
                                                    <div className="font-medium text-gray-800">
                                                        {action.source === 'Project'
                                                            ? getUserName(action.responsible)
                                                            : getUserName(action.responsibleForRealization)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Suivi:</span>
                                                    <div className="font-medium text-gray-800">
                                                        {getUserName(getManagerInfo(action))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-600 text-sm">
                                            <div>
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                    {action.category}
                                                </span>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Projet: {getProjectName(action)}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-600 text-sm">
                                            <div className="space-y-2 text-xs">
                                                <div>
                                                    <span className="text-gray-500">Début:</span>
                                                    <div className="font-medium text-gray-800">
                                                        {action.startDate && !isNaN(new Date(action.startDate).getTime())
                                                            ? format(new Date(action.startDate), 'dd MMM yyyy', { locale: fr })
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Fin:</span>
                                                    <div className="font-medium text-gray-800">
                                                        {action.endDate && !isNaN(new Date(action.endDate).getTime())
                                                            ? format(new Date(action.endDate), 'dd MMM yyyy', { locale: fr })
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(action.status)}`}>
                                                    {getStatusText(action.status)}
                                                </span>

                                                {/* Validation Badge */}
                                                {action.needsValidation === true ? (
                                                    <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                                        Validation requise
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                                        Auto-validé
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onViewAction(action)}
                                                    className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all duration-300"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {(action.status === 'pending' || action.status === 'in_progress') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenUpdateModal(action)}
                                                            className="p-1.5 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 transition-all duration-300"
                                                            title="Modifier"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAction(action._id, action.source === 'Project')}
                                                            className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300"
                                                            title="Supprimer"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-6 py-12 text-center">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin"></div>
                                                <p className="mt-3 text-gray-600 font-medium">Chargement des résultats...</p>
                                            </div>
                                        ) : filterQuery.title || filterQuery.responsible || filterQuery.category ||
                                            filterQuery.startDate || filterQuery.endDate ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-gray-400 text-2xl mb-3">🔍</span>
                                                <p className="text-gray-600 text-lg font-semibold">Aucun résultat trouvé</p>
                                                <p className="text-gray-500 mt-2">
                                                    Essayez d'autres termes de recherche ou{' '}
                                                    <button
                                                        className="text-orange-500 hover:underline"
                                                        onClick={clearFilters}
                                                    >
                                                        effacez les filtres
                                                    </button>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 font-medium">Aucune action trouvée</p>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-[#FDFBF7] shadow-inner">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white shadow-md border border-gray-200 transition-all duration-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-50 hover:shadow-lg'}`}
                                >
                                    Précédent
                                </button>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white shadow-md border border-gray-200 transition-all duration-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-50 hover:shadow-lg'}`}
                                >
                                    Suivant
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700 font-medium">
                                        Affichage de <span className="font-semibold">{indexOfFirstItem + 1}</span> à{' '}
                                        <span className="font-semibold">
                                            {Math.min(indexOfLastItem, sortedActions.length)}
                                        </span>{' '}
                                        sur <span className="font-semibold">{sortedActions.length}</span> actions
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-full text-gray-600 bg-white shadow-md border border-gray-200 transition-all duration-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-50 hover:shadow-lg'}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {/* Page number buttons */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToPage(pageNum)}
                                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${currentPage === pageNum
                                                    ? 'bg-orange-500 text-white shadow-inner'
                                                    : 'bg-white text-gray-700 shadow-md border border-gray-200 hover:bg-orange-50 hover:shadow-lg'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-full text-gray-600 bg-white shadow-md border border-gray-200 transition-all duration-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-50 hover:shadow-lg'}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
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
                className="max-w-2xl mx-auto rounded-2xl shadow-2xl"
            >
                <div className="p-6 bg-[#FDFBF7] shadow-inner">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Modifier l'action</h2>
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
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsUpdateModalOpen(false)}
                            className="rounded-full px-5 py-2 border border-gray-200 text-gray-700 bg-white shadow-md hover:bg-gray-50 transition-all duration-300"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleUpdateAction}
                            className="rounded-full px-5 py-2 bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-all duration-300"
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