import React from 'react';

interface AggregationSelectorProps {
    aggregation: string;
    onChange: (aggregation: string) => void;
    groupBy: string;
    onGroupByChange: (groupBy: string) => void;
    groupByOptions: { id: string; label: string }[];
}

const aggregationOptions = [
    { id: 'sum', label: 'Somme' },
    { id: 'average', label: 'Moyenne' },
    { id: 'min', label: 'Minimum' },
    { id: 'max', label: 'Maximum' },
    { id: 'count', label: 'Nombre' },
    { id: 'percentage', label: 'Pourcentage' },
    { id: 'ratio', label: 'Ratio' },
];

const AggregationSelector: React.FC<AggregationSelectorProps> = ({ aggregation, onChange, groupBy, onGroupByChange, groupByOptions }) => {
    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-2">Méthode d'agrégation</h2>
            <div className="flex flex-wrap gap-2 mb-2">
                {aggregationOptions.map(option => (
                    <button
                        key={option.id}
                        className={`px-3 py-1 rounded border ${aggregation === option.id ? 'border-[#F28C38] bg-[#F28C38]/10' : 'border-gray-200 dark:border-gray-700 hover:border-[#F28C38]/50'}`}
                        onClick={() => onChange(option.id)}
                        type="button"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Grouper par</label>
                <select
                    className="w-full p-2 border rounded"
                    value={groupBy}
                    onChange={e => onGroupByChange(e.target.value)}
                >
                    <option value="">Aucun</option>
                    {groupByOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AggregationSelector; 