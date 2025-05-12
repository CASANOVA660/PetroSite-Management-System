import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { fetchEmployees, Employee } from '../../store/slices/employeesSlice';
import { EyeIcon, DocumentTextIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Types
interface SearchParams {
    query: string;
    department: string;
    status: string;
    sortBy: string;
}

interface EmployeeTableProps {
    searchParams: SearchParams;
    onSelectEmployee: (employee: Employee) => void;
    onViewDocuments: (employee: Employee) => void;
    selectedEmployeeId?: string;
}

export default function EmployeeTable({ searchParams, onSelectEmployee, onViewDocuments, selectedEmployeeId }: EmployeeTableProps) {
    const dispatch: AppDispatch = useDispatch();
    const { employees, loading, error } = useSelector((state: RootState) => state.employees);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const employeesPerPage = 10;

    useEffect(() => {
        dispatch(fetchEmployees());
    }, [dispatch]);

    // Filter and sort employees based on search params
    const filteredEmployees = useMemo(() => {
        return employees.filter((employee: Employee) => {
            // Filter by search query
            const matchesQuery = searchParams.query === '' ||
                employee.name.toLowerCase().includes(searchParams.query.toLowerCase()) ||
                employee.email.toLowerCase().includes(searchParams.query.toLowerCase());

            // Filter by department
            const matchesDepartment = searchParams.department === '' ||
                searchParams.department === 'all' ||
                employee.department === searchParams.department;

            // Filter by status
            const matchesStatus = searchParams.status === '' ||
                searchParams.status === 'all' ||
                employee.status === searchParams.status;

            return matchesQuery && matchesDepartment && matchesStatus;
        }).sort((a: Employee, b: Employee) => {
            // Sort by selected sort option
            switch (searchParams.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'hireDate':
                    return new Date(b.hireDate || '').getTime() - new Date(a.hireDate || '').getTime();
                case 'department':
                    return (a.department || '').localeCompare(b.department || '');
                case 'recent':
                default:
                    return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
            }
        });
    }, [employees, searchParams]);

    // Pagination
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

    // Generate status badge classes
    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'onleave':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'terminated':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    // Format date to locale string
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Calculate time ago for last updated
    const getTimeAgo = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}j`;
        return `${Math.floor(diffInSeconds / 2592000)}m`;
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        document.getElementById('employee-table')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div id="employee-table" className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            {/* Table header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Employés
                    {filteredEmployees.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({filteredEmployees.length})
                        </span>
                    )}
                </h2>

            </div>

            {/* Table content */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 dark:text-red-400">
                        Erreur lors du chargement des employés: {error}
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun employé ne correspond à vos critères de recherche
                    </div>
                ) : (
                    <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Employé
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                    Contact
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                                    Poste
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                                    Dernière mise à jour
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentEmployees.map((employee: Employee) => (
                                <motion.tr
                                    key={employee._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${selectedEmployeeId === employee._id ? 'bg-[#FA812F]/10 dark:bg-[#FA812F]/20' : ''}`}
                                    onClick={() => onSelectEmployee(employee)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {employee.profileImage ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={employee.profileImage}
                                                        alt={employee.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#FA812F] to-orange-400 flex items-center justify-center text-white text-sm font-medium">
                                                        {employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {employee.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {employee.department}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                        <div className="flex flex-col">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                                <span className="truncate max-w-[150px]">{employee.email}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <PhoneIcon className="h-4 w-4 mr-1" />
                                                {employee.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                        <div className="text-sm text-gray-900 dark:text-gray-100">{employee.position}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Depuis le {formatDate(employee.hireDate)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(employee.status || '')}`}>
                                            {employee.status === 'active' && 'Actif'}
                                            {employee.status === 'onleave' && 'En congé'}
                                            {employee.status === 'pending' && 'En attente'}
                                            {employee.status === 'terminated' && 'Terminé'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                        Il y a {getTimeAgo(employee.updatedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectEmployee(employee);
                                                }}
                                                className="text-[#FA812F] hover:text-orange-600 dark:text-[#FA812F] dark:hover:text-orange-400"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDocuments(employee);
                                                }}
                                                className="text-[#FA812F] hover:text-orange-600 dark:text-[#FA812F] dark:hover:text-orange-400"
                                            >
                                                <DocumentTextIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {filteredEmployees.length > 0 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Affichage de <span className="font-medium">{indexOfFirstEmployee + 1}</span> à{' '}
                                <span className="font-medium">
                                    {Math.min(indexOfLastEmployee, filteredEmployees.length)}
                                </span>{' '}
                                sur <span className="font-medium">{filteredEmployees.length}</span> résultats
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${currentPage === 1
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="sr-only">Précédent</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                                    // Logic to show pages around current page
                                    let pageNumber: number;
                                    if (totalPages <= 5) {
                                        pageNumber = index + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + index;
                                    } else {
                                        pageNumber = currentPage - 2 + index;
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                                                ? 'z-10 bg-[#FA812F]/10 border-[#FA812F] text-[#FA812F]'
                                                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 text-sm font-medium ${currentPage === totalPages || totalPages === 0
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="sr-only">Suivant</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 