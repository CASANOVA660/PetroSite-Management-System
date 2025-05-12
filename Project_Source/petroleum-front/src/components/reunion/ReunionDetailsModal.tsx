import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Meeting, updateMeeting, deleteMeeting } from '../../store/slices/meetingSlice';
import { RootState } from '../../store';
import { formatDate } from '../../utils/dateUtils';
import { Modal } from '../ui/modal';

interface ReunionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reunion: Meeting;
}

interface Note {
    id: string;
    text: string;
    date: Date;
    content?: string; // Adding content property for compatibility with API notes
}

interface Attachment {
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
}

type TabType = 'details' | 'notes' | 'attachments';

export const ReunionDetailsModal: React.FC<ReunionDetailsModalProps> = ({ isOpen, onClose, reunion }) => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state: RootState) => state.meetings);
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [newNote, setNewNote] = useState('');
    const [notes, setNotes] = useState<Note[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isNoteSaving, setIsNoteSaving] = useState(false);

    // Initialize notes and attachments from reunion if available
    React.useEffect(() => {
        if (reunion.notes && Array.isArray(reunion.notes)) {
            const formattedNotes: Note[] = reunion.notes.map((note: any) => ({
                id: note.id || note._id || `note-${Date.now()}-${Math.random()}`,
                text: note.text || note.content || '',
                date: new Date(note.date),
                content: note.content || note.text || ''
            }));
            setNotes(formattedNotes);
        }

        if (reunion.attachments && Array.isArray(reunion.attachments)) {
            const formattedAttachments: Attachment[] = reunion.attachments.map((att: any) => ({
                id: att.id || att._id || `att-${Date.now()}-${Math.random()}`,
                name: att.name || 'Fichier',
                size: att.size || '0 KB',
                type: att.type || 'application/octet-stream',
                url: att.url || '#'
            }));
            setAttachments(formattedAttachments);
        }
    }, [reunion]);

    const formatNoteDate = (date: Date | string) => {
        const dateObj = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        setIsNoteSaving(true);

        // Simulate API call
        setTimeout(() => {
            const newNoteObj: Note = {
                id: `note-${Date.now()}`,
                text: newNote,
                date: new Date(),
                content: newNote
            };

            setNotes([newNoteObj, ...notes]);
            setNewNote('');
            setIsNoteSaving(false);

            // In a real implementation, dispatch to Redux store
            // dispatch(addNoteToMeeting({ meetingId: reunion._id, note: newNoteObj }));
        }, 800);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Simulate file upload
        const newAttachments: Attachment[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const extension = file.name.split('.').pop() || '';
            let type = 'application/octet-stream';

            if (['jpg', 'jpeg', 'png', 'gif'].includes(extension.toLowerCase())) {
                type = `image/${extension.toLowerCase()}`;
            } else if (extension === 'pdf') {
                type = 'application/pdf';
            } else if (['doc', 'docx'].includes(extension.toLowerCase())) {
                type = 'application/docx';
            } else if (['xls', 'xlsx'].includes(extension.toLowerCase())) {
                type = 'application/xlsx';
            } else if (extension === 'zip') {
                type = 'application/zip';
            }

            const fileSize = file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

            newAttachments.push({
                id: `att-${Date.now()}-${i}`,
                name: file.name,
                size: fileSize,
                type,
                url: '#'
            });
        }

        setAttachments([...newAttachments, ...attachments]);

        // In a real implementation, dispatch to Redux store
        // dispatch(addAttachmentsToMeeting({ meetingId: reunion._id, attachments: newAttachments }));
    };

    const handleDeleteAttachment = (id: string) => {
        setAttachments(attachments.filter(att => att.id !== id));

        // In a real implementation, dispatch to Redux store
        // dispatch(removeAttachmentFromMeeting({ meetingId: reunion._id, attachmentId: id }));
    };

    const handleJoinMeeting = () => {
        if (reunion.meetLink) {
            window.open(reunion.meetLink, '_blank');
        }
    };

    const handleDeleteMeeting = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
            await dispatch(deleteMeeting(reunion._id) as any);
            onClose();
        }
    };

    const getParticipantName = (participant: any) => {
        if (participant.firstName && participant.lastName) {
            return `${participant.firstName} ${participant.lastName}`;
        }
        return participant.name || 'Participant';
    };

    const getParticipantAvatar = (participant: any) => {
        if (participant.avatar) {
            return participant.avatar;
        }
        if (participant.profilePicture) {
            return participant.profilePicture;
        }
        const name = getParticipantName(participant);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    };

    // Helper function to get project display name
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
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
            <div className="relative px-6 py-5">
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Détails de la réunion</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div>
                        {/* Tabs Navigation */}
                        <div className="border-b border-gray-200 mb-6">
                            <div className="flex -mb-px">
                                <button
                                    className={`mr-8 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleTabChange('details')}
                                >
                                    Informations générales
                                </button>
                                <button
                                    className={`mr-8 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleTabChange('notes')}
                                >
                                    Notes
                                </button>
                                <button
                                    className={`py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attachments'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleTabChange('attachments')}
                                >
                                    Pièces jointes
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Details Tab */}
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">{reunion.title}</h2>
                                        <p className="text-gray-600">{reunion.description}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-500 mb-2">Date et heure</h3>
                                            <div className="flex items-center text-gray-700">
                                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-lg">{formatDate(reunion.date)}</span>
                                            </div>
                                        </div>

                                        {reunion.duration && (
                                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Durée</h3>
                                                <div className="flex items-center text-gray-700">
                                                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-lg">{reunion.duration} minutes</span>
                                                </div>
                                            </div>
                                        )}

                                        {reunion.meetLink && (
                                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Visioconférence</h3>
                                                <button
                                                    onClick={handleJoinMeeting}
                                                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Rejoindre la réunion
                                                </button>
                                            </div>
                                        )}

                                        {reunion.projectId && (
                                            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Projet</h3>
                                                <div className="flex items-center text-gray-700">
                                                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="text-lg">{getProjectDisplay()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Participants</h3>
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {reunion.participants && reunion.participants.map((participant, idx) => (
                                                    <div key={participant._id || idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                                        <img
                                                            className="h-10 w-10 rounded-full mr-3 border-2 border-white shadow"
                                                            src={getParticipantAvatar(participant)}
                                                            alt={getParticipantName(participant)}
                                                        />
                                                        <span className="font-medium text-gray-700">{getParticipantName(participant)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {reunion.externalParticipants && reunion.externalParticipants.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Participants externes</h3>
                                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {reunion.externalParticipants.map((participant, idx) => (
                                                        <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                                            <img
                                                                className="h-10 w-10 rounded-full mr-3 border-2 border-white shadow"
                                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=random`}
                                                                alt={participant.name}
                                                            />
                                                            <div>
                                                                <span className="font-medium text-gray-700 block">{participant.name}</span>
                                                                {participant.email && (
                                                                    <span className="text-gray-500 text-sm">{participant.email}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <div className="space-y-6">
                                    {reunion.notes && reunion.notes.length > 0 ? (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes de réunion</h3>
                                            <div className="space-y-4">
                                                {reunion.notes.map((note: any, idx) => (
                                                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                                        <p className="text-gray-700 whitespace-pre-line">
                                                            {note.content || note.text}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-500">Aucune note disponible</h3>
                                            <p className="mt-1 text-sm text-gray-500">Les notes seront affichées ici une fois ajoutées.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Attachments Tab */}
                            {activeTab === 'attachments' && (
                                <div className="space-y-6">
                                    {reunion.attachments && reunion.attachments.length > 0 ? (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pièces jointes</h3>
                                            <div className="space-y-2">
                                                {reunion.attachments.map((attachment: any, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        <span className="text-blue-600 font-medium">{attachment.name || `Pièce jointe ${idx + 1}`}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-500">Aucune pièce jointe</h3>
                                            <p className="mt-1 text-sm text-gray-500">Les fichiers associés à cette réunion apparaîtront ici.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer with actions */}
                        <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
                            <button
                                onClick={handleDeleteMeeting}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Supprimer
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}; 