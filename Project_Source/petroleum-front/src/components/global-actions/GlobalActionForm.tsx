import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
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

const DOCUMENT_CATEGORIES = [
    'Documents globale',
    'Dossier Administratif',
    'Dossier Technique',
    'Dossier RH',
    'Dossier HSE'
];

const ACTION_CATEGORIES = [
    { value: 'HSE', label: 'HSE' },
    { value: 'Qualité', label: 'Qualité' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Opération', label: 'Opération' }
];

const GlobalActionForm: React.FC<GlobalActionFormProps> = ({ formData, setFormData, projects, users }) => {
    const [isProjectSectionOpen, setIsProjectSectionOpen] = useState(false);

    const token = localStorage.getItem('token');
    let currentUser: User | null = null;

    if (token) {
        try {
            const decodedToken = jwtDecode<User>(token);
            currentUser = decodedToken;
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }

    const getProjectCategories = (projectId: string) => {
        if (!projectId) return DOCUMENT_CATEGORIES;

        const selectedProject = projects.find(project => project._id === projectId);
        if (selectedProject &&
            selectedProject.categories &&
            Array.isArray(selectedProject.categories) &&
            selectedProject.categories.length > 0) {
            return selectedProject.categories;
        }
        return DOCUMENT_CATEGORIES;
    };

    const projectCategories = formData.projectId ? getProjectCategories(formData.projectId) : DOCUMENT_CATEGORIES;

    const handleInputChange = (field: keyof GlobalActionFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="bg-white p-4 rounded-lg">
            <div className="space-y-3">
                {/* Title and Category Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="title" className="block text-xs font-medium text-gray-800 mb-1">
                            Titre <span className="text-teal-600">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200"
                            placeholder="Titre de l'action"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-xs font-medium text-gray-800 mb-1">
                            Catégorie <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 appearance-none"
                                required
                            >
                                <option value="" disabled>Sélectionner</option>
                                {ACTION_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">▼</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label htmlFor="content" className="block text-xs font-medium text-gray-800 mb-1">
                        Contenu <span className="text-teal-600">*</span>
                    </label>
                    <textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 resize-none"
                        rows={2}
                        placeholder="Description de l'action"
                        required
                    />
                </div>

                {/* Responsibilities Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="responsibleForRealization" className="block text-xs font-medium text-gray-800 mb-1">
                            Responsable (Réalisation) <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="responsibleForRealization"
                                value={formData.responsibleForRealization}
                                onChange={(e) => handleInputChange('responsibleForRealization', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 appearance-none"
                                required
                            >
                                <option value="" disabled>Sélectionner</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.nom}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">▼</span>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="responsibleForFollowUp" className="block text-xs font-medium text-gray-800 mb-1">
                            Responsable (Suivi) <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="responsibleForFollowUp"
                                value={formData.responsibleForFollowUp}
                                onChange={(e) => handleInputChange('responsibleForFollowUp', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 appearance-none"
                                required
                            >
                                <option value="" disabled>Sélectionner</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.nom}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">▼</span>
                        </div>
                    </div>
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="startDate" className="block text-xs font-medium text-gray-800 mb-1">
                            Date de début <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                id="startDate"
                                value={formData.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 pl-8"
                                required
                            />
                            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-xs font-medium text-gray-800 mb-1">
                            Date de fin <span className="text-teal-600">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                id="endDate"
                                value={formData.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 pl-8"
                                required
                            />
                            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Collapsible Project Section */}
                <div>
                    <button
                        type="button"
                        onClick={() => setIsProjectSectionOpen(!isProjectSectionOpen)}
                        className="w-full flex items-center justify-between text-xs font-medium text-gray-800 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-all duration-200"
                    >
                        <span>Projet (optionnel)</span>
                        {isProjectSectionOpen ? (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                    </button>
                    {isProjectSectionOpen && (
                        <div className="mt-2 space-y-3">
                            <div>
                                <label htmlFor="projectId" className="block text-xs font-medium text-gray-800 mb-1">
                                    Projet
                                </label>
                                <div className="relative">
                                    <select
                                        id="projectId"
                                        value={formData.projectId}
                                        onChange={(e) => {
                                            const newProjectId = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                projectId: newProjectId,
                                                projectCategory: ''
                                            }));
                                        }}
                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 appearance-none"
                                    >
                                        <option value="">Aucun</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">▼</span>
                                </div>
                            </div>
                            {formData.projectId && (
                                <div>
                                    <label htmlFor="projectCategory" className="block text-xs font-medium text-gray-800 mb-1">
                                        Catégorie du projet <span className="text-teal-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="projectCategory"
                                            value={formData.projectCategory}
                                            onChange={(e) => handleInputChange('projectCategory', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all duration-200 appearance-none"
                                            required
                                        >
                                            <option value="" disabled>Sélectionner</option>
                                            {projectCategories.map((category: string) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">▼</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Validation */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="needsValidation"
                        checked={formData.needsValidation}
                        onChange={(e) => handleInputChange('needsValidation', e.target.checked)}
                        className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-600"
                    />
                    <label htmlFor="needsValidation" className="ml-2 block text-xs font-medium text-gray-800">
                        Validation par le manager
                    </label>
                </div>
            </div>
        </div>
    );
};

export default GlobalActionForm;