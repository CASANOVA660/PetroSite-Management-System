import React, { useState } from 'react';
import { EquipmentHistoryEntry } from '../../types/equipment';
import {
    LocationIcon,
    TimeIcon,
    PencilIcon,
    CalenderIcon,
    UserCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    BoxCubeIcon,
    CheckCircleIcon,
    AlertIcon,
    InfoIcon
} from '../../icons';

interface HistoryEntryCardProps {
    entry: EquipmentHistoryEntry;
    isFirst?: boolean;
    isLast?: boolean;
}

const HistoryEntryCard: React.FC<HistoryEntryCardProps> = ({
    entry,
    isFirst = false,
    isLast = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Format date to readable format
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'En cours';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Entry color based on type and status
    const getEntryColor = (entry: EquipmentHistoryEntry) => {
        if (entry.isStatusChange) {
            return 'border-green-400 bg-green-50';
        }

        switch (entry.type) {
            case 'placement': return 'border-blue-400 bg-blue-50';
            case 'operation': return 'border-purple-400 bg-purple-50';
            case 'maintenance': return 'border-orange-400 bg-orange-50';
            case 'repair': return 'border-red-400 bg-red-50';
            default: return 'border-gray-300 bg-gray-50';
        }
    };

    // Entry icon based on type and status
    const getEntryIcon = (entry: EquipmentHistoryEntry) => {
        if (entry.isStatusChange) {
            return <div className="p-2 rounded-full bg-green-100 text-green-700"><CheckCircleIcon className="w-5 h-5" /></div>;
        }

        switch (entry.type) {
            case 'placement':
                return <div className="p-2 rounded-full bg-blue-100 text-blue-700"><LocationIcon className="w-5 h-5" /></div>;
            case 'operation':
                return <div className="p-2 rounded-full bg-purple-100 text-purple-700"><TimeIcon className="w-5 h-5" /></div>;
            case 'maintenance':
                return <div className="p-2 rounded-full bg-orange-100 text-orange-700"><PencilIcon className="w-5 h-5" /></div>;
            case 'repair':
                return <div className="p-2 rounded-full bg-red-100 text-red-700"><BoxCubeIcon className="w-5 h-5" /></div>;
            default:
                return <div className="p-2 rounded-full bg-gray-100 text-gray-700"><CalenderIcon className="w-5 h-5" /></div>;
        }
    };

    // Get entry title
    const getEntryTitle = (entry: EquipmentHistoryEntry) => {
        if (entry.isStatusChange) {
            return 'Changement de statut';
        }

        switch (entry.type) {
            case 'placement': return 'Placement';
            case 'operation': return 'Opération';
            case 'maintenance': return 'Maintenance';
            case 'repair': return 'Réparation';
            default: return 'Activité';
        }
    };

    // Get status badge
    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        switch (status) {
            case 'SCHEDULED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CalenderIcon className="w-3 h-3 mr-1" /> Planifiée
                </span>;
            case 'IN_PROGRESS':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <TimeIcon className="w-3 h-3 mr-1" /> En cours
                </span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" /> Terminée
                </span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertIcon className="w-3 h-3 mr-1" /> Annulée
                </span>;
            default:
                return null;
        }
    };

    // Format project name in description
    const formatProjectNameInDescription = (description: string) => {
        // Check if description contains a project name in quotes
        if (description.includes('"') && description.includes('"')) {
            // Extract the project name
            const match = description.match(/"([^"]*)"/);
            if (match && match[1]) {
                const projectName = match[1];
                // Split around the quoted project name
                const parts = description.split(`"${projectName}"`);

                // Return formatted description with highlighted project name
                return (
                    <>
                        {parts[0]}
                        <span className="font-medium text-blue-600">"{projectName}"</span>
                        {parts[1] || ''}
                    </>
                );
            }
        }
        return description;
    };

    return (
        <div className={`relative ${!isLast && 'mb-8'}`}>
            {/* Timeline connector */}
            {!isFirst && <div className="absolute top-0 left-6 -translate-x-1/2 w-0.5 h-5 bg-gray-300"></div>}
            {!isLast && <div className="absolute top-12 left-6 -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>}

            <div className={`relative flex items-start p-4 border-l-4 rounded-lg shadow-sm ${getEntryColor(entry)}`}>
                <div className="absolute -left-6 top-4">
                    {getEntryIcon(entry)}
                </div>

                <div className="flex-1 ml-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center flex-wrap gap-2">
                                <span className="font-medium text-gray-900">
                                    {getEntryTitle(entry)}
                                </span>
                                {getStatusBadge(entry.status)}
                                <span className="text-sm text-gray-500">
                                    {formatDate(entry.fromDate)} {entry.toDate ? `→ ${formatDate(entry.toDate)}` : ''}
                                </span>
                            </div>
                            <p className="mt-1 text-gray-700">
                                {entry.description ? formatProjectNameInDescription(entry.description) : 'Pas de description'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                        >
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entry.location && (
                                <div className="flex items-start">
                                    <LocationIcon className="w-4 h-4 mt-1 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Emplacement</p>
                                        <p className="text-gray-700">{entry.location}</p>
                                    </div>
                                </div>
                            )}

                            {entry.responsiblePerson && (
                                <div className="flex items-start">
                                    <UserCircleIcon className="w-4 h-4 mt-1 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Responsable</p>
                                        <p className="text-gray-700">{entry.responsiblePerson.name}</p>
                                        {entry.responsiblePerson.email && (
                                            <p className="text-sm text-gray-500">{entry.responsiblePerson.email}</p>
                                        )}
                                        {entry.responsiblePerson.phone && (
                                            <p className="text-sm text-gray-500">{entry.responsiblePerson.phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {entry.isStatusChange && (
                                <div className="flex items-start">
                                    <InfoIcon className="w-4 h-4 mt-1 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Changement de statut</p>
                                        <p className="text-gray-700">
                                            <span className="px-2 py-0.5 rounded bg-gray-100">{entry.fromStatus}</span>
                                            <span className="mx-2">→</span>
                                            <span className="px-2 py-0.5 rounded bg-gray-100">{entry.toStatus}</span>
                                        </p>
                                        {entry.reason && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Raison: {formatProjectNameInDescription(entry.reason)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {entry.createdBy && (
                                <div className="flex items-start">
                                    <UserCircleIcon className="w-4 h-4 mt-1 text-gray-500 mr-2" />
                                    <div>
                                        <p className="text-sm text-gray-500">Créé par</p>
                                        <p className="text-gray-700">
                                            {entry.createdBy.nom} {entry.createdBy.prenom}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(entry.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryEntryCard; 