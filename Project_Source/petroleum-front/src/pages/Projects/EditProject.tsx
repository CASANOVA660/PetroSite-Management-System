import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { AppDispatch, RootState } from '../../store';
import { fetchProjectById, updateProject } from '../../store/slices/projectSlice';
import { toast } from 'react-toastify';

const EditProject: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, selectedProject } = useSelector((state: RootState) => state.projects);
    const authState = useSelector((state: RootState) => state.auth);
    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'En cours' as const
    });
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    // Check authentication
    useEffect(() => {
        if (!authState.isAuthenticated || !authState.user) {
            console.error('EditProject: User not authenticated');
            toast.error('Vous devez être connecté pour modifier un projet');
            navigate('/login', { state: { from: `/projects/edit/${id}` } });
        }
    }, [authState, id, navigate]);

    useEffect(() => {
        if (id) {
            console.log('EditProject: Fetching project with ID:', id);
            dispatch(fetchProjectById(id))
                .unwrap()
                .then((project) => {
                    console.log('EditProject: Successfully fetched project:', project);
                    setFormData({
                        name: project.name,
                        clientName: project.clientName,
                        description: project.description,
                        startDate: project.startDate.split('T')[0],
                        endDate: project.endDate.split('T')[0],
                        status: project.status
                    });
                })
                .catch((err) => {
                    console.error('EditProject: Error fetching project with detailed info:', err);
                    console.error('EditProject: Error type:', typeof err);
                    if (typeof err === 'object') {
                        console.error('EditProject: Error keys:', Object.keys(err));
                        // If the error message contains an authentication error
                        if (err.toString().includes('autorisé') || err.toString().includes('auth')) {
                            toast.error('Vous n\'êtes pas autorisé à modifier ce projet');
                            navigate('/projects/preparation');
                        } else {
                            toast.error('Erreur lors du chargement du projet');
                        }
                    }
                });
        } else {
            console.error('EditProject: No project ID in URL parameters');
        }
    }, [dispatch, id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!authState.isAuthenticated || !authState.user) {
            toast.error('Vous devez être connecté pour modifier un projet');
            navigate('/login');
            return;
        }

        setLoadingUpdate(true);
        try {
            await dispatch(updateProject({ id, data: formData })).unwrap();
            toast.success('Projet mis à jour avec succès!');
            navigate(`/projects/${id}`);
        } catch (err: any) {
            console.error('Error updating project:', err);
            // Check if it's an authorization error
            if (err.toString().includes('autorisé') || err.toString().includes('Non autorisé')) {
                toast.error('Vous n\'êtes pas autorisé à modifier ce projet');
            } else if (err.toString().includes('TypeError')) {
                toast.error('Erreur d\'authentification. Veuillez vous reconnecter.');
                // Force user to re-login
                navigate('/login', { state: { from: `/projects/edit/${id}` } });
            } else {
                toast.error('Erreur lors de la mise à jour du projet');
            }
        } finally {
            setLoadingUpdate(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error || !selectedProject) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Projet non trouvé
                </h2>
                <button
                    onClick={() => navigate('/projects/preparation')}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    // Check if this user is authorized to edit this project
    const canEdit = authState.user && selectedProject.createdBy &&
        authState.user._id === selectedProject.createdBy._id;

    if (!canEdit) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Vous n'êtes pas autorisé à modifier ce projet
                </h2>
                <button
                    onClick={() => navigate('/projects/preparation')}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title={`Modifier le Projet | ${selectedProject.name}`}
                description="Modifier les détails du projet pétrolier"
            />
            <PageBreadcrumb pageTitle="Modifier le Projet" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Modifier le Projet
                    </h1>
                </div>

                <ComponentCard title="Formulaire de modification">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nom du Projet
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nom du Client
                                </label>
                                <input
                                    type="text"
                                    name="clientName"
                                    id="clientName"
                                    required
                                    value={formData.clientName}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Statut
                                </label>
                                <select
                                    name="status"
                                    id="status"
                                    required
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="En cours">En cours</option>
                                    <option value="Fermé">Fermé</option>
                                    <option value="Annulé">Annulé</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Date de Début
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    id="startDate"
                                    required
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Date de Fin
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    id="endDate"
                                    required
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                rows={4}
                                required
                                value={formData.description}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(`/projects/${id}`)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loadingUpdate}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F28C38] hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] disabled:opacity-50"
                            >
                                {loadingUpdate ? 'Mise à jour en cours...' : 'Mettre à jour'}
                            </button>
                        </div>
                    </form>
                </ComponentCard>
            </div>
        </>
    );
};

export default EditProject; 