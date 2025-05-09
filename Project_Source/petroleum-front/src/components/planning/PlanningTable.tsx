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

interface PlanningTableProps {
    plans: Plan[];
    onView: (id: string | number) => void;
    onEdit: (id: string | number) => void;
    onDelete: (id: string | number) => void;
}

export default function PlanningTable({ plans, onView, onEdit, onDelete }: PlanningTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto rounded-2xl shadow bg-white"
        >
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start - End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {plans.map((plan, idx) => (
                        <tr key={plan.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50 transition'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{plan.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{plan.responsible}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{plan.equipment}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{plan.startDate} - {plan.endDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.status === 'Done' ? 'bg-green-100 text-green-700' : plan.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-700' : plan.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{plan.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex gap-2 justify-center">
                                <button onClick={() => onView(plan.id)} className="hover:text-blue-600" title="View">👁</button>
                                <button onClick={() => onEdit(plan.id)} className="hover:text-yellow-600" title="Edit">✏️</button>
                                <button onClick={() => onDelete(plan.id)} className="hover:text-red-600" title="Delete">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );
} 