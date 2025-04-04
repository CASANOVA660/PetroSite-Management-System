import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAllActions } from '../store/slices/actionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Timeline from '../components/actions/Timeline';
import ActionFormModal from '../components/actions/ActionFormModal';

const GlobalActions: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [view, setView] = useState<'table' | 'timeline'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'opened' | 'closed'>('all');
    const [filterType, setFilterType] = useState<'all' | 'global' | 'project'>('all');

    const { actions, loading, error } = useSelector((state: RootState) => state.actions);

    useEffect(() => {
        dispatch(fetchAllActions());
    }, [dispatch]);

    const filteredActions = actions.filter(action => {
        if (filterStatus !== 'all') {
            if (filterStatus === 'opened' && action.status === 'completed') return false;
            if (filterStatus === 'closed' && action.status !== 'completed') return false;
        }
        if (filterType !== 'all') {
            if (filterType === 'global' && action.projectId) return false;
            if (filterType === 'project' && !action.projectId) return false;
        }
        return true;
    });

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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Actions Globales</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                >
                    Nouvelle Action
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('table')}
                        className={`px-4 py-2 rounded-md ${view === 'table' ? 'bg-primary text-white' : 'bg-gray-100'
                            }`}
                    >
                        Vue Tableau
                    </button>
                    <button
                        onClick={() => setView('timeline')}
                        className={`px-4 py-2 rounded-md ${view === 'timeline' ? 'bg-primary text-white' : 'bg-gray-100'
                            }`}
                    >
                        Vue Timeline
                    </button>
                </div>

                <div className="flex gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="opened">En cours</option>
                        <option value="closed">Terminées</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Tous les types</option>
                        <option value="global">Actions globales</option>
                        <option value="project">Actions projet</option>
                    </select>
                </div>
            </div>

            {view === 'table' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Titre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Source
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catégorie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Projet
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Responsable
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Suivi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredActions.map((action) => (
                                <tr key={action._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {action.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {action.source || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {action.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {action.projectId ? 'Projet spécifique' : 'Global'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {`${action.responsible.prenom} ${action.responsible.nom}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {action.manager ? `${action.manager.prenom} ${action.manager.nom}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {`${format(new Date(action.startDate), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(action.endDate), 'dd/MM/yyyy', { locale: fr })}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${action.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {action.status === 'completed' ? 'Terminée' : 'En cours'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Timeline actions={filteredActions.filter(action => action.status !== 'completed')} />
            )}

            <ActionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isGlobal={true}
            />
        </div>
    );
};

export default GlobalActions; 