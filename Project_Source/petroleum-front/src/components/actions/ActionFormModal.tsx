import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createAction, CreateActionPayload } from '../../store/slices/actionSlice';
import { RootState, AppDispatch } from '../../store';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

    const projectName = projects.find(p => p._id === projectId)?.name || '';

    const [formData, setFormData] = useState<CreateActionPayload & { needsValidation?: boolean }>({
        title: '',
        content: '',
        source: isGlobal ? '' : 'Project',
        responsible: '',
        manager: user?._id || '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        category: isGlobal ? '' : (categories.length > 0 ? categories[0] : ''),
        projectId: projectId || '',
        needsValidation: true
    });

    useEffect(() => {
        if (!isGlobal && categories.length > 0) {
            setFormData(prev => ({
                ...prev,
                source: 'Project',
                category: categories[0],
                projectId: projectId || ''
            }));
        }
    }, [projectId, categories, isGlobal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            toast.loading('Création en cours...', { id: 'action-create' });

            const actionData = {
                ...formData,
                projectId: projectId || formData.projectId
            };
            await onSubmit(actionData);

            toast.success('Action créée avec succès', { id: 'action-create' });
            onClose();
        } catch (error) {
            console.error('Error creating action:', error);
            toast.error('Erreur lors de la création de l\'action', { id: 'action-create' });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setFormData({
                title: '',
                content: '',
                source: isGlobal ? '' : 'Project',
                responsible: '',
                manager: user?._id || '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: '',
                category: isGlobal ? '' : (categories.length > 0 ? categories[0] : ''),
                projectId: projectId || '',
                needsValidation: true
            });
        }
    }, [isOpen, isGlobal, categories, projectId, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Background overlay */}
            <div
                className="fixed inset-0 transition-opacity"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'none',
                    zIndex: 99999
                }}
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal container */}
            <div className="fixed inset-0 z-[100000] flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Center alignment helper */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>

                {/* Modal panel */}
                <div
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full"
                    style={{ zIndex: 100001, opacity: 1 }}
                >
                    <div className="bg-white px-6 pt-6 pb-5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Nouvelle Action</h3>
                            <button
                                type="button"
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 focus:outline-none"
                                onClick={onClose}
                                aria-label="Fermer le modal"
                            >
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1.5">Titre</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm placeholder-gray-400 transition-colors"
                                    placeholder="Entrez le titre de l'action"
                                    aria-required="true"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1.5">Contenu</label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm placeholder-gray-400 resize-none transition-colors"
                                    placeholder="Décrivez l'action..."
                                    aria-required="true"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1.5">Responsable réalisation</label>
                                <select
                                    name="responsible"
                                    value={formData.responsible}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm text-gray-600 bg-white transition-colors"
                                    aria-required="true"
                                >
                                    <option value="" disabled>Sélectionner un responsable</option>
                                    {users.map(user => (
                                        <option key={user._id} value={user._id}>
                                            {`${user.prenom} ${user.nom}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Date de début</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                        className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm text-gray-600 transition-colors"
                                        aria-required="true"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1.5">Date de fin</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                        className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm text-gray-600 transition-colors"
                                        aria-required="true"
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
                                    className="h-4 w-4 text-[#F28C38] border-gray-300 rounded focus:ring-[#F28C38] transition-colors"
                                    aria-checked={formData.needsValidation}
                                />
                                <label htmlFor="needsValidation" className="ml-2 block text-sm text-gray-600">
                                    Nécessite une validation par le manager
                                </label>
                            </div>

                            {isGlobal && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1.5">Source</label>
                                        <input
                                            type="text"
                                            name="source"
                                            value={formData.source}
                                            onChange={handleChange}
                                            required
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm placeholder-gray-400 transition-colors"
                                            placeholder="Entrez la source"
                                            aria-required="true"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1.5">Projet (optionnel)</label>
                                        <select
                                            name="projectId"
                                            value={formData.projectId}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm text-gray-600 bg-white transition-colors"
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
                                        <label className="block text-sm font-medium text-gray-500 mb-1.5">Catégorie</label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:ring-[#F28C38] focus:border-[#F28C38] text-sm placeholder-gray-400 transition-colors"
                                            placeholder="Entrez une catégorie"
                                            aria-required="true"
                                        />
                                    </div>
                                </>
                            )}

                            {!isGlobal && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        <span className="block"><strong>Projet :</strong> {projectName}</span>
                                        <span className="block"><strong>Catégorie :</strong> {formData.category}</span>
                                        <span className="block"><strong>Source :</strong> {formData.source}</span>
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                                    aria-label="Annuler"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] border border-transparent rounded-lg hover:bg-[#F28C38]/90 transition-colors disabled:opacity-50"
                                    disabled={isSubmitting}
                                    aria-label={isSubmitting ? "Création en cours" : "Créer une action"}
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
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActionFormModal;