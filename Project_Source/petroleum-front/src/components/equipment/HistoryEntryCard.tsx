import React, { useState } from 'react';
import { EquipmentHistoryEntry } from '../../types/equipment';
import {
    LocationIcon,
    TimeIcon,
    PencilIcon,
    CalenderIcon,
    UserCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon
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

    // Entry color based on type
    const getEntryColor = (type: string) => {
        switch (type) {
            case 'placement': return 'border-blue-400 bg-blue-50';
            case 'operation': return 'border-purple-400 bg-purple-50';
            case 'maintenance': return 'border-orange-400 bg-orange-50';
            default: return 'border-gray-300 bg-gray-50';
        }
    };

    // Entry icon based on type
    const getEntryIcon = (type: string) => {
        switch (type) {
            case 'placement':
                return <div className="p-2 rounded-full bg-blue-100 text-blue-700"><LocationIcon className="w-5 h-5" /></div>;
            case 'operation':
                return <div className="p-2 rounded-full bg-purple-100 text-purple-700"><TimeIcon className="w-5 h-5" /></div>;
            case 'maintenance':
                return <div className="p-2 rounded-full bg-orange-100 text-orange-700"><PencilIcon className="w-5 h-5" /></div>;
            default:
                return <div className="p-2 rounded-full bg-gray-100 text-gray-700"><CalenderIcon className="w-5 h-5" /></div>;
        }
    };

    return (
        <div className={`relative ${!isLast && 'mb-8'}`}>
            {/* Timeline connector */}
            {!isFirst && <div className="absolute top-0 left-6 -translate-x-1/2 w-0.5 h-5 bg-gray-300"></div>}
            {!isLast && <div className="absolute top-12 left-6 -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>}

            <div className={`relative flex items-start p-4 border-l-4 rounded-lg shadow-sm ${getEntryColor(entry.type)}`}>
                <div className="absolute -left-6 top-4">
                    {getEntryIcon(entry.type)}
                </div>

                <div className="flex-1 ml-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center">
                                <span className="font-medium text-gray-900">
                                    {entry.type === 'placement' && 'Placement'}
                                    {entry.type === 'operation' && 'Opération'}
                                    {entry.type === 'maintenance' && 'Maintenance'}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                    {formatDate(entry.fromDate)} {entry.toDate ? `→ ${formatDate(entry.toDate)}` : ''}
                                </span>
                            </div>
                            <p className="mt-1 text-gray-700">{entry.description}</p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded"
                        >
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            {entry.location && (
                                <div className="flex items-start mb-2">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryEntryCard; 