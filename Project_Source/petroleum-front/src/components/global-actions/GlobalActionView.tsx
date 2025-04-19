import React, { useEffect, useState } from 'react';
import { GlobalAction } from '../../store/slices/globalActionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchTasksByGlobalActionId, fetchTasksByActionId } from '../../store/slices/taskSlice';

interface GlobalActionViewProps {
    action: GlobalAction | any; // Accept any action type
}

const GlobalActionView: React.FC<GlobalActionViewProps> = ({ action }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { actionTasks, loading } = useSelector((state: RootState) => state.tasks);

    useEffect(() => {
        if (action && action._id) {
            // Check if it's a project action or global action
            if (action.isProjectAction) {
                dispatch(fetchTasksByActionId(action._id));
            } else {
                dispatch(fetchTasksByGlobalActionId(action._id));
            }
        }
    }, [action, dispatch]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'À faire';
            case 'in_progress':
                return 'En cours';
            case 'completed':
                return 'Terminé';
            case 'cancelled':
                return 'Annulé';
            default:
                return status;
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'todo':
                return 'bg-yellow-100 text-yellow-800';
            case 'inProgress':
                return 'bg-blue-100 text-blue-800';
            case 'inReview':
                return 'bg-purple-100 text-purple-800';
            case 'done':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTaskStatusLabel = (status: string) => {
        switch (status) {
            case 'todo':
                return 'À faire';
            case 'inProgress':
                return 'En cours';
            case 'inReview':
                return 'En revue';
            case 'done':
                return 'Terminé';
            default:
                return status;
        }
    };

    // Helper function to get user name from either responsible or responsibleForRealization
    const getResponsibleName = () => {
        if (action.source === 'Project' && action.responsible) {
            return `${action.responsible.nom || ''} ${action.responsible.prenom || ''}`.trim();
        } else if (action.responsibleForRealization) {
            return `${action.responsibleForRealization.nom || ''} ${action.responsibleForRealization.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    // Helper function to get follow-up name from either manager or responsibleForFollowUp
    const getFollowUpName = () => {
        if (action.source === 'Project' && action.manager) {
            return `${action.manager.nom || ''} ${action.manager.prenom || ''}`.trim();
        } else if (action.responsibleForFollowUp) {
            return `${action.responsibleForFollowUp.nom || ''} ${action.responsibleForFollowUp.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    // Get the source text to display
    const getSourceText = () => {
        if (action.isProjectAction) {
            return 'Action de projet';
        } else {
            return 'Action globale';
        }
    };

    // Get source badge color
    const getSourceColor = () => {
        if (action.isProjectAction) {
            return 'bg-indigo-100 text-indigo-800';
        } else {
            return 'bg-emerald-100 text-emerald-800';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor()}`}>
                    {getSourceText()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                    {getStatusLabel(action.status)}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Titre</h3>
                    <p className="text-sm">{action.title}</p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700">Catégorie</h3>
                    <p className="text-sm">{action.category}</p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-700">Contenu</h3>
                <p className="text-sm">{action.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(action.projectId && typeof action.projectId === 'object') && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Projet</h3>
                        <p className="text-sm">{action.projectId.name}</p>
                    </div>
                )}

                {action.projectCategory && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Catégorie du projet</h3>
                        <p className="text-sm">{action.projectCategory}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Responsable de réalisation</h3>
                    <p className="text-sm">{getResponsibleName()}</p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700">Responsable de suivi</h3>
                    <p className="text-sm">{getFollowUpName()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Dates</h3>
                    <p className="text-sm">
                        Du {format(new Date(action.startDate), 'dd/MM/yyyy', { locale: fr })} au{' '}
                        {format(new Date(action.endDate), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                </div>
            </div>

            {/* Related Tasks Section */}
            <div className="border-t border-gray-200 pt-3 mt-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tâches associées ({loading ? '...' : actionTasks.length})</h3>

                {loading ? (
                    <p className="text-sm text-gray-500">Chargement des tâches...</p>
                ) : actionTasks.length > 0 ? (
                    <div className="space-y-2">
                        {actionTasks.map((task) => (
                            <div key={task._id} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium">{task.title}</p>
                                        <p className="text-xs text-gray-500">
                                            Assigné à: {task.assignee.nom} {task.assignee.prenom}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                        {getTaskStatusLabel(task.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Aucune tâche associée à cette action.</p>
                )}
            </div>
        </div>
    );
};

export default GlobalActionView; 