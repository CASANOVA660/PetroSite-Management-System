import React, { useState, useEffect, useRef } from 'react';
import {
    XMarkIcon,
    CalendarIcon,
    TagIcon,
    ChatBubbleLeftRightIcon,
    FaceSmileIcon,
    PaperClipIcon,
    LinkIcon,
    BoltIcon,
    FireIcon
} from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { updateTask } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    task?: any;
}

const statusOptions = [
    { id: 'todo', name: 'À faire', color: 'bg-gray-200' },
    { id: 'inProgress', name: 'En cours', color: 'bg-blue-200' },
    { id: 'inReview', name: 'En revue', color: 'bg-yellow-200' },
    { id: 'done', name: 'Terminé', color: 'bg-green-200' }
];

const priorityOptions = [
    { id: 'high', name: 'Haute priorité', color: 'bg-red-100 text-red-600' },
    { id: 'medium', name: 'Priorité moyenne', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'low', name: 'Priorité basse', color: 'bg-blue-100 text-blue-600' }
];

const formatDate = (dateString: string) => {
    if (!dateString) return 'Non défini';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return 'Date invalide';
    }
};

const panelStyles: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
    zIndex: 100000,
    overflowY: 'auto',
    padding: '24px',
    opacity: 1
};

const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999
};

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ isOpen, onClose, task }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Comments');
    const panelRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        if (task?._id) {
            setComments([
                {
                    id: 1,
                    user: { name: 'Ethan Carter', avatar: 'https://ui-avatars.com/api/?name=Ethan+Carter&background=random' },
                    text: "Hey @Sam! I've updated the wireframes and left some notes on Figma. Let me know your thoughts. Thanks!",
                    timestamp: new Date(Date.now() - 3 * 60 * 1000),
                    reactions: []
                },
                {
                    id: 2,
                    user: { name: 'Sam', avatar: 'https://ui-avatars.com/api/?name=Sam&background=random' },
                    text: "Got it! I'll review and provide feedback by tomorrow. 🚀",
                    timestamp: new Date(Date.now() - 2 * 60 * 1000),
                    reactions: [{ emoji: '🔥', count: 1 }, { emoji: '⚡', count: 1 }]
                }
            ]);
        }
    }, [task?._id]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleStatusChange = async (newStatus: string) => {
        try {
            await dispatch(updateTask({ ...task, status: newStatus }));
            setStatusDropdownOpen(false);
        } catch (err) {
            console.error('Erreur lors du changement de statut', err);
        }
    };

    const handleCommentSubmit = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setComments([
            ...comments,
            {
                id: Date.now(),
                user: { name: 'Moi', avatar: 'https://ui-avatars.com/api/?name=Moi&background=random' },
                text: commentText,
                timestamp: new Date(),
                reactions: []
            }
        ]);
        setCommentText('');
    };

    const handleAddReaction = (commentId: number, emoji: string) => {
        setComments(comments.map(comment => {
            if (comment.id === commentId) {
                const existingReaction = comment.reactions.find((r: any) => r.emoji === emoji);
                if (existingReaction) {
                    return {
                        ...comment,
                        reactions: comment.reactions.map((r: any) =>
                            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                        )
                    };
                } else {
                    return {
                        ...comment,
                        reactions: [...comment.reactions, { emoji, count: 1 }]
                    };
                }
            }
            return comment;
        }));
    };

    const getCurrentStatus = () => {
        return statusOptions.find(option => option.id === task.status) || statusOptions[0];
    };

    return (
        <>
            <div style={backdropStyles} onClick={handleBackdropClick} />
            <div ref={panelRef} className="task-detail-panel" style={panelStyles}>
                <div className="flex flex-col h-full">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                        style={{ zIndex: 100001 }}
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{task.title}</h2>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Assigné à: </span>
                            <span>Ethan Carter</span>
                            <span className="mx-2">|</span>
                            <span className="font-medium">Suivi par: </span>
                            <span>Moi</span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">Statut</div>
                        <div className="relative">
                            <button
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm ${getCurrentStatus().color}`}
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            >
                                <span>{getCurrentStatus().name}</span>
                                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {statusDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" style={{ zIndex: 100001 }}>
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        {statusOptions.map(option => (
                                            <button
                                                key={option.id}
                                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${option.id === task.status ? 'bg-gray-50' : ''}`}
                                                onClick={() => handleStatusChange(option.id)}
                                            >
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">Date d'échéance</div>
                        <div className="flex items-center">
                            <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-800">
                                {task.endDate ? formatDate(task.endDate) : '22 mai 2025'}
                            </span>
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">Étiquettes</div>
                        <div className="flex flex-wrap gap-2">
                            {priorityOptions.map(option => (
                                <span
                                    key={option.id}
                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${option.color}`}
                                >
                                    {option.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
                        <div className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {task.description || "Le formulaire de connexion doit inclure un lien 'Mot de passe oublié' et garantir la validation des entrées utilisateur. Prendre en compte l'accessibilité et s'assurer que tous les messages d'erreur sont clairs et concis."}
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex border-b border-gray-200">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Comments' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('Comments')}
                            >
                                Commentaires <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{comments.length}</span>
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Files' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('Files')}
                            >
                                Fichiers
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Progress' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                onClick={() => setActiveTab('Progress')}
                            >
                                Progrès
                            </button>
                        </div>
                        <div className="mt-4">
                            {activeTab === 'Comments' && (
                                <div>
                                    <div className="mb-6">
                                        <textarea
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            placeholder="Ajouter un commentaire..."
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none bg-gray-50"
                                            rows={3}
                                        />
                                        <div className="flex justify-between items-center mt-2 bg-gray-50 p-2 rounded-b-lg border border-t-0">
                                            <div className="flex space-x-2">
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <span className="font-bold text-sm">B</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <span className="italic text-sm">I</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <span className="line-through text-sm">S</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <PaperClipIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <LinkIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200">
                                                    <FaceSmileIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleCommentSubmit}
                                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                                            >
                                                Publier
                                            </button>
                                        </div>
                                    </div>
                                    {comments.length > 0 && (
                                        <div className="space-y-4">
                                            {comments.map(comment => (
                                                <div key={comment.id} className="flex items-start">
                                                    <img
                                                        src={comment.user.avatar}
                                                        alt={comment.user.name}
                                                        className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1">
                                                            <span className="font-medium text-sm text-gray-800 mr-2">{comment.user.name}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDistanceToNow(new Date(comment.timestamp), { locale: fr, addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-700">{comment.text}</p>
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            {comment.reactions.map((reaction: any, index: number) => (
                                                                <button
                                                                    key={index}
                                                                    className="flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200"
                                                                >
                                                                    <span className="mr-1">{reaction.emoji}</span>
                                                                    <span>{reaction.count}</span>
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => handleAddReaction(comment.id, '🔥')}
                                                                className="p-1 rounded hover:bg-gray-100"
                                                            >
                                                                <FireIcon className="w-4 h-4 text-gray-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddReaction(comment.id, '⚡')}
                                                                className="p-1 rounded hover:bg-gray-100"
                                                            >
                                                                <BoltIcon className="w-4 h-4 text-gray-500" />
                                                            </button>
                                                            <button className="text-xs text-gray-500 hover:text-gray-700 ml-2">
                                                                Répondre
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'Files' && (
                                <div className="text-sm text-gray-600">
                                    Aucun fichier pour le moment.
                                </div>
                            )}
                            {activeTab === 'Progress' && (
                                <div className="text-sm text-gray-600">
                                    Progrès: {task?.progress || 0}%
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                        <div
                                            className="bg-blue-500 h-2.5 rounded-full"
                                            style={{ width: `${task?.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaskDetailPanel;