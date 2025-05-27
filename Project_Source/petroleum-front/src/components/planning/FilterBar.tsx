import React from 'react';
import { motion } from 'framer-motion';

interface Filters {
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
    equipmentId?: string;
}

interface FilterOption {
    label: string;
    value: string;
}

interface FilterBarProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
    options?: {
        status: FilterOption[];
        type: FilterOption[];
        equipment: FilterOption[];
    };
}

export default function FilterBar({ filters, onChange, options }: FilterBarProps) {
    // Default options if none provided
    const defaultOptions = {
        status: [
            { label: 'Tous les statuts', value: '' },
            { label: 'Planifié', value: 'scheduled' },
            { label: 'En cours', value: 'in_progress' },
            { label: 'Terminé', value: 'completed' },
            { label: 'Annulé', value: 'cancelled' }
        ],
        type: [
            { label: 'Tous les types', value: '' },
            { label: 'Placement', value: 'placement' },
            { label: 'Maintenance', value: 'maintenance' },
            { label: 'Réparation', value: 'repair' }
        ],
        equipment: [
            { label: 'Tous les équipements', value: '' }
        ]
    };

    // Use provided options or defaults
    const filterOptions = options || defaultOptions;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-4 items-center mb-6 bg-white p-4 rounded-xl shadow-sm"
        >
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Début:</label>
                <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={e => onChange({ ...filters, startDate: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
                />
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Fin:</label>
                <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={e => onChange({ ...filters, endDate: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
                />
            </div>

            <select
                value={filters.status || ''}
                onChange={e => onChange({ ...filters, status: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            >
                {filterOptions.status.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            <select
                value={filters.type || ''}
                onChange={e => onChange({ ...filters, type: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            >
                {filterOptions.type.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>

            <select
                value={filters.equipmentId || ''}
                onChange={e => onChange({ ...filters, equipmentId: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            >
                {filterOptions.equipment.map((option, index) => (
                    <option key={option.value || `empty-${index}`} value={option.value}>{option.label}</option>
                ))}
            </select>

            {Object.keys(filters).some(key => !!filters[key as keyof Filters]) && (
                <button
                    onClick={() => onChange({})}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
                >
                    Réinitialiser
                </button>
            )}
        </motion.div>
    );
} 