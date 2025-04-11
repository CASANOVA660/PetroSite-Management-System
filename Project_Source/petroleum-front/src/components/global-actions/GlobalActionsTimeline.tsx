import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GlobalAction } from '../../types/globalAction';
import { Action } from '../../types/action';
import { CombinedAction } from './GlobalActionsTable';

interface GlobalActionsTimelineProps {
    actions: any[];
}

const GlobalActionsTimeline: React.FC<GlobalActionsTimelineProps> = ({ actions }) => {
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

    return (
        <div className="space-y-4">
            {actions.map((action) => (
                <div key={action._id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold">{action.title}</h3>
                            <p className="text-gray-600">{action.content}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                            {getStatusLabel(action.status)}
                        </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                        <p>Du {format(new Date(action.startDate), 'dd/MM/yyyy', { locale: fr })} au{' '}
                            {format(new Date(action.endDate), 'dd/MM/yyyy', { locale: fr })}</p>
                        <p>Responsable: {action.responsibleForRealization.nom} {action.responsibleForRealization.prenom}</p>
                        {action.projectId && <p>Projet: {action.projectId.name}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GlobalActionsTimeline; 