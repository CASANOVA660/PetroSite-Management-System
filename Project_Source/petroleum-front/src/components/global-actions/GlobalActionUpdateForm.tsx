import React, { useState, useEffect } from 'react';
import FormDefaultInput from '../form/form-elements/FormDefaultInput';
import FormSelectInput from '../form/form-elements/FormSelectInput';
import FormTextAreaInput from '../form/form-elements/FormTextAreaInput';
import { GlobalAction } from '../../store/slices/globalActionSlice';

interface GlobalActionUpdateFormProps {
    action: GlobalAction | any; // Accept any action type
    formData: {
        title: string;
        content: string;
        category: string;
        projectId: string;
        projectCategory: string;
        responsibleForRealization: string;
        responsibleForFollowUp: string;
        startDate: string;
        endDate: string;
        status: string;
        needsValidation: boolean;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        title: string;
        content: string;
        category: string;
        projectId: string;
        projectCategory: string;
        responsibleForRealization: string;
        responsibleForFollowUp: string;
        startDate: string;
        endDate: string;
        status: string;
        needsValidation: boolean;
    }>>;
    projects: any[];
    users: any[];
}

// Predefined document categories based on the document model
const DOCUMENT_CATEGORIES = [
    'Documents globale',
    'Dossier Administratif',
    'Dossier Technique',
    'Dossier RH',
    'Dossier HSE'
];

const GlobalActionUpdateForm: React.FC<GlobalActionUpdateFormProps> = ({ action, formData, setFormData, projects, users }) => {
    // Check if this is a project-specific action
    const isProjectAction = action.source === 'Project';

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormDefaultInput
                    label="Titre"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                    required
                />

                <FormSelectInput
                    label="Catégorie"
                    value={formData.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                        { value: 'HSE', label: 'HSE' },
                        { value: 'Qualité', label: 'Qualité' },
                        { value: 'Maintenance', label: 'Maintenance' },
                        { value: 'Opération', label: 'Opération' }
                    ]}
                    required
                    placeholder="Sélectionner une catégorie"
                />
            </div>

            <FormTextAreaInput
                label="Contenu"
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={3}
            />

            {!isProjectAction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormSelectInput
                        label="Projet (optionnel)"
                        value={formData.projectId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newProjectId = e.target.value;
                            setFormData(prevFormData => ({
                                ...prevFormData,
                                projectId: newProjectId,
                                // Reset project category when project changes
                                projectCategory: '',
                            }));
                        }}
                        options={[
                            { value: '', label: 'Aucun' },
                            ...projects.map((project) => ({
                                value: project._id,
                                label: project.name
                            }))
                        ]}
                    />

                    {formData.projectId && (
                        <FormSelectInput
                            label="Catégorie du projet"
                            value={formData.projectCategory}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, projectCategory: e.target.value })}
                            options={DOCUMENT_CATEGORIES.map(category => ({
                                value: category,
                                label: category
                            }))}
                            placeholder="Sélectionner une catégorie de projet"
                        />
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormSelectInput
                    label={isProjectAction ? "Responsable" : "Responsable de réalisation"}
                    value={formData.responsibleForRealization}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, responsibleForRealization: e.target.value })}
                    options={users.map((user) => ({
                        value: user._id,
                        label: user.nom
                    }))}
                    required
                    placeholder="Sélectionner un responsable"
                />

                {isProjectAction ? (
                    <FormDefaultInput
                        label="Responsable de suivi (Manager)"
                        value={action.manager?.nom || ""}
                        readOnly
                    />
                ) : (
                    <FormSelectInput
                        label="Responsable de suivi"
                        value={formData.responsibleForFollowUp}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, responsibleForFollowUp: e.target.value })}
                        options={users.map((user) => ({
                            value: user._id,
                            label: user.nom
                        }))}
                        required
                        placeholder="Sélectionner un responsable"
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormDefaultInput
                    label="Date de début"
                    type="date"
                    value={formData.startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                />

                <FormDefaultInput
                    label="Date de fin"
                    type="date"
                    value={formData.endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <div className="flex items-center">
                    <div className="px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700 w-full">
                        {formData.status === 'pending' && 'À faire'}
                        {formData.status === 'in_progress' && 'En cours'}
                        {formData.status === 'completed' && 'Terminé'}
                        {formData.status === 'cancelled' && 'Annulé'}
                    </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 italic">
                    Le statut ne peut être modifié que depuis le tableau des tâches en déplaçant la tâche associée.
                </p>
            </div>

            <div className="flex items-center mt-3">
                <input
                    type="checkbox"
                    id="needsValidation"
                    name="needsValidation"
                    checked={formData.needsValidation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, needsValidation: e.target.checked })
                    }
                    className="h-4 w-4 text-[#F28C38] border-gray-300 rounded focus:ring-[#F28C38]"
                />
                <label htmlFor="needsValidation" className="ml-2 block text-sm font-medium text-gray-700">
                    Nécessite une validation par le manager
                </label>
            </div>
        </div>
    );
};

export default GlobalActionUpdateForm; 