import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAction, CreateActionPayload } from '../../store/slices/actionSlice';
import { RootState, AppDispatch } from '../../store';
import { toast } from 'react-hot-toast';
import Modal from '../common/Modal';
import { format } from 'date-fns';

interface ActionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string;
    isGlobal?: boolean;
    onSubmit: (actionData: any) => Promise<void>;
    users: Array<{ _id: string; nom: string; prenom: string }>;
    projects: Array<{ _id: string; name: string }>;
    categories: string[];
}

const ActionFormModal: React.FC<ActionFormModalProps> = ({ isOpen, onClose, projectId, isGlobal = false, onSubmit, users, projects, categories }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    // Find project name for source
    const projectName = projects.find(p => p._id === projectId)?.name || 'Project';

    const [formData, setFormData] = useState<CreateActionPayload>({
        title: '',
        content: '',
        source: isGlobal ? '' : projectName,
        responsible: '',
        manager: user?._id || '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        category: isGlobal ? '' : categories[0],
        projectId: projectId || ''
    });

    // Update source when project changes
    useEffect(() => {
        if (!isGlobal) {
            setFormData(prev => ({
                ...prev,
                source: projectName,
                category: categories[0]
            }));
        }
    }, [projectId, projectName, categories, isGlobal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            toast.error('Erreur lors de la création de l\'action');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Action">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Titre</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Contenu</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Responsable réalisation</label>
                    <select
                        name="responsible"
                        value={formData.responsible}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                        <option value="">Sélectionner un responsable</option>
                        {users.map(user => (
                            <option key={user._id} value={user._id}>
                                {`${user.prenom} ${user.nom}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        />
                    </div>
                </div>

                {isGlobal && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Source</label>
                            <input
                                type="text"
                                name="source"
                                value={formData.source}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Projet (optionnel)</label>
                            <select
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                            >
                                <option value="">Sélectionner un projet</option>
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                placeholder="Entrez une catégorie"
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] border border-transparent rounded-md hover:bg-[#F28C38]/90"
                    >
                        Créer
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ActionFormModal;