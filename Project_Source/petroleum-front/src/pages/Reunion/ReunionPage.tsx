import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMeetingsByType, Meeting, setCurrentMeeting, createMeeting } from '../../store/slices/meetingSlice';
import { NextReunion } from '../../components/reunion/NextReunion';
import { CreateReunionModal } from '../../components/reunion/CreateReunionModal';
import { ReunionDetailsModal } from '../../components/reunion/ReunionDetailsModal';
import { formatDate } from '../../utils/dateUtils';
import { fetchUsers } from '../../store/slices/userSlice';

// Project interface to handle projectId type safety
interface Project {
    _id: string;
    name: string;
}

export const ReunionPage: React.FC = () => {
    const dispatch = useDispatch();
    const { upcomingMeetings, pastMeetings, currentMeeting, loading } = useSelector((state: RootState) => state.meetings);
    const { user } = useSelector((state: RootState) => state.auth);
    const { users } = useSelector((state: RootState) => state.users); // Get all users from Redux

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        console.log('ReunionPage mounted, fetching meetings and users...');
        dispatch(fetchMeetingsByType('upcoming') as any);
        dispatch(fetchMeetingsByType('past') as any);
        dispatch(fetchUsers() as any); // Load all users to match with participants
    }, [dispatch]);

    useEffect(() => {
        console.log('Current meetings state:', { upcomingMeetings, pastMeetings });
    }, [upcomingMeetings, pastMeetings]);

    const handleCreateMeeting = () => {
        setShowCreateModal(true);
    };

    const handleMeetingDetails = (meeting: Meeting) => {
        dispatch(setCurrentMeeting(meeting));
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        dispatch(setCurrentMeeting(null));
    };

    const handleJoinMeeting = (meetLink: string | undefined) => {
        if (meetLink) {
            window.open(meetLink, '_blank');
        }
    };

    const handleSaveMeeting = async (meetingData: any) => {
        try {
            console.log('handleSaveMeeting called with data:', meetingData);
            console.log('Current user:', user);

            // Add creator field with current user's ID
            const meetingWithCreator = {
                ...meetingData,
                creator: user?._id
            };

            console.log('Creating meeting with data:', meetingWithCreator);

            // Dispatch the createMeeting action
            const result = await dispatch(createMeeting(meetingWithCreator) as any);
            console.log('createMeeting result:', result);

            // Note: We're not closing the modal here, letting the CreateReunionModal handle it

            // Refresh the meetings list
            console.log('Refreshing meetings list...');
            dispatch(fetchMeetingsByType('upcoming') as any);
            dispatch(fetchMeetingsByType('past') as any);

            return true; // Return success status
        } catch (error) {
            console.error('Error creating meeting:', error);
            return false; // Return failure status
        }
    };

    // Helper function to safely get project name
    const getProjectName = (projectId: any): string => {
        if (!projectId) return '-';
        if (typeof projectId === 'object' && projectId !== null && 'name' in projectId) {
            return projectId.name;
        }
        return '-';
    };

    // Helper function to get participant name with more fallbacks and enriched data
    const getParticipantName = (participant: any): string => {
        // First try to find the participant in the users store for additional data
        const userFromStore = users?.find(u => u._id === participant._id || u.email === participant.email);

        // Use store data if available
        if (userFromStore?.nom && userFromStore?.prenom) {
            return `${userFromStore.nom} ${userFromStore.prenom}`;
        }

        // Try participant's own data
        if (participant.nom && participant.prenom) {
            return `${participant.nom} ${participant.prenom}`;
        }
        if (participant.firstName && participant.lastName) {
            return `${participant.firstName} ${participant.lastName}`;
        }
        if (participant.name) {
            return participant.name;
        }

        // Use email if available (just the username part)
        if (participant.email) {
            return participant.email.split('@')[0];
        }

        return 'Participant';
    };

    // Helper function to get participant initials with better fallbacks
    const getParticipantInitials = (participant: any): string => {
        const name = getParticipantName(participant);
        if (name === 'Participant') return 'PA';

        // If it's an email username, capitalize first 2 letters
        if (participant.email && name === participant.email.split('@')[0]) {
            return name.substring(0, 2).toUpperCase();
        }

        // Otherwise get initials from full name
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Helper function to get participant avatar with more sources
    const getParticipantAvatar = (participant: any): string => {
        // Try to get it from the user in the Redux store first
        const userFromStore = users?.find(u => u._id === participant._id || u.email === participant.email);
        if (userFromStore?.profilePicture) {
            if (typeof userFromStore.profilePicture === 'object' && userFromStore.profilePicture.url) {
                return userFromStore.profilePicture.url;
            }
            if (typeof userFromStore.profilePicture === 'string') {
                return userFromStore.profilePicture;
            }
        }

        // Try participant's own data
        if (participant.avatar) {
            return participant.avatar;
        }
        if (participant.profilePicture) {
            if (typeof participant.profilePicture === 'object' && participant.profilePicture.url) {
                return participant.profilePicture.url;
            }
            if (typeof participant.profilePicture === 'string') {
                return participant.profilePicture;
            }
        }

        return '';
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Réunions</h1>
                <button
                    onClick={handleCreateMeeting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Nouvelle réunion
                </button>
            </div>

            {/* Next meeting section */}
            <div className="mb-8">
                <NextReunion onViewDetails={handleMeetingDetails} />
            </div>

            {/* All Meetings Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Toutes les réunions</h2>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titre
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Projet
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Participants
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {[...upcomingMeetings, ...pastMeetings].map((meeting) => (
                                    <tr key={meeting._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {meeting.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(meeting.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getProjectName(meeting.projectId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {meeting.participants.slice(0, 3).map((participant, index) => {
                                                    const avatar = getParticipantAvatar(participant);
                                                    const initials = getParticipantInitials(participant);
                                                    const name = getParticipantName(participant);

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-gray-200"
                                                            title={name}
                                                        >
                                                            {avatar ? (
                                                                <img src={avatar} alt={name} className="h-8 w-8 object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center text-gray-600 font-semibold bg-blue-100">
                                                                    {initials}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {meeting.participants.length > 3 && (
                                                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-xs font-medium text-gray-500 ring-2 ring-white">
                                                        +{meeting.participants.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${new Date(meeting.date) > new Date()
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {new Date(meeting.date) > new Date() ? 'À venir' : 'Passée'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleMeetingDetails(meeting)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Détails
                                                </button>
                                                {new Date(meeting.date) > new Date() && meeting.meetLink && (
                                                    <button
                                                        onClick={() => handleJoinMeeting(meeting.meetLink)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Rejoindre
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Past Meetings Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Réunions passées</h2>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                ) : pastMeetings.length === 0 ? (
                    <p className="text-gray-500 py-4">Aucune réunion passée</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titre
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Projet
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pastMeetings.map((meeting) => (
                                    <tr key={meeting._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {meeting.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(meeting.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getProjectName(meeting.projectId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => handleMeetingDetails(meeting)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Voir détails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateReunionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleSaveMeeting}
                />
            )}

            {showDetailsModal && currentMeeting && (
                <ReunionDetailsModal
                    isOpen={showDetailsModal}
                    onClose={handleCloseDetailsModal}
                    reunion={currentMeeting}
                />
            )}
        </div>
    );
}; 