import React from 'react';
import { motion } from 'framer-motion';
import { PlanType, PlanStatus } from '../../store/slices/planningSlice';

interface EquipmentData {
    _id: string;
    nom: string;
    reference: string;
    matricule: string;
    status: string;
}

interface Plan {
    _id: string;
    title: string;
    description?: string;
    type: PlanType;
    customTypeName?: string;
    equipmentId?: EquipmentData;
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
}

interface PlanningCardProps {
    plan: Plan;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export default function PlanningCard({ plan, onView, onEdit, onDelete }: PlanningCardProps) {
    // Get status color and background
    const getStatusStyles = (status: PlanStatus) => {
        switch (status) {
            case PlanStatus.COMPLETED:
                return 'bg-green-100 text-green-700';
            case PlanStatus.SCHEDULED:
                return 'bg-yellow-100 text-yellow-700';
            case PlanStatus.IN_PROGRESS:
                return 'bg-blue-100 text-blue-700';
            case PlanStatus.CANCELLED:
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

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
    const getTypeLabel = (type: PlanType, customTypeName?: string) => {
        switch (type) {
            case PlanType.PLACEMENT:
                return 'Placement';
            case PlanType.MAINTENANCE:
                return 'Maintenance';
            case PlanType.REPAIR:
                return 'Réparation';
            case PlanType.CUSTOM:
                return customTypeName || 'Personnalisé';
            default:
                return type;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl shadow-md bg-white p-5 mb-4 flex flex-col gap-2"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">{plan.title}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(plan.status)}`}>
                    {getStatusLabel(plan.status)}
                </span>
            </div>

            <div className="text-sm text-gray-500">Type: <span className="text-gray-700">{getTypeLabel(plan.type, plan.customTypeName)}</span></div>
            <div className="text-sm text-gray-500">Responsable: <span className="text-gray-700">
                {plan.responsiblePerson ?
                    (typeof plan.responsiblePerson === 'object' ?
                        plan.responsiblePerson.name :
                        plan.responsiblePerson
                    ) :
                    'Non assigné'
                }
            </span></div>
            <div className="text-sm text-gray-500">Équipement: <span className="text-gray-700">
                {plan.equipmentId ?
                    `${plan.equipmentId.nom} (${plan.equipmentId.reference})` :
                    'N/A'}
            </span></div>

            {plan.location && (
                <div className="text-sm text-gray-500">Lieu: <span className="text-gray-700">{plan.location}</span></div>
            )}

            <div className="text-sm text-gray-500">Période: <span className="text-gray-700">{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span></div>

            <div className="flex gap-2 mt-3 justify-end">
                <button
                    onClick={() => onView(plan._id)}
                    className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                    title="Voir les détails"
                >
                    👁️
                </button>
                <button
                    onClick={() => onEdit(plan._id)}
                    className="text-gray-600 hover:text-yellow-600 p-2 rounded-full hover:bg-yellow-50 transition-colors"
                    title="Modifier"
                >
                    ✏️
                </button>
                <button
                    onClick={() => onDelete(plan._id)}
                    className="text-gray-600 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Supprimer"
                >
                    🗑️
                </button>
            </div>
        </motion.div>
    );
} 