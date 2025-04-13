import React from 'react';
import { GlobalAction } from '../../store/slices/globalActionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GlobalActionViewProps {
    action: GlobalAction | any; // Accept any action type
}

const GlobalActionView: React.FC<GlobalActionViewProps> = ({ action }) => {
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

    return (
        <div className="space-y-3">
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

                <div>
                    <h3 className="text-sm font-medium text-gray-700">Statut</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                        {getStatusLabel(action.status)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalActionView; 