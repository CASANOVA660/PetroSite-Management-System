import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    UserCircleIcon,

    BuildingOfficeIcon,
    CalendarIcon,
    PhoneIcon,
    EnvelopeIcon,
    TagIcon,
    DocumentTextIcon,
    PlusIcon,
    UserIcon
} from '@heroicons/react/24/outline';

interface AddEmployeePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddEmployeePanel({ isOpen, onClose }: AddEmployeePanelProps) {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<number>(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formProgress, setFormProgress] = useState(0);
    const [files, setFiles] = useState<File[]>([]);

    // Form data state for tracking completeness
    const [personalInfoComplete, setPersonalInfoComplete] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    // Handle profile image upload
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle document file uploads
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);
        setFiles([...files, ...newFiles]);
    };

    // Remove a file from the documents list
    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    // Check if the required personal info is filled
    const checkPersonalInfoComplete = () => {
        return fullName.trim() !== '' && email.trim() !== '';
    };

    // Calculate form progress based on filled fields
    const updateProgress = () => {
        // Simplistic implementation - just moves the progress bar
        // In a real application, we would calculate based on required fields completed
        setFormProgress(activeSection * 25);

        // Check if personal info is complete
        setPersonalInfoComplete(checkPersonalInfoComplete());
    };

    // Handle fullName change
    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFullName(e.target.value);
        setPersonalInfoComplete(e.target.value.trim() !== '' && email.trim() !== '');
    };

    // Handle email change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setPersonalInfoComplete(fullName.trim() !== '' && e.target.value.trim() !== '');
    };

    // Handle save employee
    const handleSaveEmployee = () => {
        // For now, we'll just check if personal info is complete and then close
        // In a real app, this would save to the database
        if (personalInfoComplete) {
            // Here would be the API call to save the employee data
            console.log('Employee saved with name:', fullName);
            onClose();
        }
    };

    const panelVariants = {
        hidden: { x: '100%', opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        exit: {
            x: '100%',
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: 'easeInOut'
            }
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[99999]"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed right-0 top-0 h-full max-w-md w-full bg-white dark:bg-slate-800 shadow-xl z-[100000] flex flex-col"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ajouter un Employé</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {activeSection === 1 ? "* Champs obligatoires" : "Remplissez les détails optionnels ou enregistrez avec les informations de base"}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </header>

                        {/* Progress bar */}
                        <div className="px-6 py-2 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-[72px] z-10">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <motion.div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${formProgress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <button
                                    onClick={() => setActiveSection(1)}
                                    className={`${activeSection >= 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                >
                                    Personnel*
                                </button>
                                <button
                                    onClick={() => personalInfoComplete && setActiveSection(2)}
                                    className={`${!personalInfoComplete ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection >= 2 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                >
                                    Emploi
                                </button>
                                <button
                                    onClick={() => personalInfoComplete && setActiveSection(3)}
                                    className={`${!personalInfoComplete ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection >= 3 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                >
                                    Documents
                                </button>
                                <button
                                    onClick={() => personalInfoComplete && setActiveSection(4)}
                                    className={`${!personalInfoComplete ? 'opacity-50 cursor-not-allowed' : ''} ${activeSection >= 4 ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                >
                                    Notes
                                </button>
                            </div>
                        </div>

                        {/* Form body - scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Section 1: Personal Information */}
                            {activeSection === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                        Informations Personnelles <span className="text-blue-500 text-sm font-normal">*obligatoire</span>
                                    </h3>

                                    {/* Information note about required fields */}
                                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Veuillez remplir au moins le nom et l'email pour créer l'employé. Les autres champs peuvent être complétés ultérieurement.
                                        </p>
                                    </div>

                                    {/* Profile Image */}
                                    <div className="flex flex-col items-center mb-6">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                                        >
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UserCircleIcon className="w-12 h-12 text-gray-400" />
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            Cliquez pour télécharger une photo (optionnel)
                                        </p>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <UserIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nom complet *"
                                                value={fullName}
                                                onChange={handleFullNameChange}
                                                className={`pl-10 w-full rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${fullName === '' ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:border-blue-500'}`}
                                                required
                                            />
                                            {fullName === '' && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-1">Obligatoire</p>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Adresse email *"
                                                value={email}
                                                onChange={handleEmailChange}
                                                className={`pl-10 w-full rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${email === '' ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 focus:border-blue-500'}`}
                                                required
                                            />
                                            {email === '' && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-1">Obligatoire</p>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Numéro de téléphone (optionnel)"
                                                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                            />
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                placeholder="Date de naissance (optionnel)"
                                                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Section 2: Job Details */}
                            {activeSection === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                        Détails du Poste <span className="text-gray-400 text-sm font-normal">(optionnel)</span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Titre du Poste
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="ex. Ingénieur Logiciel"
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Département
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                                >
                                                    <option value="">Sélectionner un département</option>
                                                    <option value="engineering">Ingénierie</option>
                                                    <option value="marketing">Marketing</option>
                                                    <option value="finance">Finance</option>
                                                    <option value="hr">Ressources Humaines</option>
                                                    <option value="operations">Opérations</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Date de Début
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="date"
                                                    className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Type de Contrat
                                            </label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center">
                                                    <input type="radio" name="workType" value="fulltime" className="mr-2" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">Temps plein</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input type="radio" name="workType" value="parttime" className="mr-2" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">Temps partiel</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input type="radio" name="workType" value="contract" className="mr-2" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">Contractuel</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Responsable/Superviseur
                                            </label>
                                            <select
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                            >
                                                <option value="">Sélectionner un responsable</option>
                                                <option value="1">Thomas Martin</option>
                                                <option value="2">Sarah Dupont</option>
                                                <option value="3">Jean Dubois</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Section 3: Document Folder Setup */}
                            {activeSection === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                        Configuration des Documents <span className="text-gray-400 text-sm font-normal">(optionnel)</span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Créer un Dossier Initial
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="ex. Documents de l'employé"
                                                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                                />
                                                <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                    <PlusIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Télécharger des Documents
                                            </label>
                                            <div
                                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                                                onClick={() => document.getElementById('documents')?.click()}
                                            >
                                                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                    Glissez et déposez des fichiers ici, ou cliquez pour parcourir
                                                </p>
                                                <input
                                                    id="documents"
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                />
                                            </div>
                                        </div>

                                        {/* File list */}
                                        {files.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Fichiers Sélectionnés ({files.length})
                                                </h4>
                                                <ul className="space-y-2">
                                                    {files.map((file, index) => (
                                                        <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                            <div className="flex items-center">
                                                                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFile(index)}
                                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Section 4: Tags & Notes */}
                            {activeSection === 4 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                        Tags & Notes <span className="text-gray-400 text-sm font-normal">(optionnel)</span>
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Tags
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <TagIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="ex. Télétravail, Sous-traitant (séparés par virgule)"
                                                    className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                    Intégration
                                                    <button className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                                                        <XMarkIcon className="h-3 w-3" />
                                                    </button>
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                    Nouveau
                                                    <button className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200">
                                                        <XMarkIcon className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Notes
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder="Ajoutez des notes supplémentaires sur cet employé"
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 py-2 px-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">Notification email:</span> Un email de bienvenue sera automatiquement envoyé à l'employé après l'enregistrement.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-slate-800 z-10">
                            <div className="flex justify-between">
                                <div className="flex gap-4">
                                    {activeSection > 1 && (
                                        <button
                                            onClick={() => setActiveSection(prev => Math.max(prev - 1, 1))}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                                        >
                                            Précédent
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                    >
                                        Annuler
                                    </button>

                                    {activeSection < 4 ? (
                                        <>
                                            {personalInfoComplete && (
                                                <button
                                                    onClick={handleSaveEmployee}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
                                                >
                                                    Enregistrer
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (personalInfoComplete || activeSection === 1) {
                                                        setActiveSection(prev => Math.min(prev + 1, 4));
                                                        updateProgress();
                                                    }
                                                }}
                                                disabled={activeSection > 1 && !personalInfoComplete}
                                                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 ${activeSection > 1 && !personalInfoComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                Continuer
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleSaveEmployee}
                                            disabled={!personalInfoComplete}
                                            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 flex items-center ${!personalInfoComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span>Enregistrer l'employé</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
} 