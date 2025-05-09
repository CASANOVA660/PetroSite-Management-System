import React from 'react';
import { motion } from 'framer-motion';

interface Filters {
    date?: string;
    status?: string;
    responsible?: string;
}

interface FilterBarProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
}

const statusOptions = [
    '', 'Upcoming', 'In Progress', 'Done', 'Overdue'
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-4 items-center mb-6"
        >
            <input
                type="date"
                value={filters.date || ''}
                onChange={e => onChange({ ...filters, date: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            />
            <select
                value={filters.status || ''}
                onChange={e => onChange({ ...filters, status: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            >
                <option value="">All Statuses</option>
                {statusOptions.filter(Boolean).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
            <input
                type="text"
                placeholder="Responsible..."
                value={filters.responsible || ''}
                onChange={e => onChange({ ...filters, responsible: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-200 outline-none"
            />
        </motion.div>
    );
} 