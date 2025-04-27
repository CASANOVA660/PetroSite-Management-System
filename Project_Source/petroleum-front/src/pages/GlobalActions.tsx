import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchGlobalActions, createGlobalAction } from '../store/slices/globalActionSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { fetchAllActions } from '../store/slices/actionSlice';
import { fetchUserTasks } from '../store/slices/taskSlice';
import { debounce } from 'lodash';
import { GlobalAction } from '../store/slices/globalActionSlice';
import { Action } from '../store/slices/actionSlice';
import { GlobalActionFormData } from '../types/action';
import PlusIcon from '../components/icons/PlusIcon';
import GanttChart from '../components/tasks/GanttChart';
import { ChevronLeft, Calendar, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import components
import {
    GlobalActionsTable,
    GlobalActionForm,
    GlobalActionView,
    SearchBar,
    FilterBar,
    GlobalActionsTimeline
} from '../components/global-actions';
import { Modal } from '../components/ui/modal';
import Button from '../components/ui/button/Button';
import PageMeta from '../components/common/PageMeta';

// Define a type for combined actions
type CombinedAction = (GlobalAction | Action) & {
    isProjectAction: boolean;
    projectId?: { _id: string; name: string };
    project?: { _id: string; name: string };
};

// Define the interface for GlobalActionsTable props
interface GlobalActionsTableImplProps {
    actions: any[];
    projects: any[];
    users?: any[];
    onViewAction: (action: any) => void;
    onRefresh?: () => Promise<void> | void;
}

const GlobalActions: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [view, setView] = useState<'table' | 'timeline' | 'gantt'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'opened' | 'closed'>('all');
    const [filterType, setFilterType] = useState<'all' | 'global' | 'project'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<GlobalAction | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const { actions: projectActions } = useSelector((state: RootState) => state.actions);
    const { actions: globalActions, loading, error } = useSelector((state: RootState) => state.globalActions);
    const { projects } = useSelector((state: RootState) => state.projects);
    const { users } = useSelector((state: RootState) => state.users);
    const { user } = useSelector((state: RootState) => state.auth);
    const isManager = user?.role === 'manager';

    // Gantt chart state
    const [timeScale, setTimeScale] = useState<'week' | 'month' | 'year'>('month');

    const [formData, setFormData] = useState<GlobalActionFormData>({
        title: '',
        content: '',
        category: '',
        projectId: '',
        projectCategory: '',
        responsibleForRealization: '',
        responsibleForFollowUp: '',
        startDate: '',
        endDate: '',
        needsValidation: true
    });

    // Refresh function to be passed to the table component
    const refreshAllActions = useCallback(async () => {
        try {
            setIsRefreshing(true);

            // Fetch both global and project actions
            await Promise.all([
                dispatch(fetchGlobalActions({})),
                dispatch(fetchAllActions())
            ]);

            setLastRefreshTime(new Date());

            // Add a small delay before clearing the loading state
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);

        } catch (error) {
            console.error('Error refreshing actions:', error);
            setIsRefreshing(false);
        }
    }, [dispatch]);

    // Fetch both global and project actions when component mounts
    useEffect(() => {
        refreshAllActions();
    }, [refreshAllActions]);

    // Update selectedAction when globalActions changes
    useEffect(() => {
        if (selectedAction && isViewModalOpen) {
            // Find the updated version of the selected action
            const updatedAction = globalActions.find(action => action._id === selectedAction._id);
            if (updatedAction) {
                setSelectedAction(updatedAction);
            }
        }
    }, [globalActions, selectedAction, isViewModalOpen]);

    useEffect(() => {
        dispatch(fetchProjects());
        dispatch(fetchUsers());
    }, [dispatch]);

    // Transform actions to include isProjectAction flag
    const combinedActions = useMemo(() => {
        return [
            ...globalActions.map(action => ({
                ...action,
                isProjectAction: false,
                source: 'Global'
            })),
            ...projectActions.map(action => ({
                ...action,
                isProjectAction: true,
                source: 'Project',
                projectId: action.projectId
            }))
        ];
    }, [globalActions, projectActions]);

    // Calculate metrics using useMemo
    const metrics = useMemo(() => {
        const actions = Array.isArray(combinedActions) ? combinedActions : [];

        const totalActions = actions.length;
        const completedActions = actions.filter(action => action?.status === 'completed').length;
        const inProgressActions = actions.filter(action => action?.status === 'in_progress').length;
        const pendingActions = actions.filter(action => action?.status === 'pending').length;

        const calculatedMetrics = {
            totalActions,
            completedActions,
            inProgressActions,
            pendingActions
        };

        return calculatedMetrics;
    }, [combinedActions]);

    // Debounced search function
    const debouncedSearch = debounce((term) => {
        dispatch(fetchGlobalActions({ searchTerm: term }));
    }, 500);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Handle create action with refresh
    const handleCreateAction = () => {
        const missingFields = [];

        if (!formData.title) missingFields.push('title');
        if (!formData.content) missingFields.push('content');
        if (!formData.category) missingFields.push('category');
        if (!formData.responsibleForRealization) missingFields.push('responsibleForRealization');
        if (!formData.responsibleForFollowUp) missingFields.push('responsibleForFollowUp');
        if (!formData.startDate) missingFields.push('startDate');
        if (!formData.endDate) missingFields.push('endDate');

        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            alert(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`);
            return;
        }

        const formattedData: {
            title: string;
            content: string;
            category: string;
            responsibleForRealization: string;
            responsibleForFollowUp: string;
            startDate: string;
            endDate: string;
            status: string;
            needsValidation: boolean;
            projectId?: string;
            projectCategory?: string;
        } = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category,
            responsibleForRealization: formData.responsibleForRealization,
            responsibleForFollowUp: formData.responsibleForFollowUp,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            status: 'pending',
            needsValidation: formData.needsValidation
        };

        if (formData.projectId) {
            formattedData.projectId = formData.projectId;
            if (formData.projectCategory) {
                formattedData.projectCategory = formData.projectCategory;
            }
        }

        dispatch(createGlobalAction(formattedData))
            .then(() => {
                refreshAllActions();
                toast.success('Action globale créée avec succès');

                dispatch(fetchUserTasks({ includeProjectActions: true }));

                setTimeout(() => {
                    console.log('First delayed refresh of tasks after global action creation...');
                    dispatch(fetchUserTasks({ includeProjectActions: true }));
                }, 1000);

                setTimeout(() => {
                    console.log('Second delayed refresh of tasks after global action creation...');
                    dispatch(fetchUserTasks({ includeProjectActions: true }));
                }, 3000);
            })
            .catch(error => {
                console.error('Error creating global action:', error);
                toast.error('Erreur lors de la création de l\'action globale');
            });

        setIsCreateModalOpen(false);
        setFormData({
            title: '',
            content: '',
            category: '',
            projectId: '',
            projectCategory: '',
            responsibleForRealization: '',
            responsibleForFollowUp: '',
            startDate: '',
            endDate: '',
            needsValidation: true
        });
    };

    const handleViewAction = (action: CombinedAction) => {
        setSelectedAction(action as any);
        setIsViewModalOpen(true);
    };

    const filteredActions = useMemo(() => {
        return combinedActions.filter(action => {
            if (filterStatus !== 'all') {
                if (filterStatus === 'opened' && action.status === 'completed') return false;
                if (filterStatus === 'closed' && action.status !== 'completed') return false;
            }
            if (filterType !== 'all') {
                if (filterType === 'global' && action.isProjectAction) return false;
                if (filterType === 'project' && !action.isProjectAction) return false;
            }
            return true;
        });
    }, [combinedActions, filterStatus, filterType]);

    // Prepare data for Gantt chart
    const ganttTasks = useMemo(() => {
        return filteredActions.map(action => ({
            id: action._id,
            task: action.title,
            startDate: action.startDate,
            endDate: action.endDate,
            progress: action.status === 'completed' ? 100 : action.status === 'in_progress' ? 50 : 0,
            color: action.status === 'completed' ? '#10b981' : action.status === 'in_progress' ? '#f59e0b' : '#6366f1'
        }));
    }, [filteredActions]);

    // Handle time scale change
    const handleTimeScaleChange = (scale: 'week' | 'month' | 'year') => {
        setTimeScale(scale);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Actions Globales" description="Gestion des actions globales" />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 px-6 py-10">
                <div className="container mx-auto">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-semibold text-gray-800 tracking-tight">Actions Globales</h1>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={refreshAllActions}
                                disabled={isRefreshing}
                                variant="outline"
                                className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-colors duration-300 rounded-full px-5 py-2 shadow-sm"
                            >
                                {isRefreshing ? (
                                    <span className="animate-spin">⟳</span>
                                ) : (
                                    <span>⟳</span>
                                )}
                                Actualiser
                            </Button>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-300 rounded-full px-5 py-2 shadow-lg"
                            >
                                <PlusIcon size={16} />
                                Créer une action
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Actions Card */}
                        <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-medium opacity-90">Total Actions</h3>
                                <p className="text-4xl font-bold mt-2">{metrics.totalActions}</p>
                                <p className="text-sm opacity-80 mt-1">Across all projects</p>
                            </div>
                        </div>

                        {/* Completed Actions Card */}
                        <div className="relative bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-medium opacity-90">Completed Actions</h3>
                                <p className="text-4xl font-bold mt-2">{metrics.completedActions}</p>
                                <p className="text-sm opacity-80 mt-1">{metrics.totalActions > 0 ? ((metrics.completedActions / metrics.totalActions) * 100).toFixed(1) : '0.0'}% Success Rate</p>
                            </div>
                        </div>

                        {/* In Progress Actions Card */}
                        <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-medium opacity-90">In Progress</h3>
                                <p className="text-4xl font-bold mt-2">{metrics.inProgressActions}</p>
                                <p className="text-sm opacity-80 mt-1">Currently active</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* View Toggle and Filters */}
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-teal-50 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative inline-flex items-center rounded-full bg-white shadow-md border border-gray-200">
                                        <Button
                                            variant={view === 'table' ? 'primary' : 'outline'}
                                            size="sm"
                                            onClick={() => setView('table')}
                                            className={`flex items-center gap-2 rounded-l-full px-5 py-2 transition-all duration-300 ${view === 'table' ? 'bg-orange-500 text-white shadow-inner' : 'text-gray-700 hover:bg-orange-50'}`}
                                        >
                                            <List size={16} />
                                            Tableau
                                        </Button>
                                        <Button
                                            variant={view === 'gantt' ? 'primary' : 'outline'}
                                            size="sm"
                                            onClick={() => setView('gantt')}
                                            className={`flex items-center gap-2 rounded-r-full px-5 py-2 transition-all duration-300 ${view === 'gantt' ? 'bg-orange-500 text-white shadow-inner' : 'text-gray-700 hover:bg-orange-50'}`}
                                        >
                                            <Calendar size={16} />
                                            Timeline
                                        </Button>
                                    </div>
                                </div>

                                <FilterBar
                                    filterStatus={filterStatus}
                                    setFilterStatus={setFilterStatus}
                                    filterType={filterType}
                                    setFilterType={setFilterType}
                                    view={view}
                                    setView={setView}
                                />
                            </div>
                        </div>

                        {/* Gantt View Time Scale Selector */}
                        {view === 'gantt' && (
                            <div className="p-6 bg-gradient-to-r from-gray-50 to-teal-50 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setView('table')}
                                        className="flex items-center gap-2 rounded-full px-5 py-2 border-orange-500 text-orange-600 bg-white shadow-md hover:bg-orange-50 transition-all duration-300 hover:shadow-lg"
                                    >
                                        <ChevronLeft size={16} />
                                        Retour au tableau
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">Échelle de temps:</span>
                                        <div className="relative inline-flex items-center rounded-full bg-white shadow-md border border-gray-200">
                                            <button
                                                className={`px-5 py-2 text-sm rounded-l-full transition-all duration-300 ${timeScale === 'week' ? 'bg-orange-500 text-white shadow-inner' : 'text-gray-700 hover:bg-orange-50'}`}
                                                onClick={() => handleTimeScaleChange('week')}
                                            >
                                                Semaine
                                            </button>
                                            <button
                                                className={`px-5 py-2 text-sm transition-all duration-300 ${timeScale === 'month' ? 'bg-orange-500 text-white shadow-inner' : 'text-gray-700 hover:bg-orange-50'}`}
                                                onClick={() => handleTimeScaleChange('month')}
                                            >
                                                Mois
                                            </button>
                                            <button
                                                className={`px-5 py-2 text-sm rounded-r-full transition-all duration-300 ${timeScale === 'year' ? 'bg-orange-500 text-white shadow-inner' : 'text-gray-700 hover:bg-orange-50'}`}
                                                onClick={() => handleTimeScaleChange('year')}
                                            >
                                                Année
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-0">
                            {view === 'table' ? (
                                <GlobalActionsTable
                                    actions={filteredActions as any}
                                    projects={projects}
                                    users={users}
                                    onViewAction={handleViewAction}
                                    onRefresh={refreshAllActions}
                                />
                            ) : view === 'gantt' ? (
                                <div className="px-2 pb-4 overflow-hidden">
                                    <GanttChart
                                        tasks={ganttTasks}
                                        timeScale={timeScale}
                                    />
                                </div>
                            ) : (
                                <GlobalActionsTimeline
                                    actions={filteredActions.filter(action => action.status !== 'completed') as any}
                                />
                            )}
                        </div>
                    </div>

                    {/* Create Action Form */}
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-semibold text-gray-800">Créer une action globale</h2>
                                        <button
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        >
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <GlobalActionForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        projects={projects}
                                        users={users}
                                    />
                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="rounded-full px-5 py-2 border-teal-600 text-teal-600 hover:bg-teal-50 transition-colors duration-300 border"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleCreateAction}
                                            className="rounded-full px-5 py-2 bg-teal-600 text-white hover:bg-teal-700 transition-colors duration-300"
                                        >
                                            Créer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Action Modal */}
                    <Modal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        className="max-w-2xl mx-auto rounded-2xl shadow-2xl"
                    >
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-teal-50">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Détails de l'action</h2>
                            <div className="max-h-[60vh] overflow-y-auto pr-2">
                                {selectedAction && <GlobalActionView action={selectedAction} isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} />}
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="rounded-full px-5 py-2 bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-300"
                                >
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </>
    );
};

export default GlobalActions;