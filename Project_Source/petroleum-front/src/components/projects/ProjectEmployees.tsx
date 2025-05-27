import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { PlusIcon, UserIcon, ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useModalContext } from '../../context/ModalContext';

interface Employee {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    profileImage?: string;
}

interface ProjectEmployee {
    _id?: string;
    employeeId: Employee;
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

interface Props {
    projectId: string;
}

const ProjectEmployees = ({ projectId }: Props) => {
    const [employees, setEmployees] = useState<ProjectEmployee[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const user = useSelector((state: any) => state.auth.user);
    const { setModalOpen } = useModalContext();

    // Common predefined roles
    const commonRoles = [
        'Ingénieur projet',
        'Technicien',
        'Superviseur',
        'Administrateur',
        'Manager',
        'Consultant'
    ];

    // Custom role input
    const [customRole, setCustomRole] = useState('');
    const [showCustomRole, setShowCustomRole] = useState(false);

    useEffect(() => {
        setModalOpen(showAddModal);
        return () => setModalOpen(false);
    }, [showAddModal, setModalOpen]);

    useEffect(() => {
        if (projectId) {
            fetchProjectEmployees();
            fetchAvailableEmployees();
        }
    }, [projectId]);

    const fetchProjectEmployees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/projects/${projectId}/employees`);
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching project employees:', error);
            toast.error('Erreur lors du chargement des employés du projet');
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
            toast.error('Erreur lors du chargement des employés disponibles');
        }
    };

    const handleAssignEmployee = async () => {
        if (!selectedEmployee) {
            toast.error('Veuillez sélectionner un employé');
            return;
        }

        if (!role && !customRole) {
            toast.error('Veuillez sélectionner ou saisir un rôle');
            return;
        }

        const finalRole = showCustomRole ? customRole : role;

        try {
            await axios.post(`/projects/${projectId}/employees`, {
                employeeId: selectedEmployee,
                role: finalRole
            });
            toast.success('Employé ajouté au projet avec succès');
            setShowAddModal(false);
            setSelectedEmployee('');
            setRole('');
            setCustomRole('');
            setShowCustomRole(false);
            fetchProjectEmployees();
        } catch (error) {
            console.error('Error assigning employee:', error);
            toast.error('Erreur lors de l\'ajout de l\'employé au projet');
        }
    };

    const handleRemoveEmployee = async (employeeId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir retirer cet employé du projet ?')) {
            try {
                await axios.delete(`/projects/${projectId}/employees/${employeeId}`);
                toast.success('Employé retiré du projet avec succès');
                fetchProjectEmployees();
            } catch (error) {
                console.error('Error removing employee:', error);
                toast.error('Erreur lors du retrait de l\'employé du projet');
            }
        }
    };

    const handleSetOperational = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir passer tous les employés assignés à "En opération" ?')) {
            try {
                await axios.put(`/projects/${projectId}/employees/operational/all`);
                toast.success('Statut des employés mis à jour avec succès');
                fetchProjectEmployees();
            } catch (error) {
                console.error('Error updating employees status:', error);
                toast.error('Erreur lors de la mise à jour du statut des employés');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Assigné':
                return 'bg-yellow-100 text-yellow-800';
            case 'En opération':
                return 'bg-green-100 text-green-800';
            case 'Terminé':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 bg-white rounded-xl shadow-sm"
        >
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Équipe du projet</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Ajouter un employé
                    </button>
                    {employees.some(emp => emp.status === 'Assigné') && (
                        <button
                            onClick={handleSetOperational}
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <CheckIcon className="h-5 w-5 mr-1" />
                            Démarrer l'opération
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : employees.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <UserIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                        Aucun employé n'a encore été assigné à ce projet.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Ajouter un employé
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné par</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map((employee) => (
                                <tr key={employee.employeeId._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {employee.employeeId.profileImage ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full"
                                                        src={employee.employeeId.profileImage}
                                                        alt={employee.employeeId.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-gray-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{employee.employeeId.name}</div>
                                                <div className="text-sm text-gray-500">{employee.employeeId.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{employee.role}</div>
                                        {employee.employeeId.position && (
                                            <div className="text-xs text-gray-500">{employee.employeeId.position}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                                            {employee.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.assignedBy?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleRemoveEmployee(employee.employeeId._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Retirer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner un employé</option>
                                        {availableEmployees.map((employee) => (
                                            <option key={employee._id} value={employee._id}>
                                                {employee.name} - {employee.position || 'Employé'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {!showCustomRole ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rôle dans le projet
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Sélectionner un rôle</option>
                                                {commonRoles.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowCustomRole(true)}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Ajouter un rôle personnalisé
                                    </button>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rôle personnalisé
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={customRole}
                                            onChange={(e) => setCustomRole(e.target.value)}
                                            placeholder="Saisir un rôle personnalisé"
                                            className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                setShowCustomRole(false);
                                                setCustomRole('');
                                            }}
                                            className="p-2 text-gray-400 hover:text-gray-600"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAssignEmployee}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Ajouter
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default ProjectEmployees; 