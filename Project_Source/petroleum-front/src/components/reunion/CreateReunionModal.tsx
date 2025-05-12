import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Meeting } from '../../store/slices/meetingSlice';
import { RootState } from '../../store';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchProjects } from '../../store/slices/projectSlice';

interface CreateReunionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reunion: any) => Promise<boolean | void> | boolean | void;
}

interface ExternalParticipant {
    name: string;
    email: string;
}

interface Participant {
    _id: string;
    firstName?: string;
    lastName?: string;
    nom?: string;
    prenom?: string;
    avatar?: string;
    email?: string;
    profilePicture?: string | { url: string; publicId: string };
}

export const CreateReunionModal: React.FC<CreateReunionModalProps> = ({ isOpen, onClose, onSave }) => {
    const dispatch = useDispatch();
    const { users, loading: usersLoading } = useSelector((state: RootState) => state.users);
    const { projects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
    const [processedUsers, setProcessedUsers] = useState<any[]>([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [meetLink, setMeetLink] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [externalParticipants, setExternalParticipants] = useState<ExternalParticipant[]>([]);
    const [newExternalName, setNewExternalName] = useState('');
    const [newExternalEmail, setNewExternalEmail] = useState('');
    const [showExternalForm, setShowExternalForm] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [errors, setErrors] = useState({
        title: false,
        date: false,
        time: false,
        externalEmail: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Load users and projects data when the modal opens
        if (isOpen) {
            dispatch(fetchUsers() as any);
            dispatch(fetchProjects() as any);
        }
    }, [dispatch, isOpen]);

    // Process users data when it changes
    useEffect(() => {
        if (Array.isArray(users) && users.length > 0) {
            // Log users data for debugging
            console.log('Original users data:', users);

            // Normalize the users data
            const normalizedUsers = users.map(user => {
                // Handle profilePicture object
                let avatarUrl = '';
                if (user.profilePicture && typeof user.profilePicture === 'object' && user.profilePicture.url) {
                    avatarUrl = user.profilePicture.url;
                } else if (typeof user.profilePicture === 'string') {
                    avatarUrl = user.profilePicture;
                }

                return {
                    _id: user._id,
                    nom: user.nom || '',
                    prenom: user.prenom || '',
                    email: user.email || '',
                    avatar: avatarUrl || '',
                    profilePicture: avatarUrl || '',
                    // Generate name from available fields
                    name: `${user.nom || ''} ${user.prenom || ''}`.trim() || 'Participant'
                };
            });

            console.log('Normalized users:', normalizedUsers);
            setProcessedUsers(normalizedUsers);
        } else {
            // Use fallback data if no users are available
            const fallbackUsers = [
                { _id: 'p1', nom: 'Dubois', prenom: 'Marie', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
                { _id: 'p2', nom: 'Martin', prenom: 'Jean', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
                { _id: 'p3', nom: 'Lefebvre', prenom: 'Sophie', avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
                { _id: 'p4', nom: 'Bernard', prenom: 'Thomas', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
            ];
            setProcessedUsers(fallbackUsers);
        }
    }, [users]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedDate(null);
        setMeetLink('');
        setSelectedParticipants([]);
        setExternalParticipants([]);
        setNewExternalName('');
        setNewExternalEmail('');
        setShowExternalForm(false);
        setSelectedProjectId('');
        setErrors({ title: false, date: false, time: false, externalEmail: false });
        setIsSubmitting(false);
        setShowSuccess(false);
        setSearchQuery('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const toggleParticipant = (id: string) => {
        setSelectedParticipants(prev => {
            if (prev.includes(id)) {
                return prev.filter(p => p !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const validateForm = () => {
        const newErrors = {
            title: !title.trim(),
            date: !selectedDate,
            time: !selectedDate,
            externalEmail: false
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        // Get project data if a project is selected
        const selectedProject = selectedProjectId
            ? projects.find(p => p._id === selectedProjectId)
            : null;

        const newReunion = {
            title,
            description,
            date: selectedDate,
            duration: 60, // Default duration in minutes
            participants: selectedParticipants,
            meetLink: meetLink.trim() ? meetLink : undefined,
            externalParticipants: externalParticipants.length > 0 ? externalParticipants : undefined,
            projectId: selectedProject ? selectedProject._id : undefined
        };

        console.log('Creating new meeting with data:', newReunion);

        // Show success message
        setShowSuccess(true);

        try {
            // Call onSave with meeting data
            console.log('Calling onSave with meeting data');
            const result = await onSave(newReunion);

            // If the save was successful (result is not explicitly false), close the modal after a delay
            if (result !== false) {
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                // If there was an error (result is explicitly false), reset the state to show the form again
                setShowSuccess(false);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            // Show the form again on error
            setShowSuccess(false);
            setIsSubmitting(false);
        }
    };

    const addExternalParticipant = () => {
        if (!newExternalName.trim()) return;

        // Valider l'email avec une regex simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newExternalEmail)) {
            setErrors({ ...errors, externalEmail: true });
            return;
        }

        const newParticipant: ExternalParticipant = {
            name: newExternalName.trim(),
            email: newExternalEmail.trim()
        };

        setExternalParticipants([...externalParticipants, newParticipant]);
        setNewExternalName('');
        setNewExternalEmail('');
        setErrors({ ...errors, externalEmail: false });
    };

    const removeExternalParticipant = (email: string) => {
        setExternalParticipants(externalParticipants.filter(p => p.email !== email));
    };

    const filterParticipants = (search: string) => {
        if (!search.trim()) return processedUsers;

        const searchLower = search.toLowerCase();
        return processedUsers.filter(user => {
            const userName = getParticipantName(user).toLowerCase();
            const userEmail = user.email ? user.email.toLowerCase() : '';
            return userName.includes(searchLower) || userEmail.includes(searchLower);
        });
    };

    const filteredParticipants = filterParticipants(searchQuery);

    const getParticipantName = (participant: any) => {
        if (participant.nom && participant.prenom) {
            return `${participant.nom} ${participant.prenom}`;
        }
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100000]" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Créer une Nouvelle Réunion</h2>

                    {showSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-700 mb-3">Réunion créée avec succès!</p>
                            <p className="text-sm text-gray-500 mb-6">La page sera automatiquement actualisée.</p>
                            <div className="flex justify-center">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="ex: Réunion Familiale Annuelle"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-500">Le titre est requis</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Décrivez la réunion..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'white',
                                            borderRadius: '0.375rem',
                                            borderWidth: '1px',
                                            borderColor: errors.date ? '#ef4444' : '#d1d5db',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            WebkitAppearance: 'menulist-button',
                                            appearance: 'menulist-button'
                                        }}
                                        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            if (newDate) {
                                                const newSelectedDate = selectedDate ? new Date(selectedDate) : new Date();
                                                const [year, month, day] = newDate.split('-').map(Number);
                                                newSelectedDate.setFullYear(year);
                                                newSelectedDate.setMonth(month - 1);
                                                newSelectedDate.setDate(day);
                                                setSelectedDate(newSelectedDate);
                                            } else {
                                                setSelectedDate(null);
                                            }
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {errors.date && (
                                        <p className="mt-1 text-sm text-red-500">La date est requise</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Heure <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'white',
                                            borderRadius: '0.375rem',
                                            borderWidth: '1px',
                                            borderColor: errors.time ? '#ef4444' : '#d1d5db',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            WebkitAppearance: 'menulist-button',
                                            appearance: 'menulist-button'
                                        }}
                                        value={selectedDate ?
                                            `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`
                                            : ''}
                                        onChange={(e) => {
                                            const newTime = e.target.value;
                                            if (newTime) {
                                                const newSelectedDate = selectedDate ? new Date(selectedDate) : new Date();
                                                const [hours, minutes] = newTime.split(':').map(Number);
                                                newSelectedDate.setHours(hours);
                                                newSelectedDate.setMinutes(minutes);
                                                setSelectedDate(newSelectedDate);
                                            }
                                        }}
                                    />
                                    {errors.time && (
                                        <p className="mt-1 text-sm text-red-500">L'heure est requise</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lien Google Meet
                                </label>
                                <div className="flex">
                                    <div className="flex items-center justify-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="url"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://meet.google.com/..."
                                        value={meetLink}
                                        onChange={(e) => setMeetLink(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Projet
                                </label>
                                {projectsLoading ? (
                                    <div className="w-full p-2 flex justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                    >
                                        <option value="">Sélectionner un projet (optionnel)</option>
                                        {projects.map(project => (
                                            <option key={project._id} value={project._id}>{project.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Participants
                                </label>
                                <div className="border border-gray-300 rounded-md divide-y">
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Rechercher des participants..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="max-h-36 overflow-y-auto p-1">
                                        {usersLoading ? (
                                            <div className="w-full p-4 flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            </div>
                                        ) : (
                                            filteredParticipants.map(participant => (
                                                <div
                                                    key={participant._id}
                                                    className={`flex items-center p-2 rounded-md cursor-pointer ${selectedParticipants.includes(participant._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => toggleParticipant(participant._id)}
                                                >
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            className="h-8 w-8 rounded-full"
                                                            src={getParticipantAvatar(participant)}
                                                            alt={getParticipantName(participant)}
                                                        />
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {getParticipantName(participant)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{participant.email}</p>
                                                    </div>
                                                    {selectedParticipants.includes(participant._id) && (
                                                        <div className="flex-shrink-0 ml-2">
                                                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {selectedParticipants.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedParticipants.map(id => {
                                            const participant = processedUsers.find(p => p._id === id);
                                            if (!participant) return null;

                                            return (
                                                <div
                                                    key={id}
                                                    className="inline-flex items-center bg-blue-100 text-blue-800 text-xs rounded px-2 py-1"
                                                >
                                                    <img
                                                        className="h-4 w-4 rounded-full mr-1"
                                                        src={getParticipantAvatar(participant)}
                                                        alt={getParticipantName(participant)}
                                                    />
                                                    <span>{getParticipantName(participant)}</span>
                                                    <button
                                                        type="button"
                                                        className="ml-1 focus:outline-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleParticipant(id);
                                                        }}
                                                    >
                                                        <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Participants externes
                                    </label>
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 hover:underline font-medium"
                                        onClick={() => setShowExternalForm(!showExternalForm)}
                                    >
                                        {showExternalForm ? 'Masquer' : 'Ajouter un participant externe'}
                                    </button>
                                </div>

                                {showExternalForm && (
                                    <div className="mb-3 p-3 bg-gray-50 rounded-md space-y-2">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Nom complet</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="ex: Jean Dupont"
                                                value={newExternalName}
                                                onChange={(e) => setNewExternalName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                className={`w-full px-3 py-1.5 text-sm border ${errors.externalEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="ex: jean.dupont@example.com"
                                                value={newExternalEmail}
                                                onChange={(e) => setNewExternalEmail(e.target.value)}
                                            />
                                            {errors.externalEmail && (
                                                <p className="text-xs text-red-500 mt-1">Format d'email invalide</p>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none"
                                                onClick={addExternalParticipant}
                                                disabled={!newExternalName.trim() || !newExternalEmail.trim()}
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {externalParticipants.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {externalParticipants.map((participant, index) => (
                                            <div
                                                key={index}
                                                className="inline-flex items-center bg-gray-100 text-gray-800 text-xs rounded px-2 py-1"
                                            >
                                                <svg className="h-3 w-3 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span title={participant.email}>{participant.name}</span>
                                                <button
                                                    type="button"
                                                    className="ml-1 focus:outline-none"
                                                    onClick={() => removeExternalParticipant(participant.email)}
                                                >
                                                    <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    onClick={handleClose}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Enregistrement...
                                        </>
                                    ) : 'Sauvegarder'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}; 