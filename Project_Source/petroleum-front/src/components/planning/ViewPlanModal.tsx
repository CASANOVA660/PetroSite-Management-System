import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanType, PlanStatus } from '../../store/slices/planningSlice';

interface EquipmentData {
    _id: string;
    nom: string;
    reference: string;
    matricule: string;
    status: string;
}

interface Plan {
    _id?: string;
    title: string;
    description?: string;
    type: PlanType;
    equipmentId: EquipmentData;
    responsiblePerson?: {
        name: string;
        email?: string;
        phone?: string;
        userId?: string;
    };
    location?: string;
    startDate: string;
    endDate: string;
    status: PlanStatus;
    notes?: string;
    activityId?: string;
    createdBy?: any;
    updatedBy?: any;
    createdAt?: string;
    updatedAt?: string;
}

interface ViewPlanModalProps {
    open: boolean;
    onClose: () => void;
    plan?: Plan;
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status display label
const getStatusLabel = (status: PlanStatus) => {
    switch (status) {
        case PlanStatus.COMPLETED:
            return 'Terminé';
        case PlanStatus.SCHEDULED:
            return 'Planifié';
        case PlanStatus.IN_PROGRESS:
            return 'En cours';
        case PlanStatus.CANCELLED:
            return 'Annulé';
        default:
            return status;
    }
};

// Get type display label
const getTypeLabel = (type: PlanType) => {
    switch (type) {
        case PlanType.PLACEMENT:
            return 'Placement';
        case PlanType.MAINTENANCE:
            return 'Maintenance';
        case PlanType.REPAIR:
            return 'Réparation';
        default:
            return type;
    }
};

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
                        <div className="text-2xl font-bold text-gray-800 mb-2 text-center">Détails de la planification</div>

                        <div className="flex items-center justify-center mb-2">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold 
                                ${plan.status === PlanStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                    plan.status === PlanStatus.SCHEDULED ? 'bg-yellow-100 text-yellow-700' :
                                        plan.status === PlanStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'}`}>
                                {getStatusLabel(plan.status)}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Titre</span>
                                <span className="text-gray-900 col-span-2">{plan.title}</span>
                            </div>

                            {plan.description && (
                                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                    <span className="font-semibold text-gray-700">Description</span>
                                    <span className="text-gray-900 col-span-2">{plan.description}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Type</span>
                                <span className="text-gray-900 col-span-2">{getTypeLabel(plan.type)}</span>
                            </div>

                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Équipement</span>
                                <div className="text-gray-900 col-span-2">
                                    <div>{plan.equipmentId.nom}</div>
                                    <div className="text-sm text-gray-500">Référence: {plan.equipmentId.reference}</div>
                                    <div className="text-sm text-gray-500">Matricule: {plan.equipmentId.matricule}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Responsable</span>
                                <span className="text-gray-900 col-span-2">
                                    {plan.responsiblePerson ?
                                        (typeof plan.responsiblePerson === 'object' ?
                                            plan.responsiblePerson.name :
                                            plan.responsiblePerson
                                        ) :
                                        'Non assigné'
                                    }
                                </span>
                            </div>

                            {plan.location && (
                                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                    <span className="font-semibold text-gray-700">Lieu</span>
                                    <span className="text-gray-900 col-span-2">{plan.location}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Date de début</span>
                                <span className="text-gray-900 col-span-2">{formatDate(plan.startDate)}</span>
                            </div>

                            <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                <span className="font-semibold text-gray-700">Date de fin</span>
                                <span className="text-gray-900 col-span-2">{formatDate(plan.endDate)}</span>
                            </div>

                            {plan.notes && (
                                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                    <span className="font-semibold text-gray-700">Remarques</span>
                                    <span className="text-gray-900 col-span-2">{plan.notes}</span>
                                </div>
                            )}

                            {plan.createdBy && (
                                <div className="grid grid-cols-3 border-b border-gray-100 py-2">
                                    <span className="font-semibold text-gray-700">Créé par</span>
                                    <span className="text-gray-900 col-span-2">
                                        {typeof plan.createdBy === 'object' && plan.createdBy.nom ?
                                            `${plan.createdBy.nom} ${plan.createdBy.prenom || ''}` :
                                            plan.createdBy}
                                        {plan.createdAt && ` le ${formatDate(plan.createdAt)}`}
                                    </span>
                                </div>
                            )}

                            {plan.updatedBy && (
                                <div className="grid grid-cols-3 py-2">
                                    <span className="font-semibold text-gray-700">Modifié par</span>
                                    <span className="text-gray-900 col-span-2">
                                        {typeof plan.updatedBy === 'object' && plan.updatedBy.nom ?
                                            `${plan.updatedBy.nom} ${plan.updatedBy.prenom || ''}` :
                                            plan.updatedBy}
                                        {plan.updatedAt && ` le ${formatDate(plan.updatedAt)}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center mt-4">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md"
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
