import { useState } from 'react';
import { XMarkIcon, PencilSquareIcon, UserCircleIcon, ClockIcon, ChartBarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { updateEmployee, deleteEmployee, Employee } from '../../store/slices/employeesSlice';

interface EmployeeProfileProps {
    employee: Employee;
    onClose: () => void;
}

// Tabs
type TabType = 'personal' | 'employment' | 'performance';

export default function EmployeeProfile({ employee, onClose }: EmployeeProfileProps) {
    const [activeTab, setActiveTab] = useState<TabType>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const dispatch: AppDispatch = useDispatch();
    const { loading, error } = useSelector((state: RootState) => state.employees);
    const [editForm, setEditForm] = useState<Employee>(employee);
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

    // Format date to locale string
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Get status badge classes
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'onleave': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'onleave': return 'En congé';
            case 'pending': return 'En attente';
            case 'terminated': return 'Terminé';
            default: return status;
        }
    };

    // Mock employment history data
    const employmentHistory = [
        {
            id: 1,
            title: 'Embauche initiale',
            date: new Date('2020-03-15').toISOString(),
            position: 'Développeur Junior',
            department: 'IT'
        },
        {
            id: 2,
            title: 'Promotion',
            date: new Date('2021-06-20').toISOString(),
            position: 'Développeur Intermédiaire',
            department: 'IT'
        },
        {
            id: 3,
            title: 'Changement de Département',
            date: new Date('2022-01-10').toISOString(),
            position: 'Développeur Senior',
            department: 'Engineering'
        },
        {
            id: 4,
            title: 'Promotion',
            date: new Date('2023-04-05').toISOString(),
            position: 'Chef de Projet',
            department: 'Engineering'
        }
    ];

    // Mock performance data (for radar chart)
    const performanceData = [
        { category: 'Technique', score: 85 },
        { category: 'Communication', score: 75 },
        { category: 'Leadership', score: 65 },
        { category: 'Travail d\'équipe', score: 90 },
        { category: 'Adaptabilité', score: 80 }
    ];

    // Animation variants
    const tabVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    // Handle edit form changes
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // Handle profile image change
    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            setEditForm(prev => ({ ...prev, profileImage: URL.createObjectURL(file) }));
        }
    };

    // Handle save edit
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(editForm).forEach(([key, value]) => {
            if (value && key !== 'profileImage') formData.append(key, value as string);
        });
        if (profileImageFile) {
            formData.append('profileImage', profileImageFile);
        }
        try {
            await dispatch(updateEmployee({ id: employee._id!, formData })).unwrap();
            setIsEditing(false);
        } catch (e) { }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!employee._id) return;
        try {
            await dispatch(deleteEmployee(employee._id)).unwrap();
            onClose();
        } catch (e) { }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
        >
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profil d'employé</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Employee profile header */}
            <div className="flex flex-col items-center mb-6">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-r from-[#FA812F] to-orange-400 flex items-center justify-center mb-4">
                    {employee.profileImage ? (
                        <img
                            src={employee.profileImage}
                            alt={employee.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-white text-2xl font-bold">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{employee.name}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{employee.position || ''}</div>
                <div className="mt-2">
                    <span className={`px-3 py-1 inline-flex text-xs font-medium leading-5 rounded-full ${getStatusColor(employee.status || '')}`}>
                        {getStatusText(employee.status || '')}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${activeTab === 'personal'
                            ? 'border-[#FA812F] text-[#FA812F]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <UserCircleIcon className="h-4 w-4" />
                        <span>Informations Personnelles</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('employment')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${activeTab === 'employment'
                            ? 'border-[#FA812F] text-[#FA812F]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <ClockIcon className="h-4 w-4" />
                        <span>Historique d'Emploi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${activeTab === 'performance'
                            ? 'border-[#FA812F] text-[#FA812F]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <ChartBarIcon className="h-4 w-4" />
                        <span>Performance</span>
                    </button>
                </nav>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                {activeTab === 'personal' && (
                    <motion.div
                        key="personal"
                        variants={tabVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {isEditing ? (
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                {/* Example fields, add more as needed */}
                                <input name="name" value={editForm.name} onChange={handleEditChange} className="input" />
                                <input name="email" value={editForm.email} onChange={handleEditChange} className="input" />
                                <input name="phone" value={editForm.phone || ''} onChange={handleEditChange} className="input" />
                                <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                                <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Annuler</button>
                                {error && <div className="text-red-500">Erreur: {error}</div>}
                            </form>
                        ) : (
                            <PersonalInfoView employee={employee} />
                        )}
                    </motion.div>
                )}

                {activeTab === 'employment' && (
                    <motion.div
                        key="employment"
                        variants={tabVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <EmploymentHistory history={employmentHistory} />
                    </motion.div>
                )}

                {activeTab === 'performance' && (
                    <motion.div
                        key="performance"
                        variants={tabVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <PerformanceView data={performanceData} employee={employee} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Personal Info View Component
function PersonalInfoView({ employee }: { employee: Employee }) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const infoItems = [
        { label: 'Email', value: employee.email || '' },
        { label: 'Téléphone', value: employee.phone || '' },
        { label: 'Département', value: employee.department || '' },
        { label: 'Poste', value: employee.position || '' },
        { label: 'Date d\'embauche', value: formatDate(employee.hireDate) },
        { label: 'ID Employé', value: employee._id || '' }
    ];

    return (
        <div className="space-y-6">
            {infoItems.map((item, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                    <div className="text-md font-medium text-gray-900 dark:text-white mt-1">{item.value}</div>
                </div>
            ))}
        </div>
    );
}

// Employment History Component
function EmploymentHistory({ history }: { history: any[] }) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {history.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== history.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-slate-800">
                                        <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">{event.title}</p>
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{(event.position || '')} • {(event.department || '')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        {formatDate(event.date ?? '')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Performance View Component
function PerformanceView({ data, employee }: { data: any[]; employee: Employee }) {
    // Simple bar chart representation of the radar chart data
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Évaluation de Performance - {new Date().getFullYear()}
            </h3>

            <div className="grid gap-4">
                {data.map((item, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.category}</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.score}/100</div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <motion.div
                                className="bg-blue-600 h-2.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Commentaires du Manager</h4>
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {employee.name} a fait preuve d'un excellent travail d'équipe et de compétences techniques solides au cours de cette période d'évaluation. Des améliorations sont possibles en matière de leadership et de communication.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        - Sarah Dupont, Manager
                    </p>
                </div>

                <h4 className="text-md font-medium text-gray-900 dark:text-white mt-4">Objectifs pour la Prochaine Période</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Améliorer les compétences de présentation</li>
                    <li>Prendre en charge un projet indépendant</li>
                    <li>Participer à la formation des nouveaux membres de l'équipe</li>
                    <li>Poursuivre le développement technique dans le domaine des API REST</li>
                </ul>
            </div>
        </div>
    );
} 