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
    ClockIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../store';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import {
    Task,
    updateTask,
    updateTaskStatus,
    addComment,
    toggleSubtask
} from '../../store/slices/taskSlice';

interface TaskDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task;
}

interface FileItem {
    _id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string;
    url: string;
    approved?: boolean;
}

interface LocalSubtask {
    _id: string;
    text: string;
    completed: boolean;
}

interface TaskSubtask {
    _id: string;
    text: string;
    completed: boolean;
}

interface TaskFile {
    _id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: any;
    uploadedAt: string;
    approved: boolean;
}

interface StatusHistoryEntry {
    user: string;
    status: string;
    newStatus: string;
    date: Date;
}

const statusOptions = [
    { id: 'todo', name: 'À faire', color: 'bg-gray-200 text-gray-800' },
    { id: 'inProgress', name: 'En cours', color: 'bg-blue-200 text-blue-800' },
    { id: 'inReview', name: 'En revue', color: 'bg-yellow-200 text-yellow-800' },
    { id: 'done', name: 'Terminé', color: 'bg-green-200 text-green-800' }
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
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Comments');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState<{ [key: string]: number }>({});
    const [progress, setProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const panelStyles = (expanded: boolean): React.CSSProperties => ({
        position: 'fixed',
        top: 0,
        bottom: 0,
        width: '100%',
        maxWidth: expanded ? '800px' : '420px',
        backgroundColor: 'white',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
        zIndex: 100000,
        overflowY: 'auto',
        padding: '24px',
        transition: 'all 0.3s ease',
        ...(expanded
            ? { left: '50%', transform: 'translateX(-50%)' }
            : { right: 0 })
    });

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const toggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    useEffect(() => {
        if (task) {
            setProgress(task.progress || 0);
        }
    }, [task?.progress]);

    useEffect(() => {
        if (task?._id) {
            setComments(task.comments || []);
            if (task.files && task.files.length > 0) {
                const mappedFiles = task.files.map(file => ({
                    _id: file._id,
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size || 0,
                    uploadedAt: new Date().toISOString(),
                    url: file.url,
                    approved: !!file.approved
                }));
                setFiles(mappedFiles);
            } else {
                setFiles([]);
            }
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
            if (task?._id) {
                await dispatch(updateTaskStatus({
                    taskId: task._id,
                    status: newStatus as Task['status']
                }));
                setStatusDropdownOpen(false);
            }
        } catch (err) {
            console.error('Error changing status:', err);
            toast.error('Failed to update task status');
        }
    };

    const handleCommentSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            if (task?._id) {
                await dispatch(addComment({
                    taskId: task._id,
                    text: commentText
                }));

                setCommentText('');
                toast.success('Commentaire ajouté');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error('Échec de l\'ajout du commentaire');
        }
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
        if (!uploadedFiles || !task?._id) return;

        Array.from(uploadedFiles).forEach(async (file) => {
            const _id = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [_id]: 0 }));

            try {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    setUploading(prev => ({ ...prev, [_id]: progress }));
                    if (progress >= 100) {
                        clearInterval(interval);
                    }
                }, 200);

                setTimeout(() => {
                    setFiles(prev => [
                        ...prev,
                        {
                            _id,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            url: URL.createObjectURL(file)
                        }
                    ]);

                    clearInterval(interval);
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[_id];
                        return newUploading;
                    });

                    toast.success('File uploaded successfully');
                }, 2000);
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Failed to upload file');

                setUploading(prev => {
                    const newUploading = { ...prev };
                    delete newUploading[_id];
                    return newUploading;
                });
            }
        });
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const uploadedFiles = event.dataTransfer.files;
        if (!uploadedFiles) return;

        Array.from(uploadedFiles).forEach(file => {
            const _id = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [_id]: 0 }));

            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploading(prev => ({ ...prev, [_id]: progress }));
                if (progress >= 100) {
                    clearInterval(interval);
                    setFiles(prev => [
                        ...prev,
                        {
                            _id,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            url: URL.createObjectURL(file)
                        }
                    ]);
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[_id];
                        return newUploading;
                    });
                }
            }, 200);
        });
    };

    const handleDeleteFile = (fileId: string) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
            setFiles(prev => prev.filter(file => file._id !== fileId));
        }
    };

    const handleProgressUpdate = async (newProgress: number) => {
        setProgress(newProgress);
        if (!task?._id) return;

        try {
            await dispatch(updateTask({
                ...task,
                progress: newProgress
            }));
        } catch (err) {
            console.error('Error updating progress:', err);
            toast.error('Failed to update task progress');
        }
    };

    const handleSubtaskToggle = async (subtaskId: string) => {
        if (!task?._id || !task.subtasks) return;

        try {
            await dispatch(toggleSubtask({
                taskId: task._id,
                subtaskId
            }));

            toast.success('Sous-tâche mise à jour');
        } catch (err) {
            console.error('Error updating subtasks:', err);
            toast.error('Échec de la mise à jour de la sous-tâche');
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

    const getSubtaskId = (subtask: TaskSubtask | LocalSubtask): string => {
        return '_id' in subtask ? subtask._id : (subtask as unknown as LocalSubtask)._id;
    };

    const defaultSubtasks: LocalSubtask[] = [
        {
            _id: 'default-1',
            text: 'Analyser les besoins des utilisateurs',
            completed: true
        },
        {
            _id: 'default-2',
            text: 'Créer des wireframes',
            completed: false
        }
    ];

    const subtasks = task?.subtasks || [];

    const statusHistory: StatusHistoryEntry[] = [
        { user: 'Utilisateur', status: 'todo', newStatus: 'inProgress', date: new Date('2024-01-08T09:00:00') },
        { user: 'Utilisateur', status: 'created', newStatus: 'todo', date: new Date('2024-01-07T14:00:00') }
    ];

    const handleApproveFile = async (fileId: string) => {
        if (!task?._id) return;

        try {
            const updatedFiles = task.files?.map(file => {
                if (file._id === fileId) {
                    return { ...file, approved: true };
                }
                return file;
            });

            await dispatch(updateTask({
                ...task,
                files: updatedFiles
            }));

            setFiles(files.map(file =>
                file._id === fileId
                    ? { ...file, approved: true }
                    : file
            ));

            toast.success('Fichier approuvé');
        } catch (err) {
            console.error('Error approving file:', err);
            toast.error('Échec de l\'approbation du fichier');
        }
    };

    return (
        <>
            <div style={backdropStyles} onClick={handleBackdropClick} />
            <div ref={panelRef} className="task-detail-panel" style={panelStyles(isExpanded)}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={toggleExpand}
                            className="p-2 rounded-full hover:bg-gray-100"
                            style={{ zIndex: 100001 }}
                            aria-label={isExpanded ? "Réduire le panneau" : "Agrandir le panneau"}
                        >
                            {isExpanded ? (
                                <ArrowsPointingInIcon className="w-6 h-6 text-gray-500" />
                            ) : (
                                <ArrowsPointingOutIcon className="w-6 h-6 text-gray-500" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100"
                            style={{ zIndex: 100001 }}
                            aria-label="Fermer le panneau"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                    {isExpanded ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">{task.title}</h2>
                                    <p className="text-sm text-gray-600">{task.description || "Le système de design dans la version web a besoin d'améliorations et inclut l'ajout de plusieurs autres composants."}</p>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Pièces jointes</div>
                                    {files.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {files.map(file => (
                                                <div key={file._id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                    {getFileIcon(file.type)}
                                                    <span className="text-sm text-gray-800">{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600">Aucune pièce jointe</p>
                                    )}
                                </div>
                                <div>
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
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Assigné à</div>
                                    <div className="flex items-center mr-4">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${task.assignee?.prenom}+${task.assignee?.nom}&background=random`}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                        <span className="text-sm font-medium">Assigné à: {task.assignee?.prenom} {task.assignee?.nom}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Date de début</div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-800">
                                            {task.startDate ? formatDate(task.startDate) : '8 janvier 2024'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Date d'échéance</div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-800">
                                            {task.endDate ? formatDate(task.endDate) : '12 janvier 2024'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Priorité</div>
                                    <div className="flex space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${priorityOptions.find(opt => opt.id === 'low')?.color}`}>
                                            {priorityOptions.find(opt => opt.id === 'low')?.name}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Sous-tâches ({subtasks.filter((s: any) => s.completed).length}/{subtasks.length})</div>
                                    <div className="space-y-2">
                                        {subtasks.map((subtask: any) => (
                                            <div key={getSubtaskId(subtask)} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-5 w-5 text-[#F28C38]"
                                                    checked={subtask.completed}
                                                    onChange={() => handleSubtaskToggle(getSubtaskId(subtask))}
                                                    id={`subtask-${getSubtaskId(subtask)}`}
                                                    aria-label={`Marquer ${subtask.text} comme ${subtask.completed ? 'non complété' : 'complété'}`}
                                                />
                                                <span className={`ml-3 text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                    {subtask.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-2 text-sm text-blue-500 hover:underline">+ Ajouter une sous-tâche</button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Statistiques du projet</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-500 flex items-center">
                                                    <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
                                                    Temps restant
                                                </span>
                                            </div>
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Active reminder</p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-500">Progrès</span>
                                                <span className="text-sm font-semibold text-gray-800">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Activités</h3>
                                    <div className="space-y-4">
                                        {statusHistory.map((entry, index) => (
                                            <div key={index} className="flex items-start">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${entry.user}&background=random`}
                                                    alt={entry.user}
                                                    className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-800">
                                                        <span className="font-medium">{entry.user}</span>{' '}
                                                        {entry.status === 'created' ? 'a créé la tâche' : 'a déplacé la tâche'} <span className="font-medium">{task.title}</span>
                                                    </p>
                                                    {entry.status !== 'created' && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {statusOptions.find(opt => opt.id === entry.status)?.name} →{' '}
                                                            {statusOptions.find(opt => opt.id === entry.newStatus)?.name}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        {format(new Date(entry.date), 'd MMM yyyy à HH:mm', { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
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
                                        {task.endDate ? formatDate(task.endDate) : '12 janvier 2024'}
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
                                    {task.description || "Le système de design dans la version web a besoin d'améliorations et inclut l'ajout de plusieurs autres composants."}
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
                                                            key={file._id}
                                                            className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                                                            <div className="flex-1 ml-3">
                                                                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(file.size / 1024 / 1024).toFixed(2)} Mo •{' '}
                                                                    {format(new Date(file.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                                                                    {file.approved && ' • Approuvé'}
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
                                                                {(task?.creator?._id === currentUser?._id || task?.assignee?._id === currentUser?._id) &&
                                                                    !file.approved && (
                                                                        <button
                                                                            onClick={() => handleApproveFile(file._id)}
                                                                            className="p-1 rounded hover:bg-gray-200"
                                                                            aria-label={`Approuver ${file.name}`}
                                                                        >
                                                                            <CheckIcon className="w-5 h-5 text-green-500" />
                                                                        </button>
                                                                    )}
                                                                <button
                                                                    onClick={() => handleDeleteFile(file._id)}
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
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
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
                                                        {subtasks.map((subtask: any) => (
                                                            <div key={getSubtaskId(subtask)} className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-checkbox h-5 w-5 text-[#F28C38]"
                                                                    checked={subtask.completed}
                                                                    onChange={() => handleSubtaskToggle(getSubtaskId(subtask))}
                                                                    id={`subtask-${getSubtaskId(subtask)}`}
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
                                                        Ajoutez des sous-tâches ou mettez à jour le progrès pour suivre l'avancement.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TaskDetailPanel;