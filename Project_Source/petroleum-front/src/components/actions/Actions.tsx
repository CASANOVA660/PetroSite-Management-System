import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ActionFormModal from './ActionFormModal';
import ActionList from './ActionList';
import {
    fetchCategoryActions,
    createAction,
    updateActionStatus,
    deleteAction
} from '../../store/slices/actionSlice';
import { RootState, AppDispatch } from '../../store';

interface ActionsProps {
    projectId: string;
    category: string;
    users: Array<{ _id: string; nom: string; prenom: string }>;
}

const Actions: React.FC<ActionsProps> = ({ projectId, category, users }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { actions, loading, error } = useSelector((state: RootState) => state.actions);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchCategoryActions({ projectId, category }));
    }, [dispatch, projectId, category]);

    const handleCreateAction = async (actionData: any) => {
        try {
            if (!user?._id) {
                throw new Error('User not authenticated');
            }

            const actionWithUser = {
                ...actionData,
                projectId,
                category,

            };

            await dispatch(createAction(actionWithUser)).unwrap();
            toast.success('Action créée avec succès');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating action:', error);
            toast.error('Erreur lors de la création de l\'action');
        }
    };

    const handleStatusChange = async (actionId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
        try {
            await dispatch(updateActionStatus({ actionId, status })).unwrap();
            toast.success('Statut de l\'action mis à jour');
        } catch (error) {
            console.error('Error updating action status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const handleDeleteAction = async (actionId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
            try {
                await dispatch(deleteAction(actionId)).unwrap();
                toast.success('Action supprimée avec succès');
            } catch (error) {
                console.error('Error deleting action:', error);
                toast.error('Erreur lors de la suppression de l\'action');
            }
        }
    };

    if (error) {
        return (
            <div className="text-red-600 p-4 bg-red-50 rounded-md">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F28C38] hover:bg-[#F28C38]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nouvelle action
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C38] mx-auto"></div>
                </div>
            ) : actions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                    Aucune action pour le moment
                </div>
            ) : (
                <ActionList
                    actions={actions}
                    onEdit={() => { }}
                    onDelete={handleDeleteAction}
                    onStatusChange={handleStatusChange}
                />
            )}

            <ActionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateAction}
                projectId={projectId}
                category={category}
                users={users}
            />
        </div>
    );
};

export default Actions;