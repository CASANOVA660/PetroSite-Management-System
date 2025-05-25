import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
    _id?: string;
    title: string;
    description: string;
    type: 'placement' | 'maintenance';
    equipment: string | { nom: string };
    responsible: string;
    route: string[];
    startDate: string;
    endDate: string;
    notes?: string;
}

interface ViewPlanModalProps {
    open: boolean;
    onClose: () => void;
    plan?: Plan;
}

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
}

export default function ViewPlanModal({ open, onClose, plan }: ViewPlanModalProps) {
    if (!plan) return null;
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 40 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-2 p-8 relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto border border-blue-100"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-all">✕</button>
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">Détails du Plan</div>
                        <div className="flex flex-col gap-3">
                            <div>
                                <span className="font-semibold text-gray-700">Titre : </span>
                                <span className="text-gray-900">{plan.title}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Description : </span>
                                <span className="text-gray-900">{plan.description}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Type : </span>
                                <span className="text-gray-900 capitalize">{plan.type}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Équipement : </span>
                                <span className="text-gray-900">{typeof plan.equipment === 'object' ? plan.equipment.nom : plan.equipment}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Responsable : </span>
                                <span className="text-gray-900">{plan.responsible}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Itinéraire : </span>
                                <span className="text-gray-900">{plan.route && plan.route.length > 0 ? plan.route.join(' → ') : '-'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Date de début : </span>
                                <span className="text-gray-900">{formatDate(plan.startDate)}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">Date de fin : </span>
                                <span className="text-gray-900">{formatDate(plan.endDate)}</span>
                            </div>
                            {plan.notes && (
                                <div>
                                    <span className="font-semibold text-gray-700">Remarques : </span>
                                    <span className="text-gray-900">{plan.notes}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
