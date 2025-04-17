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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find project name for display only
    const projectName = projects.find(p => p._id === projectId)?.name || '';

    const [formData, setFormData] = useState<CreateActionPayload & { needsValidation?: boolean }>({
        title: '',
        content: '',
        source: isGlobal ? '' : 'Project', // Always use 'Project' string for project-specific actions
        responsible: '',
        manager: user?._id || '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        category: isGlobal ? '' : categories[0],
        projectId: projectId || '',
        needsValidation: true // Default to true for validation
    });

    // Update source when project changes
    useEffect(() => {
        if (!isGlobal) {
            setFormData(prev => ({
                ...prev,
                source: 'Project', // Always use 'Project' string
                category: categories[0]
            }));
        }
    }, [projectId, categories, isGlobal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // Show immediate feedback
            toast.loading('Création en cours...', { id: 'action-create' });

            // Close the modal immediately to improve UX responsiveness
            onClose();

            // Submit the form data
            await onSubmit(formData);

            // Show success message
            toast.success('Action créée avec succès', { id: 'action-create' });
        } catch (error) {
            console.error('Error creating action:', error);
            toast.error('Erreur lors de la création de l\'action', { id: 'action-create' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                        disabled={isSubmitting}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
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
                        disabled={isSubmitting}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Responsable réalisation</label>
                    <select
                        name="responsible"
                        value={formData.responsible}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
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
                            disabled={isSubmitting}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
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
                            disabled={isSubmitting}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="needsValidation"
                        name="needsValidation"
                        checked={formData.needsValidation}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="h-4 w-4 text-[#F28C38] border-gray-300 rounded focus:ring-[#F28C38] disabled:bg-gray-100"
                    />
                    <label htmlFor="needsValidation" className="ml-2 block text-sm font-medium text-gray-700">
                        Nécessite une validation par le manager
                    </label>
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
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Projet (optionnel)</label>
                            <select
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
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
                                disabled={isSubmitting}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Entrez une catégorie"
                            />
                        </div>
                    </>
                )}

                {!isGlobal && (
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">
                            <strong>Projet:</strong> {projectName}<br />
                            <strong>Catégorie:</strong> {formData.category}<br />
                            <strong>Source:</strong> {formData.source}
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] border border-transparent rounded-md hover:bg-[#F28C38]/90 disabled:opacity-50 flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Création...
                            </>
                        ) : (
                            'Créer'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ActionFormModal;