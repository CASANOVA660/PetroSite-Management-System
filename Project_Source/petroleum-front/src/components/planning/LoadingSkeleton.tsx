import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
    type: 'table' | 'card' | 'form';
}

export default function LoadingSkeleton({ type }: LoadingSkeletonProps) {
    if (type === 'table') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 rounded w-full" />
                    ))}
                </div>
            </motion.div>
        );
    }
    if (type === 'card') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 w-1/3 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
            </motion.div>
        );
    }
    // form
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-6">
            <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-full" />
                ))}
            </div>
        </motion.div>
    );
} 