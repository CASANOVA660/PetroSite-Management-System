import React from 'react';
import { motion } from 'framer-motion';

interface SummaryCard {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string; // Tailwind color class
}

interface SummaryCardsProps {
    cards: SummaryCard[];
    onCardClick?: (idx: number) => void;
}

export default function SummaryCards({ cards, onCardClick }: SummaryCardsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
            {cards.map((card, idx) => (
                <button
                    key={card.label}
                    onClick={() => onCardClick && onCardClick(idx)}
                    className={`flex flex-col items-start gap-2 p-5 rounded-2xl shadow-md bg-white hover:shadow-lg transition border-2 border-transparent hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100 group`}
                >
                    <span className={`text-2xl ${card.color}`}>{card.icon}</span>
                    <span className="text-lg font-semibold text-gray-900">{card.value}</span>
                    <span className="text-sm text-gray-500 group-hover:text-blue-600 transition">{card.label}</span>
                </button>
            ))}
        </motion.div>
    );
} 