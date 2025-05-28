import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '../../store';
import { updateProjectStatus } from '../../store/slices/projectSlice';
import { toast } from 'react-toastify';

interface ProjectStatusProps {
    projectId: string;
}

const ProjectStatus: React.FC<ProjectStatusProps> = ({ projectId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedProject, loading } = useSelector((state: RootState) => state.projects);
    const { user } = useSelector((state: RootState) => state.auth);

    const [status, setStatus] = useState<string>('');
    const [statusNote, setStatusNote] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Check if user is a manager
    const isManager = user?.role === 'Manager';

    useEffect(() => {
        if (selectedProject) {
            setStatus(selectedProject.status);
            setStatusNote(selectedProject.statusNote || '');
        }
    }, [selectedProject]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value);
    };

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setStatusNote(e.target.value);
    };

    const handleSubmit = async () => {
        if (!status) {
            toast.error('Veuillez sélectionner un statut');
            return;
        }

        if (status !== 'En cours' && !statusNote) {
            toast.error('Une note est requise pour les statuts "Clôturé" ou "Annulé"');
            return;
        }

        try {
            await dispatch(updateProjectStatus({
                id: projectId,
                status: status as 'En cours' | 'Clôturé' | 'Annulé' | 'En opération'
            })).unwrap();

            toast.success('Statut du projet mis à jour avec succès');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error updating project status:', error);
            toast.error('Erreur lors de la mise à jour du statut');
        }
    };

    const getStatusColor = (statusValue: string) => {
        switch (statusValue) {
            case 'En cours':
                return 'bg-green-100 text-green-800';
            case 'Clôturé':
                return 'bg-blue-100 text-blue-800';
            case 'Annulé':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (statusValue: string) => {
        switch (statusValue) {
            case 'En cours':
                return <ClockIcon className="h-5 w-5 text-green-600" />;
            case 'Clôturé':
                return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
            case 'Annulé':
                return <XCircleIcon className="h-5 w-5 text-red-600" />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">État actuel</h3>
                        {isManager && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 py-2 bg-gradient-to-r from-[#F28C38] to-[#FF9F45] text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                            >
                                <span>Modifier</span>
                            </motion.button>
                        )}
                    </div>

                    <div className="flex flex-col space-y-8">
                        <div className="flex items-center justify-center">
                            <div className={`px-6 py-4 rounded-xl ${getStatusColor(selectedProject?.status || '')} flex items-center space-x-3 transform transition-all duration-300 hover:scale-105`}>
                                {getStatusIcon(selectedProject?.status || '')}
                                <span className="text-lg font-medium">
                                    {selectedProject?.status || 'Non défini'}
                                </span>
                            </div>
                        </div>

                        {selectedProject?.statusNote && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                            >
                                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Note:</h4>
                                <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    "{selectedProject.statusNote}"
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* History Card (placeholder for future implementation) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                    className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hidden md:block"
                >
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Historique des statuts</h3>
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <p className="text-center">L'historique des statuts sera disponible prochainement</p>
                    </div>
                </motion.div>
            </div>

            {/* Status Update Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 relative overflow-hidden"
                            >
                                {/* Modal header with decorative top bar */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F28C38] to-[#FF9F45]"></div>

                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                    Modifier le statut du projet
                                </h3>

                                {(status === 'Annulé' || status === 'Clôturé') && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-start"
                                    >
                                        <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm">
                                            Attention: Changer le statut du projet à "{status}" peut affecter la disponibilité
                                            des ressources et la planification. Cette action est irréversible.
                                        </p>
                                    </motion.div>
                                )}

                                <div className="mb-6">
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                                        Statut
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={status}
                                            onChange={handleStatusChange}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                                        >
                                            <option value="En cours">En cours</option>
                                            <option value="Clôturé">Clôturé</option>
                                            <option value="Annulé">Annulé</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                                        Note explicative {status !== 'En cours' && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        value={statusNote}
                                        onChange={handleNoteChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Raison du changement de statut..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Annuler
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-5 py-2.5 bg-gradient-to-r from-[#F28C38] to-[#FF9F45] text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Mise à jour...' : 'Enregistrer'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(ProjectStatus); 