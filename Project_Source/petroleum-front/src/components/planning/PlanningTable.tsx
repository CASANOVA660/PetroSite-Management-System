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

interface PlanningTableProps {
    plans: Plan[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

export default function PlanningTable({ plans, onView, onEdit, onDelete }: PlanningTableProps) {
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
            className="overflow-x-auto rounded-2xl shadow bg-white"
        >
            {plans.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan, idx) => (
                            <tr key={plan._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50 transition'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTypeLabel(plan.type, plan.customTypeName)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {plan.responsiblePerson ?
                                        (typeof plan.responsiblePerson === 'object' ?
                                            plan.responsiblePerson.name :
                                            plan.responsiblePerson
                                        ) :
                                        'Non assigné'
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {plan.equipmentId ? (
                                        <>
                                            {plan.equipmentId.nom}
                                            <span className="text-xs text-gray-500 ml-1">({plan.equipmentId.reference})</span>
                                        </>
                                    ) : (
                                        <span className="text-gray-500">N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(plan.status)}`}>
                                        {getStatusLabel(plan.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex gap-3 justify-center">
                                    <button
                                        onClick={() => onView(plan._id)}
                                        className="text-gray-600 hover:text-blue-600"
                                        title="Voir les détails"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={() => onEdit(plan._id)}
                                        className="text-gray-600 hover:text-yellow-600"
                                        title="Modifier"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => onDelete(plan._id)}
                                        className="text-gray-600 hover:text-red-600"
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center p-8">
                    <p className="text-gray-500">Aucune planification trouvée</p>
                </div>
            )}
        </motion.div>
    );
}
