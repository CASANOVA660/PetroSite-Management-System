import React, { useState, useEffect, useRef } from 'react';
import {
    XMarkIcon,
    CalendarIcon,
    TagIcon,
    ChatBubbleLeftRightIcon,
    FaceSmileIcon,
    PaperClipIcon,
    LinkIcon,
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
    toggleSubtask,
    uploadTaskFile,
    getTaskWithLinkedData,
    updateTaskProgress,
    reviewTask
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
    const [linkedTaskData, setLinkedTaskData] = useState<Task | null>(null);
    const [showReturnReason, setShowReturnReason] = useState(false);
    const [returnReason, setReturnReason] = useState('');

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

    const isSuiviTask = React.useMemo(() => {
        if (!task) return false;
        return (
            (task.title && (
                task.title.startsWith('Suivi:') ||
                task.title.startsWith('SUIVI:') ||
                task.title.toLowerCase().includes('suivi:')
            )) ||
            (task.tags && task.tags.some(tag =>
                ['Follow-up', 'Suivi', 'Project Action Validation', 'Validation'].includes(tag)
            ))
        );
    }, [task]);

    const isRealizationTask = React.useMemo(() => {
        if (!task) return false;
        return (
            (task.title && task.title.startsWith('Réalisation:')) ||
            (task.tags && task.tags.includes('Realization'))
        );
    }, [task]);

    const isCurrentUserSuivi = React.useMemo(() => {
        if (!task || !currentUser) return false;
        return task.assignee && task.assignee._id === currentUser._id && isSuiviTask;
    }, [task, currentUser, isSuiviTask]);

    const isTaskInReview = React.useMemo(() => {
        return task?.status === 'inReview';
    }, [task]);

    const showValidationButton = isCurrentUserSuivi && isTaskInReview;

    const handleValidateTask = async () => {
        if (!task) return;
        try {
            await dispatch(reviewTask({
                taskId: task._id,
                decision: 'accept',
                feedback: 'Tâche validée'
            })).unwrap();
            toast.success('Tâche validée avec succès');
            onClose();
        } catch (error) {
            console.error("Error validating task:", error);
            toast.error('Erreur lors de la validation de la tâche');
        }
    };

    const handleReturnToModification = async () => {
        if (!task || !returnReason.trim()) return;
        try {
            await dispatch(reviewTask({
                taskId: task._id,
                decision: 'return',
                feedback: returnReason
            })).unwrap();
            toast.success('Tâche retournée pour modification');
            setShowReturnReason(false);
            setReturnReason('');
            onClose();
        } catch (error) {
            console.error("Error returning task:", error);
            toast.error('Erreur lors du retour de la tâche');
        }
    };

    const isStatusLocked = React.useMemo(() => {
        if (!task) return false;
        return (
            // Lock if it's a Suivi task (follows realization)
            isSuiviTask ||
            // Lock if in review and needs validation
            (task.status === 'inReview' &&
                (task.needsValidation || isRealizationTask))
        );
    }, [task, isRealizationTask, isSuiviTask]);

    useEffect(() => {
        if (task) {
            setProgress(task.progress || 0);
        }
    }, [task]);

    useEffect(() => {
        if (task?._id) {
            dispatch(getTaskWithLinkedData({ taskId: task._id }))
                .unwrap()
                .then((data) => {
                    if (data.linkedTask && data.linkedTask._id !== task._id) {
                        console.log("Linked task found:", data.linkedTask.title);
                        setLinkedTaskData(data.linkedTask);
                    } else {
                        console.log("No linked task found or linked task is incorrect");
                        setLinkedTaskData(null);
                    }

                    if (data.allComments && data.allComments.length > 0) {
                        setComments(data.allComments);
                    } else if (data.comments) {
                        setComments(data.comments);
                    } else {
                        setComments([]);
                    }

                    if (data.allFiles && data.allFiles.length > 0) {
                        const mappedFiles = data.allFiles.map((file: {
                            _id: string;
                            name: string;
                            url: string;
                            type: string;
                            size: number;
                            uploadedBy: string;
                            approved: boolean;
                        }) => ({
                            _id: file._id,
                            name: file.name,
                            type: file.type || 'application/octet-stream',
                            size: file.size || 0,
                            uploadedAt: new Date().toISOString(),
                            url: file.url,
                            approved: !!file.approved
                        }));
                        setFiles(mappedFiles);
                    } else if (data.files && data.files.length > 0) {
                        const mappedFiles = data.files.map((file: {
                            _id: string;
                            name: string;
                            url: string;
                            type: string;
                            size: number;
                            uploadedBy: string;
                            approved: boolean;
                        }) => ({
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
                })
                .catch(error => {
                    console.error('Error fetching task with linked data:', error);
                    if (task.comments) {
                        setComments(task.comments);
                    }
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
                });
        }
    }, [task?._id, dispatch]);

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
                // Update the task's status
                await dispatch(updateTaskStatus({
                    taskId: task._id,
                    status: newStatus as Task['status']
                })).unwrap();

                // If this task has a linked task, update that one too
                if (task.linkedTaskId) {
                    console.log(`Updating linked task from status panel: ${task.linkedTaskId}`);
                    try {
                        await dispatch(updateTaskStatus({
                            taskId: task.linkedTaskId,
                            status: newStatus as Task['status']
                        })).unwrap();
                        console.log(`Successfully updated linked task status to ${newStatus}`);
                    } catch (linkedError) {
                        console.error('Error updating linked task status:', linkedError);
                        toast.error('La tâche liée n\'a pas pu être mise à jour');
                    }
                }

                setStatusDropdownOpen(false);
                toast.success('Statut mis à jour avec succès');
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
                })).unwrap();

                setCommentText('');

                dispatch(getTaskWithLinkedData({ taskId: task._id }))
                    .unwrap()
                    .then((data) => {
                        if (data.allComments && data.allComments.length > 0) {
                            setComments(data.allComments);
                        } else if (data.comments) {
                            setComments(data.comments);
                        }
                    })
                    .catch(error => {
                        console.error('Error refreshing task data:', error);
                    });

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
                    progress += 5;
                    setUploading(prev => ({ ...prev, [_id]: Math.min(progress, 95) }));
                    if (progress >= 95) {
                        clearInterval(interval);
                    }
                }, 200);

                await dispatch(uploadTaskFile({
                    taskId: task._id,
                    file
                })).unwrap();

                clearInterval(interval);
                setUploading(prev => ({ ...prev, [_id]: 100 }));

                dispatch(getTaskWithLinkedData({ taskId: task._id }))
                    .unwrap()
                    .then((data) => {
                        if (data.allFiles && data.allFiles.length > 0) {
                            const mappedFiles = data.allFiles.map((file: {
                                _id: string;
                                name: string;
                                url: string;
                                type: string;
                                size: number;
                                uploadedBy: string;
                                approved: boolean;
                            }) => ({
                                _id: file._id,
                                name: file.name,
                                type: file.type || 'application/octet-stream',
                                size: file.size || 0,
                                uploadedAt: new Date().toISOString(),
                                url: file.url,
                                approved: !!file.approved
                            }));
                            setFiles(mappedFiles);
                        } else if (data.files && data.files.length > 0) {
                            const mappedFiles = data.files.map((file: {
                                _id: string;
                                name: string;
                                url: string;
                                type: string;
                                size: number;
                                uploadedBy: string;
                                approved: boolean;
                            }) => ({
                                _id: file._id,
                                name: file.name,
                                type: file.type || 'application/octet-stream',
                                size: file.size || 0,
                                uploadedAt: new Date().toISOString(),
                                url: file.url,
                                approved: !!file.approved
                            }));
                            setFiles(mappedFiles);
                        }
                    })
                    .catch(error => {
                        console.error('Error refreshing task data:', error);
                    });

                setTimeout(() => {
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[_id];
                        return newUploading;
                    });
                    toast.success('Fichier téléchargé avec succès');
                }, 500);
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Échec du téléchargement du fichier');

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
        if (!uploadedFiles || !task?._id) return;

        Array.from(uploadedFiles).forEach(async (file) => {
            const _id = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [_id]: 0 }));

            try {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 5;
                    setUploading(prev => ({ ...prev, [_id]: Math.min(progress, 95) }));
                    if (progress >= 95) {
                        clearInterval(interval);
                    }
                }, 200);

                await dispatch(uploadTaskFile({
                    taskId: task._id,
                    file
                })).unwrap();

                clearInterval(interval);
                setUploading(prev => ({ ...prev, [_id]: 100 }));

                dispatch(getTaskWithLinkedData({ taskId: task._id }))
                    .unwrap()
                    .then((data) => {
                        if (data.allFiles && data.allFiles.length > 0) {
                            const mappedFiles = data.allFiles.map((file: {
                                _id: string;
                                name: string;
                                url: string;
                                type: string;
                                size: number;
                                uploadedBy: string;
                                approved: boolean;
                            }) => ({
                                _id: file._id,
                                name: file.name,
                                type: file.type || 'application/octet-stream',
                                size: file.size || 0,
                                uploadedAt: new Date().toISOString(),
                                url: file.url,
                                approved: !!file.approved
                            }));
                            setFiles(mappedFiles);
                        } else if (data.files && data.files.length > 0) {
                            const mappedFiles = data.files.map((file: {
                                _id: string;
                                name: string;
                                url: string;
                                type: string;
                                size: number;
                                uploadedBy: string;
                                approved: boolean;
                            }) => ({
                                _id: file._id,
                                name: file.name,
                                type: file.type || 'application/octet-stream',
                                size: file.size || 0,
                                uploadedAt: new Date().toISOString(),
                                url: file.url,
                                approved: !!file.approved
                            }));
                            setFiles(mappedFiles);
                        }
                    })
                    .catch(error => {
                        console.error('Error refreshing task data:', error);
                    });

                setTimeout(() => {
                    setUploading(prev => {
                        const newUploading = { ...prev };
                        delete newUploading[_id];
                        return newUploading;
                    });
                    toast.success('Fichier téléchargé avec succès');
                }, 500);
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Échec du téléchargement du fichier');

                setUploading(prev => {
                    const newUploading = { ...prev };
                    delete newUploading[_id];
                    return newUploading;
                });
            }
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
            await dispatch(updateTaskProgress({
                taskId: task._id,
                progress: newProgress
            })).unwrap();
            if (task._id) {
                dispatch(getTaskWithLinkedData({ taskId: task._id }))
                    .unwrap()
                    .catch(error => {
                        console.error('Error refreshing task data after progress update:', error);
                    });
            }
            toast.success('Progrès mis à jour');
        } catch (err) {
            console.error('Error updating progress:', err);
            toast.error('Échec de la mise à jour du progrès');
            setProgress(task.progress || 0);
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

    const renderRolesHeader = () => {
        const isCurrentTaskSuivi = task?.title?.startsWith('Suivi:') || false;
        const isCurrentTaskRealization = task?.title?.startsWith('Réalisation:') || false;
        const isProjectAction = task?.actionId ? true : false;

        console.log('Current task title:', task?.title);
        console.log('Is current task Suivi:', isCurrentTaskSuivi);
        console.log('Is current task Realization:', isCurrentTaskRealization);
        console.log('Is project action:', isProjectAction);
        console.log('Linked task found:', linkedTaskData ? 'Yes' : 'No');

        if (linkedTaskData) {
            console.log('Linked task title:', linkedTaskData.title);
            console.log('Linked task assignee:', linkedTaskData.assignee?.prenom, linkedTaskData.assignee?.nom);
        }

        const isLinkedTaskSuivi = linkedTaskData?.title?.startsWith('Suivi:') || false;
        const isLinkedTaskRealization = linkedTaskData?.title?.startsWith('Réalisation:') || false;

        if (isProjectAction) {
            if (linkedTaskData) {
                const currentTaskIsSuivi = isCurrentTaskSuivi || (!isCurrentTaskRealization && !isCurrentTaskSuivi && task.creator?._id === task.assignee?._id);
                const linkedTaskIsRealization = isLinkedTaskRealization;
                const currentTaskIsRealization = isCurrentTaskRealization || (!isCurrentTaskRealization && !isCurrentTaskSuivi && task.creator?._id !== task.assignee?._id);
                const linkedTaskIsSuivi = isLinkedTaskSuivi;

                return (
                    <div className="text-sm text-gray-600">
                        <div className="mb-1">
                            <span className="font-medium">Responsable de réalisation: </span>
                            <span>
                                {currentTaskIsRealization ? (
                                    currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                        ? 'Moi'
                                        : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`
                                ) : linkedTaskIsRealization ? (
                                    currentUser && linkedTaskData.assignee && currentUser._id === linkedTaskData.assignee._id
                                        ? 'Moi'
                                        : `${linkedTaskData.assignee?.prenom || ''} ${linkedTaskData.assignee?.nom || 'Non assigné'}`
                                ) : (
                                    currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                        ? 'Moi'
                                        : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`
                                )}
                            </span>
                        </div>
                        <div className="mb-1">
                            <span className="font-medium">Responsable de suivi: </span>
                            <span>
                                {currentTaskIsSuivi ? (
                                    currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                        ? 'Moi'
                                        : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`
                                ) : linkedTaskIsSuivi ? (
                                    currentUser && linkedTaskData.assignee && currentUser._id === linkedTaskData.assignee._id
                                        ? 'Moi'
                                        : `${linkedTaskData.assignee?.prenom || ''} ${linkedTaskData.assignee?.nom || 'Non assigné'}`
                                ) : (
                                    currentUser && task?.creator && currentUser._id === task?.creator._id
                                        ? 'Moi'
                                        : `${task?.creator?.prenom || ''} ${task?.creator?.nom || 'Non assigné'}`
                                )}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium">Créé par: </span>
                            <span>
                                {currentUser && task?.creator && currentUser._id === task?.creator._id
                                    ? 'Moi'
                                    : `${task?.creator?.prenom || ''} ${task?.creator?.nom || ''}`}
                            </span>
                        </div>
                    </div>
                );
            }

            return (
                <div className="text-sm text-gray-600">
                    <div className="mb-1">
                        <span className="font-medium">Responsable de réalisation: </span>
                        <span>
                            {currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                ? 'Moi'
                                : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`}
                        </span>
                    </div>
                    <div className="mb-1">
                        <span className="font-medium">Responsable de suivi: </span>
                        <span>
                            {currentUser && task?.creator && currentUser._id === task?.creator._id
                                ? 'Moi'
                                : `${task?.creator?.prenom || ''} ${task?.creator?.nom || 'Non assigné'}`}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Créé par: </span>
                        <span>
                            {currentUser && task?.creator && currentUser._id === task?.creator._id
                                ? 'Moi'
                                : `${task?.creator?.prenom || ''} ${task?.creator?.nom || ''}`}
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-sm text-gray-600">
                <div className="mb-1">
                    <span className="font-medium">Responsable de réalisation: </span>
                    <span>
                        {isCurrentTaskRealization ? (
                            currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                ? 'Moi'
                                : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`
                        ) : isCurrentTaskSuivi && isLinkedTaskRealization && linkedTaskData?.assignee ? (
                            currentUser && linkedTaskData?.assignee && currentUser._id === linkedTaskData?.assignee._id
                                ? 'Moi'
                                : `${linkedTaskData?.assignee?.prenom || ''} ${linkedTaskData?.assignee?.nom || 'Non assigné'}`
                        ) : (
                            'Non assigné'
                        )}
                    </span>
                </div>
                <div className="mb-1">
                    <span className="font-medium">Responsable de suivi: </span>
                    <span>
                        {isCurrentTaskSuivi ? (
                            currentUser && task?.assignee && currentUser._id === task?.assignee._id
                                ? 'Moi'
                                : `${task?.assignee?.prenom || ''} ${task?.assignee?.nom || 'Non assigné'}`
                        ) : isCurrentTaskRealization && isLinkedTaskSuivi && linkedTaskData?.assignee ? (
                            currentUser && linkedTaskData?.assignee && currentUser._id === linkedTaskData?.assignee._id
                                ? 'Moi'
                                : `${linkedTaskData?.assignee?.prenom || ''} ${linkedTaskData?.assignee?.nom || 'Non assigné'}`
                        ) : (
                            'Non assigné'
                        )}
                    </span>
                </div>
                <div>
                    <span className="font-medium">Créé par: </span>
                    <span>
                        {currentUser && task?.creator && currentUser._id === task?.creator._id
                            ? 'Moi'
                            : `${task?.creator?.prenom || ''} ${task?.creator?.nom || ''}`}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <>
            <div style={backdropStyles} onClick={handleBackdropClick} />
            <div ref={panelRef} className="task-detail-panel" style={panelStyles(isExpanded)}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex">
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
                    </div>

                    {isTaskInReview && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-blue-800">Cette tâche est en attente de validation</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        {isRealizationTask ? (
                                            <p>Cette tâche de réalisation est en cours de révision et ne peut pas être modifiée tant que le responsable de suivi ne l'a pas validée.</p>
                                        ) : isSuiviTask ? (
                                            <p>La tâche a été marquée comme prête à être révisée. En tant que responsable de suivi, vous devez valider cette tâche.</p>
                                        ) : (
                                            <p>La tâche a été marquée comme prête à être révisée par le responsable.</p>
                                        )}

                                        {isCurrentUserSuivi && !showReturnReason && (
                                            <div className="mt-3 flex space-x-3">
                                                <button
                                                    onClick={handleValidateTask}
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
                                                    aria-label="Valider cette tâche"
                                                >
                                                    <CheckIcon className="h-5 w-5 mr-2" />
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() => setShowReturnReason(true)}
                                                    className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 shadow-sm"
                                                    aria-label="Retourner pour modification"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                    Retourner
                                                </button>
                                            </div>
                                        )}
                                        {isCurrentUserSuivi && showReturnReason && (
                                            <div className="mt-4 space-y-3">
                                                <textarea
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm resize-none bg-white shadow-sm"
                                                    placeholder="Veuillez indiquer la raison du retour..."
                                                    value={returnReason}
                                                    onChange={(e) => setReturnReason(e.target.value)}
                                                    aria-label="Raison du retour pour modification"
                                                />
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={handleReturnToModification}
                                                        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 shadow-sm disabled:opacity-50"
                                                        disabled={!returnReason.trim()}
                                                        aria-label="Confirmer le retour pour modification"
                                                    >
                                                        Confirmer
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowReturnReason(false);
                                                            setReturnReason('');
                                                        }}
                                                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
                                                        aria-label="Annuler le retour pour modification"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suivi task indicator */}
                    {isSuiviTask && !isTaskInReview && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-orange-800">Tâche de suivi liée</h3>
                                    <p className="mt-2 text-sm text-orange-700">
                                        Cette tâche de suivi est liée à une tâche de réalisation et suit automatiquement son statut.
                                        Vous ne pouvez pas la déplacer manuellement.
                                    </p>
                                    {linkedTaskData && (
                                        <p className="mt-2 text-sm text-orange-700">
                                            <strong>Tâche de réalisation:</strong> {linkedTaskData.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Realization task indicator */}
                    {isRealizationTask && !isTaskInReview && linkedTaskData && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-green-800">Tâche de réalisation liée</h3>
                                    <p className="mt-2 text-sm text-green-700">
                                        Cette tâche de réalisation mettra automatiquement à jour le statut de la tâche de suivi associée.
                                    </p>
                                    {linkedTaskData && (
                                        <p className="mt-2 text-sm text-green-700">
                                            <strong>Tâche de suivi:</strong> {linkedTaskData.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isExpanded ? (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">{task.title}</h2>
                                    {renderRolesHeader()}
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
                                            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${getCurrentStatus().color} ${isStatusLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            onClick={() => !isStatusLocked && setStatusDropdownOpen(!statusDropdownOpen)}
                                            aria-expanded={statusDropdownOpen}
                                            disabled={isStatusLocked}
                                        >
                                            <span>{getCurrentStatus().name}</span>
                                            {!isStatusLocked ? (
                                                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                        {statusDropdownOpen && !isStatusLocked && (
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
                                {renderRolesHeader()}
                            </div>
                            <div className="mb-4">
                                <div className="text-sm font-medium text-gray-500 mb-2">Statut</div>
                                <div className="relative">
                                    <button
                                        className={`flex items-center px-3 py-1.5 rounded-md text-sm ${getCurrentStatus().color} ${isStatusLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        onClick={() => !isStatusLocked && setStatusDropdownOpen(!statusDropdownOpen)}
                                        aria-expanded={statusDropdownOpen}
                                        disabled={isStatusLocked}
                                    >
                                        <span>{getCurrentStatus().name}</span>
                                        {!isStatusLocked ? (
                                            <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    {statusDropdownOpen && !isStatusLocked && (
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
                                            {comments && comments.length > 0 ? (
                                                <div className="space-y-4">
                                                    {comments.map(comment => (
                                                        <div key={comment._id} className="flex items-start">
                                                            <img
                                                                src={`https://ui-avatars.com/api/?name=${comment.author?.prenom || ''}+${comment.author?.nom || ''}&background=random`}
                                                                alt={comment.author ? `${comment.author.prenom} ${comment.author.nom}` : "Utilisateur"}
                                                                className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center mb-1">
                                                                    <span className="font-medium text-sm text-gray-800 mr-2">
                                                                        {comment.author ? `${comment.author.prenom} ${comment.author.nom}` : "Utilisateur"}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatDistanceToNow(new Date(comment.createdAt), { locale: fr, addSuffix: true })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6">
                                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-300" />
                                                    <p className="mt-2 text-sm text-gray-500">Aucun commentaire pour le moment</p>
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