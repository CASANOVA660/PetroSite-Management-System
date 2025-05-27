import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { PlanType } from '../../store/slices/planningSlice';

interface CustomPlanModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (plan: any) => void;
    plan?: any;
    projectId?: string;
}

function CustomPlanModal({ open, onClose, onSave, plan, projectId }: CustomPlanModalProps) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'custom',
        startDate: '',
        endDate: '',
        responsiblePerson: '',
        location: '',
        notes: '',
        customType: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [formStep, setFormStep] = useState(0); // For multi-step form

    useEffect(() => {
        if (plan) {
            setForm({
                title: plan.title || '',
                description: plan.description || '',
                type: 'custom',
                startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
                endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
                responsiblePerson: typeof plan.responsiblePerson === 'object' ? plan.responsiblePerson.name : plan.responsiblePerson || '',
                location: plan.location || '',
                notes: plan.notes || '',
                customType: plan.type && plan.type !== PlanType.PLACEMENT &&
                    plan.type !== PlanType.MAINTENANCE &&
                    plan.type !== PlanType.REPAIR ? plan.type : '',
            });
            // If editing, skip to last step
            setFormStep(plan ? 2 : 0);
        } else {
            setForm({
                title: '',
                description: '',
                type: 'custom',
                startDate: '',
                endDate: '',
                responsiblePerson: '',
                location: '',
                notes: '',
                customType: '',
            });
            setFormStep(0);
        }
        setError(null);
    }, [plan, open]);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear error when user is typing
        if (error) setError(null);
    };

    const nextStep = () => {
        // Validation for step 0
        if (formStep === 0 && (!form.title || !form.customType)) {
            setError('Veuillez remplir le titre et le type de planification.');
            return;
        }

        // Validation for step 1
        if (formStep === 1) {
            if (!form.startDate || !form.endDate) {
                setError('Veuillez sélectionner les dates de début et de fin.');
                return;
            }

            // Validate date range
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            if (start >= end) {
                setError('La date de fin doit être postérieure à la date de début.');
                return;
            }
        }

        setFormStep(prev => prev + 1);
        setError(null);
    };

    const prevStep = () => {
        setFormStep(prev => prev - 1);
        setError(null);
    };

    const handleSubmit = () => {
        if (!form.responsiblePerson) {
            setError('Veuillez indiquer un responsable pour cette planification.');
            return;
        }

        const planToSave = {
            ...form,
            type: 'custom',
            customTypeName: form.customType,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            status: 'scheduled',
            responsiblePerson: {
                name: form.responsiblePerson
            },
            projectId: projectId || (plan?.projectId?._id || plan?.projectId)
            // equipmentId is optional for custom plans
        };

        // Log what we're sending
        console.log('Sending custom plan data:', planToSave);

        onSave(planToSave);
        onClose();
    };

    // Calculate progress percentage for progress bar
    const progressPercentage = ((formStep + 1) / 3) * 100;

    if (!open) return null;

    // Common classes
    const inputClass = "w-full px-4 py-3 rounded-lg border-0 bg-gray-50 shadow-inner focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
    const inputIconWrapper = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none";
    const inputIcon = "h-5 w-5 text-purple-400";
    const buttonClass = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:translate-y-[-2px]";

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <h3 className="text-xl font-semibold">
                        {plan ? 'Modifier la planification personnalisée' : 'Nouvelle planification personnalisée'}
                    </h3>
                    <div className="text-sm text-purple-100 mt-1">
                        {formStep === 0 ? 'Informations de base' :
                            formStep === 1 ? 'Dates et lieu' : 'Détails supplémentaires'}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-white/20 rounded-full mt-4">
                        <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                <div className="p-6">
                    {error && (
                        <motion.div
                            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r-md"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </motion.div>
                    )}

                    {/* Form Steps */}
                    <div className="space-y-6">
                        {/* Step 1: Basic Info */}
                        <AnimatePresence mode="wait">
                            {formStep === 0 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                                Titre
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                className={`${inputClass} focus:shadow-md`}
                                                value={form.title}
                                                onChange={(e) => handleChange('title', e.target.value)}
                                                placeholder="Titre de la planification"
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Type de planification
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                className={`${inputClass} focus:shadow-md`}
                                                value={form.customType}
                                                onChange={(e) => handleChange('customType', e.target.value)}
                                                placeholder="Ex: Formation, Audit, Inspection..."
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-500">Exemple: Formation, Audit, Inspection, Réunion, etc.</p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                                Description
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <textarea
                                                className={`${inputClass} resize-none min-h-[120px] focus:shadow-md`}
                                                value={form.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                placeholder="Description détaillée de la planification..."
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Dates & Location */}
                            {formStep === 1 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>
                                                <span className="flex items-center">
                                                    <CalendarIcon className="h-4 w-4 mr-1 text-purple-500" />
                                                    Date de début
                                                </span>
                                            </label>
                                            <div className="relative group">
                                                <div className={inputIconWrapper}>
                                                    <CalendarIcon className={inputIcon} />
                                                </div>
                                                <input
                                                    type="date"
                                                    className={`${inputClass} pl-10 focus:shadow-md`}
                                                    value={form.startDate}
                                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                                />
                                                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <span className="flex items-center">
                                                    <CalendarIcon className="h-4 w-4 mr-1 text-purple-500" />
                                                    Date de fin
                                                </span>
                                            </label>
                                            <div className="relative group">
                                                <div className={inputIconWrapper}>
                                                    <CalendarIcon className={inputIcon} />
                                                </div>
                                                <input
                                                    type="date"
                                                    className={`${inputClass} pl-10 focus:shadow-md`}
                                                    value={form.endDate}
                                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                                />
                                                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                Lieu
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <div className={inputIconWrapper}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className={inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                className={`${inputClass} pl-10 focus:shadow-md`}
                                                value={form.location}
                                                onChange={(e) => handleChange('location', e.target.value)}
                                                placeholder="Lieu de l'activité"
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Additional Details */}
                            {formStep === 2 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                Responsable
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <div className={inputIconWrapper}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className={inputIcon} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                className={`${inputClass} pl-10 focus:shadow-md`}
                                                value={form.responsiblePerson}
                                                onChange={(e) => handleChange('responsiblePerson', e.target.value)}
                                                placeholder="Nom du responsable"
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <span className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                </svg>
                                                Notes supplémentaires
                                            </span>
                                        </label>
                                        <div className="relative group">
                                            <textarea
                                                className={`${inputClass} resize-none min-h-[120px] focus:shadow-md`}
                                                value={form.notes}
                                                onChange={(e) => handleChange('notes', e.target.value)}
                                                placeholder="Notes ou informations complémentaires..."
                                            />
                                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-purple-500 transition-all duration-300 group-focus-within:w-full"></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-between">
                    <div>
                        {formStep > 0 && (
                            <button
                                onClick={prevStep}
                                className={`${buttonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md`}
                            >
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    Retour
                                </span>
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className={`${buttonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md`}
                        >
                            Annuler
                        </button>

                        {formStep < 2 ? (
                            <button
                                onClick={nextStep}
                                className={`${buttonClass} bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg shadow-md`}
                            >
                                <span className="flex items-center">
                                    Suivant
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className={`${buttonClass} bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg shadow-md`}
                            >
                                {plan ? 'Mettre à jour' : 'Créer la planification'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default CustomPlanModal; 