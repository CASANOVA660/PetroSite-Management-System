import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchGlobalActions, createGlobalAction } from '../store/slices/globalActionSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { fetchAllActions } from '../store/slices/actionSlice';
import { debounce } from 'lodash';
import { GlobalAction } from '../store/slices/globalActionSlice';
import { Action } from '../store/slices/actionSlice';
import PlusIcon from '../components/icons/PlusIcon';
import EcommerceMetrics from '../components/ecommerce/EcommerceMetrics';
import GanttChart from '../components/tasks/GanttChart';
import { ChevronLeft, Calendar, List } from 'lucide-react';

// Define the form data interface
interface GlobalActionFormData {
    title: string;
    content: string;
    category: string;
    projectId: string;
    projectCategory: string;
    responsibleForRealization: string;
    responsibleForFollowUp: string;
    startDate: string;
    endDate: string;
}

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
        endDate: ''
    });

    // Fetch both global and project actions when component mounts
    useEffect(() => {
        console.log('Fetching all actions...');
        dispatch(fetchGlobalActions({}));
        dispatch(fetchAllActions());
    }, [dispatch]);

    useEffect(() => {
        console.log('Current global actions:', globalActions);
        console.log('Current project actions:', projectActions);
    }, [globalActions, projectActions]);

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
                source: 'Global' // Add explicit source type
            })),
            ...projectActions.map(action => ({
                ...action,
                isProjectAction: true,
                source: 'Project',
                projectId: action.projectId // Use actual project reference
            }))
        ];
    }, [globalActions, projectActions]);

    // Calculate metrics
    const totalActions = combinedActions.length;
    const completedActions = combinedActions.filter(action => action.status === 'completed').length;
    const inProgressActions = combinedActions.filter(action => action.status === 'in_progress').length;
    const pendingActions = combinedActions.filter(action => action.status === 'pending').length;

    // Debounced search function
    const debouncedSearch = debounce((term) => {
        dispatch(fetchGlobalActions({ searchTerm: term }));
    }, 500);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    const handleCreateAction = () => {
        // Log all form data for debugging
        console.log('All form data:', formData);

        // Check each required field individually and log which ones are missing
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

        // Format dates for backend
        const formattedData: {
            title: string;
            content: string;
            category: string;
            responsibleForRealization: string;
            responsibleForFollowUp: string;
            startDate: string;
            endDate: string;
            status: string;
            projectId?: string;
        } = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            category: formData.category,
            responsibleForRealization: formData.responsibleForRealization,
            responsibleForFollowUp: formData.responsibleForFollowUp,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            status: 'pending'
        };

        // Only add projectId if it has a value
        if (formData.projectId) {
            formattedData.projectId = formData.projectId;
        }

        console.log('Form data before submission:', formData);
        console.log('Formatted data for submission:', formattedData);

        dispatch(createGlobalAction(formattedData));
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
            endDate: ''
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Actions Globales</h1>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
                    >
                        <PlusIcon size={16} />
                        Créer une action
                    </Button>
                </div>

                {/* Metrics Section */}
                <div className="mb-6">
                    <EcommerceMetrics data={{
                        totalActions,
                        completedActions,
                        pendingActions,
                        inProgressActions
                    }} />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* View Toggle and Filters */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={view === 'table' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('table')}
                                    className="flex items-center gap-1"
                                >
                                    <List size={16} />
                                    Tableau
                                </Button>
                                <Button
                                    variant={view === 'gantt' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('gantt')}
                                    className="flex items-center gap-1"
                                >
                                    <Calendar size={16} />
                                    Timeline
                                </Button>
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
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setView('table')}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft size={16} />
                                    Retour au tableau
                                </Button>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Échelle de temps:</span>
                                    <div className="flex items-center rounded-md border border-gray-200 bg-white">
                                        <button
                                            className={`px-3 py-1 text-sm ${timeScale === 'week' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                                            onClick={() => handleTimeScaleChange('week')}
                                        >
                                            Semaine
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-sm ${timeScale === 'month' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                                            onClick={() => handleTimeScaleChange('month')}
                                        >
                                            Mois
                                        </button>
                                        <button
                                            className={`px-3 py-1 text-sm ${timeScale === 'year' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
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

                {/* Create Action Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    className="max-w-2xl mx-auto"
                >
                    <div className="p-4">
                        <h2 className="text-lg font-bold mb-3">Créer une action globale</h2>
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <GlobalActionForm
                                formData={formData}
                                setFormData={setFormData}
                                projects={projects}
                                users={users}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleCreateAction}>
                                Créer
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* View Action Modal */}
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    className="max-w-2xl mx-auto"
                >
                    <div className="p-4">
                        <h2 className="text-lg font-bold mb-3">Détails de l'action</h2>
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            {selectedAction && <GlobalActionView action={selectedAction} />}
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setIsViewModalOpen(false)}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default GlobalActions; 