import React, { useState } from 'react';

interface FilterBarProps {
    filterStatus: 'all' | 'opened' | 'closed';
    setFilterStatus: React.Dispatch<React.SetStateAction<'all' | 'opened' | 'closed'>>;
    filterType: 'all' | 'global' | 'project';
    setFilterType: React.Dispatch<React.SetStateAction<'all' | 'global' | 'project'>>;
    view: 'table' | 'timeline' | 'gantt';
    setView: React.Dispatch<React.SetStateAction<'table' | 'timeline' | 'gantt'>>;
}

const FilterBar: React.FC<FilterBarProps> = ({
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    view,
    setView
}) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white rounded-full shadow-md border border-gray-200 p-3 transition-all duration-300 hover:shadow-lg">
            {/* Status Filter */}
            <div className="relative">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'opened' | 'closed')}
                    className="appearance-none border border-gray-200 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-gray-50 to-teal-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="opened">En cours</option>
                    <option value="closed">Terminées</option>
                </select>
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">▼</span>
            </div>

            {/* Type Filter */}
            <div className="relative">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'global' | 'project')}
                    className="appearance-none border border-gray-200 rounded-full px-4 py-2 text-sm bg-gradient-to-r from-gray-50 to-teal-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 hover:bg-orange-50"
                >
                    <option value="all">Tous les types</option>
                    <option value="global">Actions globales</option>
                    <option value="project">Actions projet</option>
                </select>
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">▼</span>
            </div>

        </div>
    );
};

export default FilterBar;