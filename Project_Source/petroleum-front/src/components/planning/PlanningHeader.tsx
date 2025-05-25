import React from 'react';
import { motion } from 'framer-motion';

interface PlanningHeaderProps {
    onNewPlan: () => void;
    onSearch: (value: string) => void;
}

export default function PlanningHeader({ onNewPlan, onSearch }: PlanningHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-8"
        >
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Plannification Tableau de bord</h1>
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Rechercher une planification..."
                    onChange={e => onSearch(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-gray-700 text-base shadow-sm transition"
                />
                <button
                    onClick={onNewPlan}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
                >
                    + Nouvelle planification
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl text-gray-500 cursor-pointer">👤</div>
            </div>
        </motion.div>
    );
} 