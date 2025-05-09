import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
    label: string;
    icon: string;
}

interface PlanningTabsProps {
    tabs: Tab[];
    activeTab: number;
    onTabChange: (idx: number) => void;
}

export default function PlanningTabs({ tabs, activeTab, onTabChange }: PlanningTabsProps) {
    return (
        <div className="flex gap-2 mb-6 relative">
            {tabs.map((tab, idx) => (
                <button
                    key={tab.label}
                    onClick={() => onTabChange(idx)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-base transition shadow-sm relative
            ${activeTab === idx ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                    style={{ zIndex: 1 }}
                >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {activeTab === idx && (
                        <motion.div
                            layoutId="tab-highlight"
                            className="absolute inset-0 rounded-xl bg-blue-100/40 z-[-1]"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
} 