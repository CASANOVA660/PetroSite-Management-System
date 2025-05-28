import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import axios from '../../utils/axios';
import {
    UserGroupIcon,
    PlusIcon,
    ChevronRightIcon,
    MoonIcon,
    SunIcon,
    UserCircleIcon,
    ArrowPathIcon,
    AdjustmentsHorizontalIcon,
    UserPlusIcon,
    EllipsisHorizontalIcon,
    ClockIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import EmployeeAttendance from './EmployeeAttendance';

interface OperationEmployeesProps {
    projectId: string;
    initialEmployees?: Employee[];
}

// Interface for the employee data from DossierRH
interface ProjectEmployee {
    _id?: string;
    employeeId: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        position?: string;
        department?: string;
        profileImage?: string;
    };
    status: 'Assigné' | 'En opération' | 'Terminé';
    role: string;
    startDate?: string;
    endDate?: string;
    assignedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    assignedAt?: string;
}

interface Employee {
    _id: string;
    name: string;
    role: string;
    specialization: string;
    phone: string;
    email: string;
    photo?: string;
    status: 'active' | 'onLeave' | 'pending';
    shift?: 'day' | 'night';
    shiftStart?: string;
    shiftEnd?: string;
    position?: string;
    experience: number;
    certifications?: string[];
}

// Static data templates - will be combined with real employee data
const employeeTemplate: Partial<Employee> = {
    specialization: 'Spécialisation à définir',
    status: 'active',
    shiftStart: '08:00',
    shiftEnd: '20:00',
    experience: 5,
    certifications: ['Certification 1', 'Certification 2']
};

const OperationEmployees: React.FC<OperationEmployeesProps> = ({ projectId, initialEmployees = [] }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'attendance'>('list');
    const [showAddModal, setShowAddModal] = useState(false);
    const [projectEmployees, setProjectEmployees] = useState<ProjectEmployee[]>([]);
    const [displayEmployees, setDisplayEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);

    // Static stats for now
    const totalEmployees = 2;
    const dayShiftCount = 1;
    const nightShiftCount = 1;
    const onLeaveCount = 0;

    // Fetch project employees from the Dossier RH
    useEffect(() => {
        if (projectId) {
            fetchProjectEmployees();
            fetchAvailableEmployees();
        }
    }, [projectId]);

    // Convert project employees to display format
    useEffect(() => {
        if (projectEmployees.length > 0) {
            const employees = projectEmployees.map((pe, index) => {
                // Create a display employee with real name, profile photo, and role from project employee
                // but with static template data for the rest
                return {
                    _id: pe.employeeId._id,
                    name: pe.employeeId.name,
                    email: pe.employeeId.email,
                    photo: pe.employeeId.profileImage,
                    role: pe.role,
                    phone: pe.employeeId.phone || '+213555123456',
                    position: pe.employeeId.position || 'Position à définir',
                    // Alternate shift for visual variety
                    shift: index % 2 === 0 ? 'day' : 'night',
                    ...employeeTemplate
                } as Employee;
            });
            setDisplayEmployees(employees);
        }
    }, [projectEmployees]);

    const fetchProjectEmployees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/projects/${projectId}/employees`);
            setProjectEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching project employees:', error);
            toast.error('Erreur lors du chargement des employés du projet');
            // Fallback to static data if API fails
            setDisplayEmployees([
                {
                    _id: 'emp1',
                    name: 'Karim Benzema',
                    role: 'Opérateur de forage',
                    specialization: 'Forage profond',
                    phone: '+213555123456',
                    email: 'karim.benzema@example.com',
                    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
                    status: 'active',
                    shift: 'day',
                    shiftStart: '08:00',
                    shiftEnd: '20:00',
                    position: 'Chef d\'équipe',
                    experience: 8,
                    certifications: ['IWCF', 'H2S Safety']
                },
                {
                    _id: 'emp2',
                    name: 'Sofiane Boufal',
                    role: 'Technicien de maintenance',
                    specialization: 'Équipements hydrauliques',
                    phone: '+213555789012',
                    email: 'sofiane.boufal@example.com',
                    photo: 'https://randomuser.me/api/portraits/men/41.jpg',
                    status: 'active',
                    shift: 'night',
                    shiftStart: '20:00',
                    shiftEnd: '08:00',
                    experience: 5,
                    certifications: ['Hydraulic Systems', 'Mechanical Engineering']
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableEmployees = async () => {
        try {
            const response = await axios.get(`/projects/${projectId}/employees/available`);
            setAvailableEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching available employees:', error);
        }
    };

    // Handle add employee
    const handleAddEmployee = () => {
        toast.success('Employé ajouté au projet avec succès');
        setShowAddModal(false);
        // In a real implementation, this would add the employee and refresh the list
        fetchProjectEmployees();
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <UserGroupIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Personnel du Projet
                </h2>
                {activeTab === 'list' && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                    >
                        <UserPlusIcon className="h-5 w-5 mr-1" />
                        Ajouter du personnel
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <ul className="flex flex-wrap -mb-px">
                    <li className="mr-2">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'list'
                                ? 'border-[#F28C38] text-[#F28C38]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <UserGroupIcon className="w-5 h-5 mr-2" />
                            Liste du Personnel
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'attendance'
                                ? 'border-[#F28C38] text-[#F28C38]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <ClockIcon className="w-5 h-5 mr-2" />
                            Pointage
                        </button>
                    </li>
                </ul>
            </div>

            {activeTab === 'attendance' ? (
                <EmployeeAttendance projectId={projectId} />
            ) : (
                <>
                    {/* Statistics & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 shadow-sm"
                        >
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Personnel total</h3>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{displayEmployees.length || totalEmployees}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Employés assignés</p>
                                </div>
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 shadow-sm"
                        >
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quart de jour</h3>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {displayEmployees.filter(e => e.shift === 'day').length || dayShiftCount}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">08:00 - 20:00</p>
                                </div>
                                <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                                    <SunIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm"
                        >
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quart de nuit</h3>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {displayEmployees.filter(e => e.shift === 'night').length || nightShiftCount}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">20:00 - 08:00</p>
                                </div>
                                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
                                    <MoonIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl p-4 shadow-sm"
                        >
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">En congé</h3>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{onLeaveCount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Employés absents</p>
                                </div>
                                <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-lg">
                                    <UserCircleIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                        </div>
                    ) : displayEmployees.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <UserGroupIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun employé trouvé</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Ajoutez du personnel à ce projet depuis le dossier RH</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 inline-flex items-center px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors"
                            >
                                <UserPlusIcon className="h-5 w-5 mr-1" />
                                Ajouter du personnel
                            </button>
                        </div>
                    ) : (
                        /* Employee Cards */
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayEmployees.map((employee) => (
                                <motion.div
                                    key={employee._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    {employee.photo ? (
                                                        <img
                                                            src={employee.photo}
                                                            alt={employee.name}
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                            <UserCircleIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{employee.role}</p>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Actif</span>
                                                        {employee.shift && (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.shift === 'day' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'}`}>
                                                                {employee.shift === 'day' ? 'Jour' : 'Nuit'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex">
                                                <button
                                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    <ChevronRightIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Always expanded for now */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Spécialisation</h4>
                                                    <p className="text-sm text-gray-900 dark:text-white">{employee.specialization}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Position</h4>
                                                    <p className="text-sm text-gray-900 dark:text-white">{employee.position || 'Non spécifié'}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Expérience</h4>
                                                    <p className="text-sm text-gray-900 dark:text-white">{employee.experience} ans</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Heures de quart</h4>
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {employee.shiftStart && employee.shiftEnd
                                                            ? `${employee.shiftStart} - ${employee.shiftEnd}`
                                                            : 'Non assigné'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contact</h4>
                                                <p className="text-sm text-gray-900 dark:text-white">{employee.phone}</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{employee.email}</p>
                                            </div>

                                            {employee.certifications && employee.certifications.length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Certifications</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {employee.certifications.map((cert, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                            >
                                                                {cert}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-between pt-2">
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        Changer de quart
                                                    </button>
                                                </div>
                                                <button
                                                    className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Retirer l'employé"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 m-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Ajouter un employé au projet</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sélectionner un employé
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {availableEmployees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} - {emp.position || 'Employé'}
                                            </option>
                                        ))}
                                        {availableEmployees.length === 0 && (
                                            <>
                                                <option value="emp1">Hakim Ziyech - Ingénieur</option>
                                                <option value="emp2">Yassine Bounou - Technicien</option>
                                                <option value="emp3">Achraf Hakimi - Superviseur</option>
                                                <option value="emp4">Nabil Fekir - Électricien</option>
                                            </>
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rôle dans le projet
                                </label>
                                <div className="relative">
                                    <select
                                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        <option value="role1">Ingénieur projet</option>
                                        <option value="role2">Technicien</option>
                                        <option value="role3">Superviseur</option>
                                        <option value="role4">Administrateur</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quart de travail
                                </label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input type="radio" name="shift" value="day" className="form-radio text-[#F28C38]" defaultChecked />
                                        <span className="ml-2">Jour (08:00 - 20:00)</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input type="radio" name="shift" value="night" className="form-radio text-[#F28C38]" />
                                        <span className="ml-2">Nuit (20:00 - 08:00)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddEmployee}
                                className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OperationEmployees; 