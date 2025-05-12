import React from 'react';
import { Meeting } from '../../store/slices/meetingSlice';
import { formatDate } from '../../utils/dateUtils';

interface ReunionCardProps {
    reunion: Meeting;
    onJoin?: () => void;
    onViewDetails?: () => void;
    compact?: boolean;
}

export const ReunionCard: React.FC<ReunionCardProps> = ({
    reunion,
    onJoin,
    onViewDetails,
    compact = false
}) => {
    const truncateDescription = (text?: string, maxLength: number = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const getParticipantName = (participant: any) => {
        // Handle different participant formats
        if (participant.firstName && participant.lastName) {
            return `${participant.firstName} ${participant.lastName}`;
        }
        return participant.name || 'Participant';
    };

    const getParticipantAvatar = (participant: any) => {
        // Handle different avatar formats
        if (participant.avatar) {
            return participant.avatar;
        }
        if (participant.profilePicture) {
            return participant.profilePicture;
        }
        // Generate avatar from name if available
        const name = getParticipantName(participant);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    };

    // Handle displaying project name from projectId
    const getProjectDisplay = () => {
        if (!reunion.projectId) return '';

        // Using any to bypass type checking
        const projectId: any = reunion.projectId;

        if (typeof projectId === 'object' && projectId !== null) {
            return projectId.name || 'Projet sans nom';
        }

        // If it's a string or another primitive
        return String(projectId);
    };

    return (
        <div className={`bg-white rounded-lg ${!compact ? 'border border-gray-200' : ''} overflow-hidden transition-all duration-200 hover:shadow-md`}>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">{reunion.title}</h3>

                <div className="flex flex-col space-y-3">
                    <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(reunion.date)}</span>
                    </div>

                    {reunion.projectId && (
                        <div className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-gray-700">
                                Projet: {getProjectDisplay()}
                            </span>
                        </div>
                    )}

                    <div className="text-gray-600">
                        {truncateDescription(reunion.description, compact ? 80 : 150)}
                    </div>

                    <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-2">Participants:</p>
                        <div className="flex -space-x-2 overflow-hidden">
                            {reunion.participants && reunion.participants.slice(0, 5).map((participant, idx) => (
                                <img
                                    key={participant._id || idx}
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                                    src={getParticipantAvatar(participant)}
                                    alt={getParticipantName(participant)}
                                    title={getParticipantName(participant)}
                                />
                            ))}
                            {reunion.participants && reunion.participants.length > 5 && (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white text-xs font-medium text-gray-500">
                                    +{reunion.participants.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex space-x-2">
                    {reunion.meetLink && onJoin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin();
                            }}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Rejoindre
                        </button>
                    )}

                    {onViewDetails && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails();
                            }}
                            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Détails
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}; 