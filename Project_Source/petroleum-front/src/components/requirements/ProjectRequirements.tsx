import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon, DocumentTextIcon, DocumentCheckIcon, ArrowRightIcon, ShieldExclamationIcon, ClipboardDocumentListIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { RequirementType, fetchProjectRequirements, addProjectRequirement, updateProjectRequirement, deleteProjectRequirement } from '../../store/slices/projectSlice';
import { toast } from 'react-toastify';

// Interface for backend requirement
interface Requirement {
    _id: string;
    content: string;
    type: RequirementType;
    projectId: string;
    createdAt: string;
    updatedAt: string;
}

interface RequirementCategory {
    id: RequirementType;
    title: string;
    icon: React.ReactNode;
    color: string;
    requirements: Requirement[];
}

interface ProjectRequirementsProps {
    projectId: string;
}

const ProjectRequirements: React.FC<ProjectRequirementsProps> = ({ projectId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { requirementsLoading: loading, requirementsError: error } = useSelector((state: RootState) => state.projects);

    // State
    const [categories, setCategories] = useState<RequirementCategory[]>([
        {
            id: RequirementType.REGULATORY,
            title: 'Exigences réglementaires',
            icon: <ShieldExclamationIcon className="h-5 w-5" />,
            color: 'bg-blue-500 dark:bg-blue-600',
            requirements: []
        },
        {
            id: RequirementType.TECHNICAL,
            title: 'Exigences techniques',
            icon: <DocumentCheckIcon className="h-5 w-5" />,
            color: 'bg-purple-500 dark:bg-purple-600',
            requirements: []
        },
        {
            id: RequirementType.BUSINESS,
            title: 'Exigences métier',
            icon: <ArrowRightIcon className="h-5 w-5" />,
            color: 'bg-amber-500 dark:bg-amber-600',
            requirements: []
        },
        {
            id: RequirementType.ENVIRONMENTAL,
            title: 'Exigences environnementales',
            icon: <DocumentTextIcon className="h-5 w-5" />,
            color: 'bg-emerald-500 dark:bg-emerald-600',
            requirements: []
        },
        {
            id: RequirementType.SAFETY,
            title: 'Exigences de sécurité',
            icon: <ShieldExclamationIcon className="h-5 w-5" />,
            color: 'bg-red-500 dark:bg-red-600',
            requirements: []
        },
        {
            id: RequirementType.OTHER,
            title: 'Autres exigences',
            icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
            color: 'bg-gray-500 dark:bg-gray-600',
            requirements: []
        }
    ]);

    // UI State
    const [editingItem, setEditingItem] = useState<{ categoryId: RequirementType, requirementId: string } | null>(null);
    const [editContent, setEditContent] = useState('');
    const [newRequirements, setNewRequirements] = useState<Record<string, string>>({});
    const [activeCategory, setActiveCategory] = useState<RequirementType | null>(null);

    // Fetch requirements on component mount
    useEffect(() => {
        fetchRequirements();
    }, [projectId]);

    // Fetch requirements using the Redux slice
    const fetchRequirements = async () => {
        try {
            const resultAction = await dispatch(fetchProjectRequirements(projectId));

            if (fetchProjectRequirements.fulfilled.match(resultAction)) {
                const requirements = resultAction.payload;
                console.log("Received requirements:", requirements);

                // Create a new categories array with the updated requirements
                const updatedCategories = categories.map(category => {
                    const categoryRequirements = requirements.filter(
                        (req: Requirement) => req.type === category.id
                    );
                    return {
                        ...category,
                        requirements: categoryRequirements
                    };
                });

                setCategories(updatedCategories);
            }
        } catch (err) {
            console.error('Error fetching requirements:', err);
        }
    };

    // Toggle the active category
    const toggleCategory = (categoryId: RequirementType) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
    };

    // Handle adding a new requirement
    const handleAddRequirement = async (categoryId: RequirementType) => {
        if (!newRequirements[categoryId] || newRequirements[categoryId].trim() === '') return;

        try {
            const resultAction = await dispatch(addProjectRequirement({
                projectId,
                requirement: {
                    content: newRequirements[categoryId],
                    type: categoryId
                }
            }));

            if (addProjectRequirement.fulfilled.match(resultAction)) {
                const newRequirement = resultAction.payload;

                setCategories(categories.map(category => {
                    if (category.id === categoryId) {
                        return {
                            ...category,
                            requirements: [
                                newRequirement,
                                ...category.requirements
                            ]
                        };
                    }
                    return category;
                }));

                // Clear the input field
                setNewRequirements({
                    ...newRequirements,
                    [categoryId]: ''
                });
            }
        } catch (err: any) {
            console.error('Error adding requirement:', err);
        }
    };

    // Handle editing a requirement
    const handleStartEdit = (categoryId: RequirementType, requirement: Requirement) => {
        setEditingItem({ categoryId, requirementId: requirement._id });
        setEditContent(requirement.content);
    };

    const handleSaveEdit = async () => {
        if (!editingItem || editContent.trim() === '') return;

        try {
            const resultAction = await dispatch(updateProjectRequirement({
                projectId,
                requirementId: editingItem.requirementId,
                requirement: {
                    content: editContent,
                    type: editingItem.categoryId
                }
            }));

            if (updateProjectRequirement.fulfilled.match(resultAction)) {
                const updatedRequirement = resultAction.payload;

                setCategories(categories.map(category => {
                    if (category.id === editingItem.categoryId) {
                        return {
                            ...category,
                            requirements: category.requirements.map(req => {
                                if (req._id === editingItem.requirementId) {
                                    return updatedRequirement;
                                }
                                return req;
                            })
                        };
                    }
                    return category;
                }));

                // Reset editing state
                setEditingItem(null);
                setEditContent('');
            }
        } catch (err: any) {
            console.error('Error updating requirement:', err);
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditContent('');
    };

    // Handle deleting a requirement
    const handleDeleteRequirement = async (categoryId: RequirementType, requirementId: string) => {
        try {
            const resultAction = await dispatch(deleteProjectRequirement({
                projectId,
                requirementId
            }));

            if (deleteProjectRequirement.fulfilled.match(resultAction)) {
                setCategories(categories.map(category => {
                    if (category.id === categoryId) {
                        return {
                            ...category,
                            requirements: category.requirements.filter(req => req._id !== requirementId)
                        };
                    }
                    return category;
                }));
            }
        } catch (err: any) {
            console.error('Error deleting requirement:', err);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0" />
                <div>
                    <h3 className="font-medium">Erreur</h3>
                    <p>{error}</p>
                </div>
                <button
                    onClick={fetchRequirements}
                    className="ml-auto bg-red-100 dark:bg-red-800/30 px-3 py-1 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-700/30"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8">
            {/* Category Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {categories.map((category) => (
                    <motion.div
                        key={category.id}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleCategory(category.id)}
                        className={`cursor-pointer relative rounded-xl shadow-md overflow-hidden ${activeCategory === category.id
                            ? 'ring-2 ring-[#F28C38] ring-offset-2 dark:ring-offset-gray-800'
                            : 'hover:shadow-lg'
                            }`}
                    >
                        <div className={`absolute inset-0 opacity-10 ${category.color}`}></div>
                        <div className="relative p-5 flex flex-col items-center text-center">
                            <div className={`p-3 rounded-full mb-3 text-white ${category.color}`}>
                                {category.icon}
                            </div>
                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {category.title}
                            </h4>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {category.requirements.length} exigence{category.requirements.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Requirements Content */}
            <AnimatePresence mode="wait">
                {activeCategory && (
                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                    >
                        {categories
                            .filter((category) => category.id === activeCategory)
                            .map((category) => (
                                <div key={category.id} className="p-0">
                                    {/* Category Header */}
                                    <div className={`py-4 px-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 ${category.color} bg-opacity-10 dark:bg-opacity-20`}>
                                        <div className={`p-2 rounded-full text-white ${category.color}`}>
                                            {category.icon}
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                            {category.title}
                                        </h3>
                                    </div>

                                    {/* Add new requirement form */}
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-start gap-3">
                                            <textarea
                                                value={newRequirements[category.id] || ''}
                                                onChange={(e) => setNewRequirements({
                                                    ...newRequirements,
                                                    [category.id]: e.target.value
                                                })}
                                                className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-[#F28C38] focus:ring-[#F28C38] shadow-sm"
                                                placeholder={`Ajouter une nouvelle ${category.title.toLowerCase()}...`}
                                                rows={2}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(242, 140, 56, 0.3)" }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAddRequirement(category.id)}
                                                className="relative px-5 py-3 overflow-hidden font-medium rounded-xl text-white bg-[#F28C38] shadow-md group"
                                            >
                                                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F7A456] to-[#F28C38] group-hover:from-[#F28C38] group-hover:to-[#E67E2E] transition-all duration-300"></span>
                                                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition-all duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-[#F7A456] opacity-30 group-hover:rotate-90 ease"></span>
                                                <span className="relative flex items-center justify-center gap-2">
                                                    <PlusIcon className="h-5 w-5" />
                                                    <span className="font-semibold">Ajouter</span>
                                                </span>
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Requirements List */}
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        <AnimatePresence>
                                            {category.requirements.length > 0 ? (
                                                category.requirements.map((requirement, index) => (
                                                    <motion.div
                                                        key={requirement._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                                    >
                                                        {editingItem && editingItem.requirementId === requirement._id ? (
                                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                                                                <div className="flex items-start gap-3">
                                                                    <textarea
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-[#F28C38] focus:ring-[#F28C38] shadow-sm"
                                                                        rows={2}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex flex-col space-y-2">
                                                                        <button
                                                                            onClick={handleSaveEdit}
                                                                            className="p-2 bg-gradient-to-r from-[#F28C38] to-[#F7A456] text-white rounded-lg hover:from-[#E67E2E] hover:to-[#F28C38] transition-all shadow-sm"
                                                                            title="Enregistrer"
                                                                        >
                                                                            <CheckIcon className="h-5 w-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            className="p-2 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all shadow-sm"
                                                                            title="Annuler"
                                                                        >
                                                                            <XMarkIcon className="h-5 w-5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1">
                                                                        <p className="text-gray-800 dark:text-gray-200">{requirement.content}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                            Ajouté le {new Date(requirement.createdAt).toLocaleDateString('fr-FR')}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <button
                                                                            onClick={() => handleStartEdit(category.id, requirement)}
                                                                            className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/30 dark:to-blue-700/20 text-blue-600 dark:text-blue-400 rounded-lg hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-700/30 dark:hover:to-blue-600/30 transition-all shadow-sm flex items-center justify-center"
                                                                            title="Modifier"
                                                                        >
                                                                            <PencilIcon className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteRequirement(category.id, requirement._id)}
                                                                            className="p-2 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800/30 dark:to-red-700/20 text-red-600 dark:text-red-400 rounded-lg hover:from-red-200 hover:to-red-300 dark:hover:from-red-700/30 dark:hover:to-red-600/30 transition-all shadow-sm flex items-center justify-center"
                                                                            title="Supprimer"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="py-12 flex flex-col items-center justify-center text-center"
                                                >
                                                    <div className={`p-3 rounded-full mb-3 text-white ${category.color}`}>
                                                        {category.icon}
                                                    </div>
                                                    <h4 className="text-gray-500 dark:text-gray-400 mb-1">Aucune exigence</h4>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
                                                        Utilisez le formulaire ci-dessus pour ajouter votre première exigence dans cette catégorie
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ))}
                    </motion.div>
                )}

                {/* No active category message */}
                {!activeCategory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 flex flex-col items-center justify-center text-center"
                    >
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
                            <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Sélectionnez une catégorie
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            Choisissez une catégorie d'exigences ci-dessus pour consulter, ajouter ou modifier des exigences spécifiques pour ce projet.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectRequirements; 