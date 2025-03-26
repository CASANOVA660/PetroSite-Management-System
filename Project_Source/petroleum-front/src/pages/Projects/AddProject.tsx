import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { AppDispatch, RootState } from '../../store';
import { createProject } from '../../store/slices/projectSlice';

const AddProject: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.projects);
    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'En cours' as const
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await dispatch(createProject(formData)).unwrap();
            navigate('/projects/preparation');
        } catch (err) {
            console.error('Error creating project:', err);
        }
    };

    return (
        <>
            <PageMeta
                title="Ajouter un Projet | PetroConnect"
                description="Ajoutez un nouveau projet pétrolier"
            />
            <PageBreadcrumb pageTitle="Ajouter un Projet" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Ajouter un Projet
                    </h1>
                </div>

                <ComponentCard title="Formulaire d'ajout de projet">
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
                                onClick={() => navigate('/projects/preparation')}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F28C38] hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] disabled:opacity-50"
                            >
                                {loading ? 'Création en cours...' : 'Créer le Projet'}
                            </button>
                        </div>
                    </form>
                </ComponentCard>
            </div>
        </>
    );
};

export default AddProject;