import React from 'react';

interface DataSourceOption {
    id: string;
    name: string;
    description?: string;
}

interface DataSourcePickerProps {
    options: DataSourceOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

const DataSourcePicker: React.FC<DataSourcePickerProps> = ({ options, selected, onChange }) => {
    const handleToggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-2">Sélectionnez les sources de données</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map(option => (
                    <button
                        key={option.id}
                        className={`flex items-center p-3 rounded-lg border transition-all w-full ${selected.includes(option.id) ? 'border-[#F28C38] bg-[#F28C38]/10' : 'border-gray-200 dark:border-gray-700 hover:border-[#F28C38]/50'}`}
                        onClick={() => handleToggle(option.id)}
                        type="button"
                    >
                        <span className={`w-4 h-4 mr-3 rounded-full border-2 ${selected.includes(option.id) ? 'border-[#F28C38] bg-[#F28C38]' : 'border-gray-300 bg-white'}`}></span>
                        <div className="text-left">
                            <div className="font-medium text-gray-900 dark:text-white">{option.name}</div>
                            {option.description && <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DataSourcePicker; 