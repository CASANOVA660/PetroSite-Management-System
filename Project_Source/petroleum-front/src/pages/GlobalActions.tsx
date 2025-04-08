import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchGlobalActions, createGlobalAction } from '../store/slices/globalActionSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { fetchUsers } from '../store/slices/userSlice';
import { debounce } from 'lodash';
import { GlobalAction } from '../store/slices/globalActionSlice';
import PlusIcon from '../components/icons/PlusIcon';

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

const GlobalActions: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [view, setView] = useState<'table' | 'timeline'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'opened' | 'closed'>('all');
    const [filterType, setFilterType] = useState<'all' | 'global' | 'project'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<GlobalAction | null>(null);
    const { actions, loading, error } = useSelector((state: RootState) => state.globalActions);
    const { projects } = useSelector((state: RootState) => state.projects);
    const { users } = useSelector((state: RootState) => state.users);
    const { user } = useSelector((state: RootState) => state.auth);
    const isManager = user?.role === 'manager';
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

    // Fetch global actions when component mounts
    useEffect(() => {
        console.log('Fetching global actions...');
        dispatch(fetchGlobalActions({}));
    }, [dispatch]);

    useEffect(() => {
        console.log('Current actions state:', actions);
        console.log('Is actions an array?', Array.isArray(actions));
        console.log('Actions length:', actions?.length);
    }, [actions]);

    useEffect(() => {
        dispatch(fetchProjects());
        dispatch(fetchUsers());
    }, [dispatch]);

    // Ensure actions is an array before filtering
    const filteredActions = Array.isArray(actions) ? actions.filter(action => {
        if (filterStatus !== 'all') {
            if (filterStatus === 'opened' && action.status === 'completed') return false;
            if (filterStatus === 'closed' && action.status !== 'completed') return false;
        }
        if (filterType !== 'all') {
            if (filterType === 'global' && action.projectId) return false;
            if (filterType === 'project' && !action.projectId) return false;
        }
        return true;
    }) : [];

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

    const handleViewAction = (action: GlobalAction) => {
        setSelectedAction(action);
        setIsViewModalOpen(true);
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
                        className="flex items-center gap-2"
                    >
                        <PlusIcon size={16} />
                        Créer une action
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

                <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                {view === 'table' ? (
                    <GlobalActionsTable
                        actions={filteredActions}
                        onViewAction={handleViewAction}
                    />
                ) : (
                    <GlobalActionsTimeline actions={filteredActions.filter(action => action.status !== 'completed')} />
                )}

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