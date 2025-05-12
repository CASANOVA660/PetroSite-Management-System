import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SearchParams {
    query: string;
    department: string;
    status: string;
    sortBy: string;
}

interface HRSearchFilterProps {
    searchParams: SearchParams;
    onSearchChange: (params: SearchParams) => void;
}

export default function HRSearchFilter({ searchParams, onSearchChange }: HRSearchFilterProps) {
    const [localParams, setLocalParams] = useState<SearchParams>(searchParams);
    const [showFilters, setShowFilters] = useState(false);

    // Mock data - would be replaced with data from an API
    const departments = [
        { id: 'all', name: 'Tous les départements' },
        { id: 'engineering', name: 'Ingénierie' },
        { id: 'operations', name: 'Opérations' },
        { id: 'finance', name: 'Finance' },
        { id: 'hr', name: 'Ressources Humaines' },
        { id: 'it', name: 'IT' },
        { id: 'marketing', name: 'Marketing' },
    ];

    const statuses = [
        { id: 'all', name: 'Tous les statuts' },
        { id: 'active', name: 'Actif' },
        { id: 'onleave', name: 'En congé' },
        { id: 'pending', name: 'En attente' },
        { id: 'terminated', name: 'Terminé' },
    ];

    const sortOptions = [
        { id: 'recent', name: 'Activité récente' },
        { id: 'hireDate', name: 'Date d\'embauche' },
        { id: 'name', name: 'Nom' },
        { id: 'department', name: 'Département' },
    ];

    // Update local params when parent params change
    useEffect(() => {
        setLocalParams(searchParams);
    }, [searchParams]);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedParams = { ...localParams, [name]: value };
        setLocalParams(updatedParams);
    };

    // Apply filters
    const applyFilters = () => {
        onSearchChange(localParams);
    };

    // Handle search on enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search input */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        name="query"
                        value={localParams.query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Rechercher un employé par nom, email ou ID..."
                        className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                {/* Filter toggle button */}
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <FunnelIcon className="h-5 w-5" />
                    <span className="hidden md:inline">Filtres</span>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FA812F]/10 text-xs font-medium text-[#FA812F]">
                        {Object.values(localParams).filter(val => val && val !== 'all').length - 1}
                    </span>
                </button>

                {/* Apply button */}
                <button
                    type="button"
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#FA812F] hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                    Appliquer
                </button>
            </div>

            {/* Filters section */}
            {showFilters && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {/* Department filter */}
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Département
                        </label>
                        <select
                            id="department"
                            name="department"
                            value={localParams.department}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F]"
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status filter */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Statut
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={localParams.status}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F]"
                        >
                            {statuses.map(status => (
                                <option key={status.id} value={status.id}>
                                    {status.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort by filter */}
                    <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Trier par
                        </label>
                        <div className="relative">
                            <select
                                id="sortBy"
                                name="sortBy"
                                value={localParams.sortBy}
                                onChange={handleInputChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 pl-3 pr-10 py-2 focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F] appearance-none"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                            <ArrowsUpDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
} 