import React, { useState } from 'react';
import { FilterIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from '../../icons';

export type DateFilterType = 'all' | 'past-month' | 'past-6-months' | 'past-year' | 'custom';

interface HistoryFilterPanelProps {
    dateFilter: DateFilterType;
    setDateFilter: (filter: DateFilterType) => void;
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
}

const HistoryFilterPanel: React.FC<HistoryFilterPanelProps> = ({
    dateFilter,
    setDateFilter,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    searchTerm,
    setSearchTerm,
    onApplyFilters,
    onResetFilters
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div
                className="p-4 flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-gray-700"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <FilterIcon className="w-5 h-5 mr-2 text-gray-500" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Filtres</h3>
                </div>
                {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                )}
            </div>

            {isExpanded && (
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Période
                            </label>
                            <select
                                id="dateFilter"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                            >
                                <option value="all">Tout l'historique</option>
                                <option value="past-month">Dernier mois</option>
                                <option value="past-6-months">6 derniers mois</option>
                                <option value="past-year">Dernière année</option>
                                <option value="custom">Personnalisé</option>
                            </select>
                        </div>

                        {dateFilter === 'custom' && (
                            <>
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date de début
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date de fin
                                    </label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-4">
                        <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recherche par description ou responsable
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="searchTerm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher..."
                                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38] sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={onResetFilters}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                        >
                            Réinitialiser
                        </button>
                        <button
                            onClick={onApplyFilters}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] border border-transparent rounded-md hover:bg-[#E67E2E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                        >
                            Appliquer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryFilterPanel; 