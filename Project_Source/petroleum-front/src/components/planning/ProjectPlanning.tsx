import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, CalendarIcon, CheckCircleIcon, ClockIcon, TableCellsIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { fetchPlans, createPlan, updatePlan, deletePlan, PlanType, PlanStatus } from '../../store/slices/planningSlice';
import PlanModal from './PlanModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useModalContext } from '../../context/ModalContext';
import CustomPlanModal from './CustomPlanModal';

interface ProjectPlanningProps {
    projectId?: string;
}

export default function ProjectPlanning({ projectId }: ProjectPlanningProps) {
    const dispatch = useAppDispatch();
    const { plans = [], loading } = useSelector((state: any) => state.planning);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [customModalOpen, setCustomModalOpen] = useState(false);
    const { setModalOpen: setHeaderModalOpen } = useModalContext();

    // Fetch plans related to this project when component mounts
    useEffect(() => {
        if (projectId) {
            dispatch(fetchPlans({ projectId }));
        }
    }, [dispatch, projectId]);

    // Update header blur effect when any modal opens or closes
    useEffect(() => {
        setHeaderModalOpen(modalOpen || customModalOpen);
        return () => setHeaderModalOpen(false);
    }, [modalOpen, customModalOpen, setHeaderModalOpen]);

    // Filter plans that belong to this project
    const filteredPlans = plans.filter((plan: any) => {
        // Always filter for this project's plans
        if (!projectId) return true;

        const planProjectId = plan.projectId?._id || plan.projectId;
        return planProjectId === projectId;
    }).filter((plan: any) => {
        // Apply the selected filter
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'placement') return plan.type === PlanType.PLACEMENT;
        if (selectedFilter === 'maintenance') return plan.type === PlanType.MAINTENANCE;
        if (selectedFilter === 'repair') return plan.type === PlanType.REPAIR;
        if (selectedFilter === 'custom') {
            return plan.type !== PlanType.PLACEMENT &&
                plan.type !== PlanType.MAINTENANCE &&
                plan.type !== PlanType.REPAIR;
        }
        return true;
    });

    // Handlers
    const handleNewPlan = () => {
        setEditingPlan(null);
        setModalOpen(true);
    };

    const handleNewCustomPlan = () => {
        setEditingPlan(null);
        setCustomModalOpen(true);
    };

    const handleEdit = (plan: any) => {
        setEditingPlan(plan);

        // Open the appropriate modal based on plan type
        if (plan.type === PlanType.PLACEMENT || plan.type === PlanType.MAINTENANCE || plan.type === PlanType.REPAIR) {
            // Standard types use the standard modal
            setModalOpen(true);
        } else {
            // Custom types use the custom modal
            setCustomModalOpen(true);
        }
    };

    const handleDelete = (planId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
            dispatch(deletePlan(planId));
        }
    };

    const handleSave = (plan: any) => {
        // Always associate the plan with this project
        const planWithProject = {
            ...plan,
            projectId: projectId // Ensure projectId is included
        };

        if (editingPlan) {
            dispatch(updatePlan({ id: editingPlan._id, data: planWithProject }));
        } else {
            dispatch(createPlan(planWithProject));
        }
        setModalOpen(false);
        setCustomModalOpen(false);
        setEditingPlan(null);
    };

    // Helper function to render a type badge based on plan type
    const renderTypeBadge = (type: string, customTypeName?: string) => {
        let color, icon, text;

        switch (type) {
            case PlanType.PLACEMENT:
                color = 'bg-blue-100 text-blue-800';
                icon = <CalendarIcon className="h-4 w-4 mr-1" />;
                text = 'Placement';
                break;
            case PlanType.MAINTENANCE:
                color = 'bg-yellow-100 text-yellow-800';
                icon = <ClockIcon className="h-4 w-4 mr-1" />;
                text = 'Maintenance';
                break;
            case PlanType.REPAIR:
                color = 'bg-red-100 text-red-800';
                icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
                text = 'Réparation';
                break;
            case PlanType.CUSTOM:
                color = 'bg-purple-100 text-purple-800';
                icon = '📝';
                text = customTypeName || 'Personnalisé';
                break;
            default:
                color = 'bg-purple-100 text-purple-800';
                icon = '📝';
                text = type || 'Personnalisé';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {icon}
                {text}
            </span>
        );
    };

    // Render list view of plans
    const renderListView = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
                {filteredPlans.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">Aucune planification trouvée</p>
                        <button
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={handleNewPlan}
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Ajouter une planification
                        </button>
                    </div>
                ) : (
                    filteredPlans.map((plan: any) => (
                        <div key={plan._id} className="p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {renderTypeBadge(plan.type, plan.customTypeName)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{plan.title}</h3>
                                        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                                            <div>
                                                <CalendarIcon className="h-4 w-4 mr-1 inline" />
                                                {plan.startDate && (
                                                    <>
                                                        {format(new Date(plan.startDate), 'dd MMM yyyy', { locale: fr })}
                                                        {plan.endDate && (
                                                            <> - {format(new Date(plan.endDate), 'dd MMM yyyy', { locale: fr })}</>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {plan.location && (
                                                <div>
                                                    <span className="inline-block mr-1">📍</span>
                                                    {plan.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="text-gray-400 hover:text-blue-600"
                                        onClick={() => handleEdit(plan)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="text-gray-400 hover:text-red-600"
                                        onClick={() => handleDelete(plan._id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // Render table view of plans
    const renderTableView = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {filteredPlans.length === 0 ? (
                <div className="p-6 text-center">
                    <p className="text-gray-500">Aucune planification trouvée</p>
                    <div className="mt-4 flex justify-center gap-3">
                        <button
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={handleNewPlan}
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Nouvelle planification standard
                        </button>
                        <button
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            onClick={handleNewCustomPlan}
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Planification personnalisée
                        </button>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Titre
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Période
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lieu
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Responsable
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPlans.map((plan: any) => (
                                <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {renderTypeBadge(plan.type, plan.customTypeName)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                                        <div className="text-sm text-gray-500">{plan.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.startDate && (
                                            <>
                                                {format(new Date(plan.startDate), 'dd MMM yyyy', { locale: fr })}
                                                {plan.endDate && (
                                                    <> - <br />{format(new Date(plan.endDate), 'dd MMM yyyy', { locale: fr })}</>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {plan.location || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {typeof plan.responsiblePerson === 'object' && plan.responsiblePerson !== null
                                            ? plan.responsiblePerson.name
                                            : plan.responsiblePerson || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button
                                                className="text-blue-600 hover:text-blue-900"
                                                onClick={() => handleEdit(plan)}
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDelete(plan._id)}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4 font-outfit">
            {/* Header with view toggle and new plan buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Planification du projet</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={handleNewPlan}
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Planification standard
                    </button>
                    <button
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        onClick={handleNewCustomPlan}
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Planification personnalisée
                    </button>
                </div>
            </div>

            {/* Filters and view toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <button
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === 'all' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFilter('all')}
                    >
                        Tous
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === 'placement' ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFilter('placement')}
                    >
                        Placement
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === 'maintenance' ? 'bg-yellow-100 text-yellow-800 font-medium' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFilter('maintenance')}
                    >
                        Maintenance
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === 'repair' ? 'bg-red-100 text-red-800 font-medium' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFilter('repair')}
                    >
                        Réparation
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === 'custom' ? 'bg-purple-100 text-purple-800 font-medium' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFilter('custom')}
                    >
                        Personnalisé
                    </button>
                </div>
                <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                        className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <ListBulletIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                        className={`p-2 ${viewMode === 'table' ? 'bg-gray-100' : 'bg-white'}`}
                        onClick={() => setViewMode('table')}
                    >
                        <TableCellsIcon className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="bg-white p-8 rounded-xl shadow-md flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Content based on view mode */}
                    {viewMode === 'list' ? renderListView() : renderTableView()}
                </>
            )}

            {/* Plan modal */}
            <PlanModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                plan={editingPlan}
                projectId={projectId}
            />

            {/* Custom Plan Modal */}
            <CustomPlanModal
                open={customModalOpen}
                onClose={() => setCustomModalOpen(false)}
                onSave={handleSave}
                plan={editingPlan}
                projectId={projectId}
            />
        </div>
    );
} 