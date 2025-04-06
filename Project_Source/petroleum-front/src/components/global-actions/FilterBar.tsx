import React from 'react';

interface FilterBarProps {
    filterStatus: 'all' | 'opened' | 'closed';
    setFilterStatus: React.Dispatch<React.SetStateAction<'all' | 'opened' | 'closed'>>;
    filterType: 'all' | 'global' | 'project';
    setFilterType: React.Dispatch<React.SetStateAction<'all' | 'global' | 'project'>>;
    view: 'table' | 'timeline';
    setView: React.Dispatch<React.SetStateAction<'table' | 'timeline'>>;
}

const FilterBar: React.FC<FilterBarProps> = ({
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    view,
    setView
}) => {
    return (
        <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setView('table')}
                    className={`px-4 py-2 rounded-md ${view === 'table' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                    Vue Tableau
                </button>
                <button
                    onClick={() => setView('timeline')}
                    className={`px-4 py-2 rounded-md ${view === 'timeline' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                    Vue Timeline
                </button>
            </div>

            <div className="flex gap-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'opened' | 'closed')}
                    className="border rounded-md px-3 py-2"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="opened">En cours</option>
                    <option value="closed">Terminées</option>
                </select>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'global' | 'project')}
                    className="border rounded-md px-3 py-2"
                >
                    <option value="all">Tous les types</option>
                    <option value="global">Actions globales</option>
                    <option value="project">Actions projet</option>
                </select>
            </div>
        </div>
    );
};

export default FilterBar; 