import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
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
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const { actions, loading, error } = useSelector((state: RootState) => state.actions);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchCategoryActions({ projectId, category }));
    }, [dispatch, projectId, category]);

    // Calculate statistics for this category only
    const categoryActions = actions.filter(action => action.category === category);
    const stats = {
        total: categoryActions.length,
        pending: categoryActions.filter(action => action.status === 'pending').length,
        inProgress: categoryActions.filter(action => action.status === 'in_progress').length,
        completed: categoryActions.filter(action => action.status === 'completed').length,
    };

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
            setIsFormModalOpen(false);
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
        return <div className="text-red-600 p-4 bg-red-50 rounded-md">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Actions</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsListModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ClipboardIcon className="h-5 w-5 mr-2" />
                        Voir les actions
                    </button>
                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F28C38] hover:bg-[#F28C38]/90"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nouvelle action
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total</h3>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">En attente</h3>
                    <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">En cours</h3>
                    <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Terminées</h3>
                    <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
                </div>
            </div>

            {/* Actions List Modal */}
            <Dialog
                open={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                className="fixed inset-0 z-10 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen">
                    <div className="fixed inset-0 bg-black opacity-30" />
                    <div className="relative bg-white rounded-lg max-w-4xl w-full mx-4 p-6">
                        <Dialog.Title className="text-lg font-medium mb-4">
                            Liste des actions - {category}
                        </Dialog.Title>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C38] mx-auto"></div>
                            </div>
                        ) : (
                            <ActionList
                                actions={categoryActions}
                                onEdit={() => { }}
                                onDelete={handleDeleteAction}
                                onStatusChange={handleStatusChange}
                            />
                        )}
                        <button
                            onClick={() => setIsListModalOpen(false)}
                            className="mt-4 w-full inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </Dialog>

            <ActionFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleCreateAction}
                projectId={projectId}
                category={category}
                users={users}
            />
        </div>
    );
};

export default Actions;