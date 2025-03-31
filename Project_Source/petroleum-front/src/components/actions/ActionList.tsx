import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Action } from '../../types/action';

interface ActionListProps {
    actions: Action[];
    onEdit: (action: Action) => void;
    onDelete: (actionId: string) => void;
    onStatusChange: (actionId: string, status: Action['status']) => void;
}

const ActionList: React.FC<ActionListProps> = ({
    actions = [], // Provide default empty array
    onEdit,
    onDelete,
    onStatusChange
}) => {
    const getStatusColor = (status: Action['status']) => {
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

    const getStatusText = (status: Action['status']) => {
        switch (status) {
            case 'pending':
                return 'En attente';
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

    if (!actions || actions.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Aucune action trouvée
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {actions.map((action) => (
                <div
                    key={action._id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-gray-900">{action.content}</p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <span className="mr-4">
                                    Responsable: {action.responsible.prenom} {action.responsible.nom}
                                </span>

                                <span>
                                    {format(new Date(action.startDate), 'dd MMM yyyy', { locale: fr })} -
                                    {format(new Date(action.endDate), ' dd MMM yyyy', { locale: fr })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                                {getStatusText(action.status)}
                            </span>
                            <select
                                value={action.status}
                                onChange={(e) => onStatusChange(action._id, e.target.value as Action['status'])}
                                className="text-sm border-gray-300 rounded-md focus:ring-[#F28C38] focus:border-[#F28C38]"
                            >
                                <option value="pending">En attente</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                            <button
                                onClick={() => onEdit(action)}
                                className="text-gray-400 hover:text-[#F28C38]"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => onDelete(action._id)}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActionList;