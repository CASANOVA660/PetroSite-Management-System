import React from 'react';
import { motion } from 'framer-motion';

interface Plan {
    id: string | number;
    title: string;
    type: string;
    responsible: string;
    equipment: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface PlanningCardProps {
    plan: Plan;
    onView: (id: string | number) => void;
    onEdit: (id: string | number) => void;
    onDelete: (id: string | number) => void;
}

export default function PlanningCard({ plan, onView, onEdit, onDelete }: PlanningCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl shadow-md bg-white p-5 mb-4 flex flex-col gap-2"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">{plan.title}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.status === 'Done' ? 'bg-green-100 text-green-700' : plan.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-700' : plan.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{plan.status}</span>
            </div>
            <div className="text-sm text-gray-500">Type: <span className="text-gray-700">{plan.type}</span></div>
            <div className="text-sm text-gray-500">Responsible: <span className="text-gray-700">{plan.responsible}</span></div>
            <div className="text-sm text-gray-500">Equipment: <span className="text-gray-700">{plan.equipment}</span></div>
            <div className="text-sm text-gray-500">Dates: <span className="text-gray-700">{plan.startDate} - {plan.endDate}</span></div>
            <div className="flex gap-4 mt-3 justify-end">
                <button onClick={() => onView(plan.id)} className="hover:text-blue-600" title="View">👁</button>
                <button onClick={() => onEdit(plan.id)} className="hover:text-yellow-600" title="Edit">✏️</button>
                <button onClick={() => onDelete(plan.id)} className="hover:text-red-600" title="Delete">🗑️</button>
            </div>
        </motion.div>
    );
} 