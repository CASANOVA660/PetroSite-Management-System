import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CreatePersonalTaskFormProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

interface FormErrors {
    title?: string;
    dueDate?: string;
}

const panelStyles: React.CSSProperties = {
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 100000,
    overflowY: 'auto',
    padding: '24px',
    maxWidth: '90%',
    maxHeight: '90%',
    width: '500px',
    borderRadius: '8px',
    transition: 'transform 0.3s ease, opacity 0.3s ease'
};

const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
};

const priorityOptions = [
    { value: 'high', label: 'Haute', color: 'bg-red-100 text-red-700' },
    { value: 'medium', label: 'Moyenne', color: 'bg-orange-100 text-orange-700' },
    { value: 'low', label: 'Basse', color: 'bg-blue-100 text-blue-700' }
];

const CreatePersonalTaskForm: React.FC<CreatePersonalTaskFormProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: new Date(),
        priority: 'medium'
    });
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubtasks, setShowSubtasks] = useState(false);

    // Scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setFormData(prev => ({ ...prev, dueDate: date }));
            if (errors.dueDate) {
                setErrors(prev => ({ ...prev, dueDate: undefined }));
            }
        }
    };

    const addSubtask = () => {
        if (!newSubtaskText.trim()) return;
        const newSubtask: Subtask = {
            id: Date.now().toString(),
            text: newSubtaskText.trim(),
            completed: false
        };
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskText('');
    };

    const removeSubtask = (id: string) => {
        setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
    };

    const updateSubtaskText = (id: string, text: string) => {
        setSubtasks(prev =>
            prev.map(subtask => (subtask.id === id ? { ...subtask, text } : subtask))
        );
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Le titre est requis';
        }
        if (!formData.dueDate) {
            newErrors.dueDate = 'La date d’échéance est requise';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Mock API call (replace with your Redux dispatch, e.g., dispatch(createTask({...formData, subtasks})))
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Personal task created:', { ...formData, subtasks });
            onClose();
        } catch (error) {
            console.error('Failed to create task:', error);
            setErrors({ title: 'Une erreur est survenue. Veuillez réessayer.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={backdropStyles} onClick={onClose}>
            <div
                style={{
                    ...panelStyles,
                    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
                    opacity: isOpen ? 1 : 0
                }}
                className="flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="create-task-title"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ zIndex: 100001 }}
                    aria-label="Fermer le formulaire"
                >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2
                        id="create-task-title"
                        className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent"
                    >
                        Nouvelle tâche personnelle
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Planifiez votre journée avec une nouvelle tâche.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Titre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors.title ? 'border-red-500' : 'border-gray-200'
                                }`}
                            placeholder="Ex. Faire les courses"
                            aria-required="true"
                            aria-invalid={!!errors.title}
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description (optionnel)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-y"
                            placeholder="Notes ou détails..."
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            {formData.description.length}/500 caractères
                        </p>
                    </div>

                    {/* Subtasks Toggle */}
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={showSubtasks}
                                onChange={() => setShowSubtasks(!showSubtasks)}
                                className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                                Ajouter des sous-tâches (optionnel)
                            </span>
                        </label>
                        {showSubtasks && (
                            <div className="mt-3 space-y-3 bg-amber-50 p-4 rounded-md transition-all duration-300 ease-in-out">
                                {subtasks.map(subtask => (
                                    <div key={subtask.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={subtask.completed}
                                            onChange={() =>
                                                setSubtasks(prev =>
                                                    prev.map(s =>
                                                        s.id === subtask.id
                                                            ? { ...s, completed: !s.completed }
                                                            : s
                                                    )
                                                )
                                            }
                                            className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <input
                                            type="text"
                                            value={subtask.text}
                                            onChange={(e) =>
                                                updateSubtaskText(subtask.id, e.target.value)
                                            }
                                            className="flex-1 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="Sous-tâche"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSubtask(subtask.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            aria-label="Supprimer la sous-tâche"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newSubtaskText}
                                        onChange={(e) => setNewSubtaskText(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Nouvelle sous-tâche..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSubtask();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={addSubtask}
                                        className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                        disabled={!newSubtaskText.trim()}
                                    >
                                        <PlusIcon className="h-5 w-5 mr-1" />
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Date d’échéance <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative">
                            <DatePicker
                                selected={formData.dueDate}
                                onChange={handleDateChange}
                                dateFormat="dd MMMM yyyy"
                                locale={fr}
                                minDate={new Date()}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${errors.dueDate ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholderText="Choisir une date"
                                showPopperArrow={false}
                                aria-required="true"
                                aria-invalid={!!errors.dueDate}
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                        {errors.dueDate && (
                            <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priorité (optionnel)
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                            {priorityOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-md hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Création...
                                </>
                            ) : (
                                'Ajouter la tâche'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePersonalTaskForm;