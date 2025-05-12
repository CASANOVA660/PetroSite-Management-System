import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { formatDate } from '../../utils/dateUtils';
import { Meeting, setCurrentMeeting } from '../../store/slices/meetingSlice';
import { ReunionCard } from './ReunionCard';

interface NextReunionProps {
    onViewDetails?: (meeting: Meeting) => void;
}

export const NextReunion: React.FC<NextReunionProps> = ({ onViewDetails }) => {
    const dispatch = useDispatch();
    const { upcomingMeetings, loading } = useSelector((state: RootState) => state.meetings);

    const handleJoinMeeting = (meetLink: string | undefined) => {
        if (meetLink) {
            window.open(meetLink, '_blank');
        }
    };

    if (loading && upcomingMeetings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Prochaine réunion</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (upcomingMeetings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Prochaine réunion</h2>
                <p className="text-gray-500 py-4">Aucune réunion à venir</p>
            </div>
        );
    }

    // Get the next meeting (first in the upcoming list)
    const nextMeeting = upcomingMeetings[0];

    const handleViewDetails = (meeting: Meeting) => {
        // First set the current meeting in redux store
        dispatch(setCurrentMeeting(meeting));

        // Then call the parent component's handler to show the modal
        if (onViewDetails) {
            onViewDetails(meeting);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Prochaine réunion</h2>
            <ReunionCard
                reunion={nextMeeting}
                onJoin={() => handleJoinMeeting(nextMeeting.meetLink)}
                onViewDetails={() => handleViewDetails(nextMeeting)}
            />
        </div>
    );
}; 