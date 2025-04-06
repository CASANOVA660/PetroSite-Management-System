import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { GlobalAction } from '../../store/slices/globalActionSlice';
import { updateGlobalActionStatus, deleteGlobalAction } from '../../store/slices/globalActionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow
} from '../ui/table';
import { Eye, Trash, Edit } from 'lucide-react';

interface GlobalActionsTableProps {
    actions: GlobalAction[];
    onViewAction: (action: GlobalAction) => void;
}

const GlobalActionsTable: React.FC<GlobalActionsTableProps> = ({ actions, onViewAction }) => {
    const dispatch = useDispatch<AppDispatch>();

    const handleUpdateStatus = (actionId: string, status: string) => {
        dispatch(updateGlobalActionStatus({ actionId, status }));
    };

    const handleDeleteAction = (actionId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
            dispatch(deleteGlobalAction(actionId));
        }
    };

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
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell>Titre</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Catégorie</TableCell>
                        <TableCell>Projet</TableCell>
                        <TableCell>Responsable</TableCell>
                        <TableCell>Suivi</TableCell>
                        <TableCell>Dates</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {actions.map((action) => (
                        <TableRow key={action._id}>
                            <TableCell>{action.title}</TableCell>
                            <TableCell>{action.source}</TableCell>
                            <TableCell>{action.category}</TableCell>
                            <TableCell>{action.projectId?.name || '-'}</TableCell>
                            <TableCell>
                                {action.responsibleForRealization?.nom} {action.responsibleForRealization?.prenom}
                            </TableCell>
                            <TableCell>
                                {action.responsibleForFollowUp?.nom} {action.responsibleForFollowUp?.prenom}
                            </TableCell>
                            <TableCell>
                                {format(new Date(action.startDate), 'dd/MM/yyyy', { locale: fr })} -
                                {format(new Date(action.endDate), 'dd/MM/yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                                    {getStatusLabel(action.status)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => onViewAction(action)}
                                        className="p-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {(action.status === 'pending' || action.status === 'in_progress') && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(action._id, action.status === 'pending' ? 'in_progress' : 'completed')}
                                                className="p-1 text-yellow-600 hover:text-yellow-800"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAction(action._id)}
                                                className="p-1 text-red-600 hover:text-red-800"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default GlobalActionsTable; 