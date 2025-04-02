import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ActionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (actionData: any) => Promise<void>;
    projectId: string;
    category: string;
    users: Array<{ _id: string; nom: string; prenom: string }>;
}

interface ActionFormData {
    content: string;
    responsible: string;
    startDate: string;
    endDate: string;
    projectId: string;
    category: string;
}

const ActionFormModal: React.FC<ActionFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    projectId,
    category,
    users
}) => {
    const [formData, setFormData] = useState<ActionFormData>({
        content: '',
        responsible: '',
        startDate: '',
        endDate: '',
        projectId,
        category
    });

    const [errors, setErrors] = useState<Partial<ActionFormData>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<ActionFormData> = {};

        if (!formData.content.trim()) {
            newErrors.content = 'Le contenu est requis';
        }

        if (!formData.responsible) {
            newErrors.responsible = 'Le responsable est requis';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'La date de début est requise';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'La date de fin est requise';
        } else if (new Date(formData.endDate) < new Date(formData.startDate)) {
            newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Erreur lors de la création de l\'action');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name as keyof ActionFormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-10 overflow-y-auto"
        >
            <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-medium">
                            Créer une nouvelle action
                        </Dialog.Title>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Contenu de la tâche
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${errors.content
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-[#F28C38] focus:ring-[#F28C38]'
                                    }`}
                                rows={3}
                            />
                            {errors.content && (
                                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Responsable
                            </label>
                            <select
                                name="responsible"
                                value={formData.responsible}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${errors.responsible
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-[#F28C38] focus:ring-[#F28C38]'
                                    }`}
                            >
                                <option value="">Sélectionner un responsable</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.nom} {user.prenom}
                                    </option>
                                ))}
                            </select>
                            {errors.responsible && (
                                <p className="mt-1 text-sm text-red-600">{errors.responsible}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Date de début
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${errors.startDate
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-[#F28C38] focus:ring-[#F28C38]'
                                    }`}
                            />
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${errors.endDate
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-[#F28C38] focus:ring-[#F28C38]'
                                    }`}
                            />
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] border border-transparent rounded-md hover:bg-[#F28C38]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                            >
                                Créer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Dialog>
    );
};

export default ActionFormModal;