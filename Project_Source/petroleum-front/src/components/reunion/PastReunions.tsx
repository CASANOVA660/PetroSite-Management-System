import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Meeting } from '../../store/slices/meetingSlice';
import { ReunionCard } from './ReunionCard';

interface PastReunionsProps {
    onViewDetails: (reunion: Meeting) => void;
}

export const PastReunions: React.FC<PastReunionsProps> = ({ onViewDetails }) => {
    const { pastMeetings, loading } = useSelector((state: RootState) => state.meetings);

    if (loading && pastMeetings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Réunions passées</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (pastMeetings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Réunions passées</h2>
                <p className="text-gray-500 py-4">Aucune réunion passée</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Réunions passées</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastMeetings.map((meeting) => (
                    <div key={meeting._id} className="transition-all duration-200 hover:transform hover:scale-[1.01]">
                        <ReunionCard
                            reunion={meeting}
                            onViewDetails={() => onViewDetails(meeting)}
                            compact={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}; 