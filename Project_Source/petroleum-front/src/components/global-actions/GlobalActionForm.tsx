import React, { useState, useEffect } from 'react';
import FormDefaultInput from '../form/form-elements/FormDefaultInput';
import FormSelectInput from '../form/form-elements/FormSelectInput';
import FormTextAreaInput from '../form/form-elements/FormTextAreaInput';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { GlobalActionFormData } from '../../types/action';

interface GlobalActionFormProps {
    formData: GlobalActionFormData;
    setFormData: React.Dispatch<React.SetStateAction<GlobalActionFormData>>;
    projects: any[];
    users: any[];
}
interface User {
    userId: string;
    email: string;
    role: string;
    nom: string;
    iat: number;
    exp: number;
}

// Predefined document categories based on the document model
const DOCUMENT_CATEGORIES = [
    'Documents globale',
    'Dossier Administratif',
    'Dossier Technique',
    'Dossier RH',
    'Dossier HSE'
];

const GlobalActionForm: React.FC<GlobalActionFormProps> = ({ formData, setFormData, projects, users }) => {
    // Assuming currentUser is the logged-in manager
    const token = localStorage.getItem('token');
    let currentUser: User | null = null;

    if (token) {
        try {
            const decodedToken = jwtDecode<User>(token);

            currentUser = decodedToken; // The user data is directly in the decoded token

        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormSelectInput
                    label="Projet (optionnel)"
                    value={formData.projectId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const newProjectId = e.target.value;
                        const selectedProject = projects.find(project => project._id === newProjectId);

                        setFormData(prevFormData => ({
                            ...prevFormData,
                            projectId: newProjectId,
                            // Reset project category when project changes
                            projectCategory: '',
                            // Set the current user's ID for responsibleForFollowUp
                            responsibleForFollowUp: currentUser ? currentUser.userId : ''
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormSelectInput
                    label="Responsable de réalisation"
                    value={formData.responsibleForRealization}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, responsibleForRealization: e.target.value })}
                    options={users.map((user) => ({
                        value: user._id,
                        label: user.nom
                    }))}
                    required
                    placeholder="Sélectionner un responsable"
                />

                {formData.projectId ? (
                    <>
                        <input
                            type="hidden"
                            value={formData.responsibleForFollowUp}
                        />
                        <FormDefaultInput
                            label="Responsable de suivi"
                            value={users.find(user => user._id === formData.responsibleForFollowUp)?.nom || ""}
                            readOnly
                        />
                    </>
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

            <div className="flex items-center mt-3">
                <input
                    type="checkbox"
                    id="needsValidation"
                    checked={formData.needsValidation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, needsValidation: e.target.checked })}
                    className="h-4 w-4 text-[#F28C38] border-gray-300 rounded focus:ring-[#F28C38]"
                />
                <label htmlFor="needsValidation" className="ml-2 block text-sm font-medium text-gray-700">
                    Nécessite une validation par le manager
                </label>
            </div>
        </div>
    );
};

export default GlobalActionForm; 