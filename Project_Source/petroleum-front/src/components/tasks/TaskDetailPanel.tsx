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
    FireIcon,
    DocumentIcon,
    TrashIcon,
    ChevronDownIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { updateTask } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    task?: any;
}

interface FileItem {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
}

interface Subtask {
    id: string;
    text: string;
    completed: boolean;
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
    padding: '24px'
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
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState<{ [key: string]: number }>({});
    const [progress, setProgress] = useState(task?.progress || 0);
    const panelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        if (task?._id) {
            // Mock comments
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

            // Mock files (replace with your file data)
            setFiles([
                {
                    id: '1',
                    name: 'wireframes.pdf',
                    type: 'application/pdf',
                    size: 2457600,
                    uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    url: 'https://example.com/wireframes.pdf'
                },
                {
                    id: '2',
                    name: 'screenshot.png',
                    type: 'image/png',
                    size: 512000,
                    uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                    url: 'https://example.com/screenshot.png'
                }
            ]);

            // Sync progress
            setProgress(task?.progress || 0);
        }
    }, [task?._id, task?.progress]);

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

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles) return;

        Array.from(uploadedFiles).forEach(file => {
            const fileId = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [fileId]: 0 }));

            // Mock upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploading(prev => ({ ...prev, [fileId]: progress }));
                if (progress >= 100) {
                    clearInterval(interval);
                    setFiles(prev => [
                        ...prev,
                        {
                            id: fileId,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            url: URL.createObjectURL(file) // Mock URL
                        }
                    ]);
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[fileId];
                        return newUploading;
                    });
                }
            }, 200);
        });
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const uploadedFiles = event.dataTransfer.files;
        if (!uploadedFiles) return;

        Array.from(uploadedFiles).forEach(file => {
            const fileId = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [fileId]: 0 }));

            // Mock upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploading(prev => ({ ...prev, [fileId]: progress }));
                if (progress >= 100) {
                    clearInterval(interval);
                    setFiles(prev => [
                        ...prev,
                        {
                            id: fileId,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            url: URL.createObjectURL(file) // Mock URL
                        }
                    ]);
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[fileId];
                        return newUploading;
                    });
                }
            }, 200);
        });
    };

    const handleDeleteFile = (fileId: string) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
            setFiles(prev => prev.filter(file => file.id !== fileId));
        }
    };

    const handleProgressUpdate = async (newProgress: number) => {
        setProgress(newProgress);
        try {
            await dispatch(updateTask({ ...task, progress: newProgress }));
        } catch (err) {
            console.error('Erreur lors de la mise à jour du progrès', err);
        }
    };

    const handleSubtaskToggle = async (subtaskId: string) => {
        const updatedSubtasks = (task.subtasks || []).map((subtask: Subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        try {
            await dispatch(updateTask({ ...task, subtasks: updatedSubtasks }));
        } catch (err) {
            console.error('Erreur lors de la mise à jour des sous-tâches', err);
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) {
            return <DocumentIcon className="w-6 h-6 text-red-500" />;
        } else if (fileType.includes('image')) {
            return <DocumentIcon className="w-6 h-6 text-blue-500" />;
        } else {
            return <DocumentIcon className="w-6 h-6 text-gray-500" />;
        }
    };

    // Mock subtasks and status history
    const subtasks: Subtask[] = task.subtasks || [
        { id: '1', text: 'Créer les wireframes', completed: true },
        { id: '2', text: 'Valider avec l’équipe', completed: false },
        { id: '3', text: 'Mettre à jour Figma', completed: false }
    ];

    const statusHistory = [
        { status: 'todo', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { status: 'inProgress', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ];

    return (
        <>
            <div style={backdropStyles} onClick={handleBackdropClick} />
            <div ref={panelRef} className="task-detail-panel" style={panelStyles}>
                <div className="flex flex-col h-full">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                        style={{ zIndex: 100001 }}
                        aria-label="Fermer le panneau"
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
                                aria-expanded={statusDropdownOpen}
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
                                                role="menuitem"
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
                    <div className="mt-4 flex-1">
                        <div className="flex border-b border-gray-200">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Comments' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('Comments')}
                            >
                                Commentaires <span className="ml-1 text-xs bg-gray-200 px-2 py-0.5 rounded-full">{comments.length}</span>
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Files' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('Files')}
                            >
                                Fichiers
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'Progress' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
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
                                            aria-label="Ajouter un commentaire"
                                        />
                                        <div className="flex justify-between items-center mt-2 bg-gray-50 p-2 rounded-b-lg border border-t-0">
                                            <div className="flex space-x-2">
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Mettre en gras">
                                                    <span className="font-bold text-sm">B</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Mettre en italique">
                                                    <span className="italic text-sm">I</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Barrer le texte">
                                                    <span className="line-through text-sm">S</span>
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Joindre un fichier">
                                                    <PaperClipIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Ajouter un lien">
                                                    <LinkIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                                <button type="button" className="p-1 rounded hover:bg-gray-200" aria-label="Ajouter un émoji">
                                                    <FaceSmileIcon className="w-5 h-5 text-gray-500" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleCommentSubmit}
                                                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                disabled={!commentText.trim()}
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
                                                                aria-label="Ajouter une réaction feu"
                                                            >
                                                                <FireIcon className="w-4 h-4 text-gray-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAddReaction(comment.id, '⚡')}
                                                                className="p-1 rounded hover:bg-gray-100"
                                                                aria-label="Ajouter une réaction éclair"
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
                                <div className="space-y-4">
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors"
                                        onDrop={handleDrop}
                                        onDragOver={e => e.preventDefault()}
                                        role="region"
                                        aria-label="Zone de dépôt de fichiers"
                                    >
                                        <DocumentIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">
                                            Glissez et déposez vos fichiers ici ou{' '}
                                            <button
                                                className="text-blue-500 hover:underline"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                cliquez pour sélectionner
                                            </button>
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            onChange={handleFileUpload}
                                            aria-hidden="true"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Formats supportés : PDF, images, documents (max 10 Mo)
                                        </p>
                                    </div>
                                    {Object.keys(uploading).length > 0 && (
                                        <div className="space-y-2">
                                            {Object.entries(uploading).map(([fileId, progress]) => (
                                                <div key={fileId} className="flex items-center space-x-2">
                                                    <div className="relative w-8 h-8">
                                                        <svg className="w-8 h-8 text-gray-200" viewBox="0 0 36 36">
                                                            <path
                                                                className="text-blue-500"
                                                                d="M18 2.0845
                                                                    a 15.9155 15.9155 0 0 1 0 31.831
                                                                    a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                strokeDasharray={`${progress}, 100`}
                                                            />
                                                        </svg>
                                                        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                                                            {progress}%
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-600">Téléchargement...</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {files.length > 0 ? (
                                        <div className="space-y-3">
                                            {files.map(file => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                                                    <div className="flex-1 ml-3">
                                                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} Mo •{' '}
                                                            {format(new Date(file.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                                                        </p>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <a
                                                            href={file.url}
                                                            download
                                                            className="p-1 rounded hover:bg-gray-200"
                                                            aria-label={`Télécharger ${file.name}`}
                                                        >
                                                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteFile(file.id)}
                                                            className="p-1 rounded hover:bg-gray-200"
                                                            aria-label={`Supprimer ${file.name}`}
                                                        >
                                                            <TrashIcon className="w-5 h-5 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : Object.keys(uploading).length === 0 ? (
                                        <div className="text-center py-6">
                                            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm font-medium text-gray-900 mb-2">Aucun fichier</p>
                                            <p className="text-sm text-gray-500">
                                                Ajoutez des fichiers pour organiser vos ressources.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                            {activeTab === 'Progress' && (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Progrès</span>
                                            <span className="text-sm font-semibold text-gray-800">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center space-x-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={progress}
                                                onChange={e => handleProgressUpdate(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #3b82f6 ${progress}%, #e5e7eb ${progress}%)`
                                                }}
                                                aria-label="Ajuster le progrès"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={progress}
                                                onChange={e => handleProgressUpdate(Number(e.target.value))}
                                                className="w-16 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                aria-label="Pourcentage de progrès"
                                            />
                                        </div>
                                    </div>
                                    {subtasks.length > 0 && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-3">Sous-tâches</div>
                                            <div className="space-y-3">
                                                {subtasks.map((subtask: Subtask) => (
                                                    <div key={subtask.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={subtask.completed}
                                                            onChange={() => handleSubtaskToggle(subtask.id)}
                                                            className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                                                            aria-label={`Marquer ${subtask.text} comme ${subtask.completed ? 'non complété' : 'complété'}`}
                                                        />
                                                        <span className={`ml-3 text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                            {subtask.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {statusHistory.length > 0 && (
                                        <div>
                                            <div className="text-sm font-medium text-gray-500 mb-3">Historique du statut</div>
                                            <div className="relative pl-6">
                                                <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gray-200" />
                                                {statusHistory.map((entry, index) => (
                                                    <div key={index} className="mb-4 relative">
                                                        <div className="absolute left-[-18px] top-1 w-3 h-3 rounded-full bg-blue-500" />
                                                        <div className="text-sm">
                                                            <span className="font-medium text-gray-800">
                                                                {statusOptions.find(opt => opt.id === entry.status)?.name || entry.status}
                                                            </span>
                                                            <span className="block text-xs text-gray-500">
                                                                {format(new Date(entry.date), 'dd MMM yyyy', { locale: fr })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {subtasks.length === 0 && statusHistory.length === 0 && (
                                        <div className="text-center py-6">
                                            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm font-medium text-gray-900 mb-2">Aucun progrès</p>
                                            <p className="text-sm text-gray-500">
                                                Ajoutez des sous-tâches ou mettez à jour le progrès pour suivre l’avancement.
                                            </p>
                                        </div>
                                    )}
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