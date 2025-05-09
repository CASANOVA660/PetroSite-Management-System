import React from 'react';
import { motion } from 'framer-motion';

interface FloatingButtonProps {
    onClick: () => void;
}

export default function FloatingButton({ onClick }: FloatingButtonProps) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onClick}
            className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-3xl flex items-center justify-center shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
            title="Add New Plan"
        >
            +
        </motion.button>
    );
} 