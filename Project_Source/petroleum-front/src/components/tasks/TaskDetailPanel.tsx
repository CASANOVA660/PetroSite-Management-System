import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    CheckIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
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
import axiosInstance from '../../utils/axios';
import { sendDirectNotification } from '../../socket/socket';

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

// Initialize sentNotifications tracking
// To avoid TypeScript errors, declare the global property
declare global {
    interface Window {
        __sentNotifications: Record<string, boolean>;
    }
}

// Initialize the notification tracking object if it doesn't exist
if (typeof window !== 'undefined') {
    window.__sentNotifications = window.__sentNotifications || {};
}

// Helper to extract clean task name without prefixes
const getCleanTaskName = (taskTitle: string) => {
    if (!taskTitle) return '';

    // Remove prefixes like "Suivi:" or "Réalisation:" and trim whitespace
    return taskTitle
        .replace(/^(Suivi|SUIVI|Realisation|REALISATION|Réalisation|RÉALISATION):\s*/i, '')
        .trim();
};

// Get user name safely with type checking
const getUserName = (user: any) => {
    if (!user) return '';
    // Try different name properties that might exist
    if (user.prenom && user.nom) return `${user.prenom} ${user.nom}`;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.name) return user.name;
    return 'Un utilisateur';
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
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [isValidationSentToManager, setIsValidationSentToManager] = useState(false);
    const [confirmPopover, setConfirmPopover] = useState<{ isOpen: boolean; type?: 'accept' | 'decline' }>({ isOpen: false });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [showReturnReasonModal, setShowReturnReasonModal] = useState(false);

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

    const handleReviewTask = (decision: 'accept' | 'decline' | 'return') => {
        console.log(`handleReviewTask called with decision: ${decision}`, {
            returnReason,
            reviewFeedback,
            showReturnReason
        });

        if (!task) return;

        if (
            (decision === 'decline' && (!reviewFeedback || reviewFeedback.trim() === '')) ||
            (decision === 'return' && (!returnReason || returnReason.trim() === ''))
        ) {
            console.log("Feedback validation failed:", {
                decision,
                returnReason: returnReason || "(empty)",
                reviewFeedback: reviewFeedback || "(empty)"
            });
            toast.error("Un feedback est requis pour refuser ou retourner une tâche");
            return;
        }

        // Reset sent notifications tracking
        window.__sentNotifications = {};

        // Add debug logs before submitting the review
        console.log("Submitting task review:", {
            taskId: task._id,
            taskTitle: task.title,
            decision,
            feedback: decision === 'return' ? returnReason : reviewFeedback,
            returnReason,
            reviewFeedback,
            isSuiviTask,
            isRealizationTask,
            originalNeedsValidation: task.needsValidation,
            linkedTaskId: task.linkedTaskId,
            linkedTaskData: linkedTaskData ? {
                id: linkedTaskData._id,
                title: linkedTaskData.title
            } : null
        });

        setReviewSubmitting(true);

        // For suivi tasks, we handle the accept and return cases specially
        if (isSuiviTask && linkedTaskData) {
            // Special handling for "return" action when it's a suivi task
            if (decision === 'return') {
                // First update both tasks back to "inProgress" status
                Promise.all([
                    // Keep the suivi task in "inReview" status but with updated feedback
                    Promise.resolve(dispatch(updateTask({
                        ...task,
                        reviewFeedback: returnReason
                    }))),

                    // Return the linked realization task to "inProgress" status
                    linkedTaskData._id ?
                        dispatch(updateTaskStatus({
                            taskId: linkedTaskData._id,
                            status: 'inProgress'
                        })).unwrap() :
                        Promise.resolve()
                ])
                    .then(() => {
                        console.log("Return task Promise.all completed successfully");
                        toast.success("La tâche de réalisation a été retournée pour modification");

                        // Send notification to the realization task assignee
                        if (linkedTaskData && linkedTaskData.assignee && linkedTaskData.assignee._id) {
                            // Send notification about task being returned
                            const message = `Votre tâche "${linkedTaskData.title}" a été retournée pour modification. Raison: ${returnReason}`;

                            // Make a direct request to the notification API
                            axiosInstance.post('/notifications', {
                                type: 'LINKED_TASK_RETURNED',
                                message,
                                userId: String(linkedTaskData.assignee._id),
                                isRead: false,
                                metadata: {
                                    taskTitle: linkedTaskData.title,
                                    feedback: returnReason,
                                    taskId: linkedTaskData._id,
                                    linkedTaskId: task._id,
                                    returnedBy: currentUser?._id
                                }
                            })
                                .then(response => {
                                    console.log("Return notification sent successfully:", response.data);

                                    // Also try sending via socket
                                    try {
                                        // @ts-ignore
                                        if (window.socket && window.socket.connected) {
                                            // @ts-ignore
                                            window.socket.emit('direct-notification', {
                                                userId: String(linkedTaskData.assignee._id),
                                                notification: {
                                                    type: 'LINKED_TASK_RETURNED',
                                                    message,
                                                    metadata: {
                                                        taskTitle: linkedTaskData.title,
                                                        feedback: returnReason,
                                                        taskId: linkedTaskData._id
                                                    }
                                                }
                                            });
                                        }
                                    } catch (socketError) {
                                        console.error("Socket notification failed:", socketError);
                                    }
                                })
                                .catch(error => {
                                    console.error("Error sending return notification:", error);
                                });
                        }

                        // Reset the return reason form
                        setReturnReason('');
                        setShowReturnReason(false);

                        onClose();
                    })
                    .catch((error) => {
                        console.error("Error returning tasks:", error);
                        if (error.stack) console.error(error.stack);
                        toast.error(`Erreur lors du retour de la tâche: ${error.message || "Erreur inconnue"}`);
                    })
                    .finally(() => {
                        setReviewSubmitting(false);
                    });

                return; // Exit early as we've handled the return case specially
            }

            // For accept case with tasks that need manager validation
            if (decision === 'accept' && task.needsValidation) {
                // Update the suivi task to show it's waiting for manager validation
                Promise.resolve(dispatch(updateTask({
                    ...task,
                    reviewFeedback: 'pending_manager_validation'
                })))
                    .then(() => {
                        console.log("Task updated, pending manager validation");
                        toast.success("La tâche a été envoyée au manager pour validation finale");

                        // Update local state to show that validation was sent to manager
                        setIsValidationSentToManager(true);

                        // Send notification to the manager (task creator)
                        if (task.creator && task.creator._id) {
                            // Send notification about task needing validation - using a valid type from backend
                            const message = `La tâche "${task.title}" nécessite votre validation finale`;

                            // Make a direct request to the notification API with a valid notification type
                            axiosInstance.post('/notifications', {
                                type: 'TASK_VALIDATION_REQUESTED', // Use existing valid notification type
                                message,
                                userId: String(task.creator._id),
                                isRead: false,
                                metadata: {
                                    taskTitle: task.title,
                                    taskId: task._id,
                                    linkedTaskId: task.linkedTaskId,
                                    sentBy: currentUser?._id
                                }
                            })
                                .then(response => {
                                    console.log("Manager notification sent successfully:", response.data);
                                })
                                .catch(error => {
                                    console.error("Error sending manager notification:", error);
                                });
                        }
                    })
                    .catch((error) => {
                        console.error("Error updating task for manager validation:", error);
                        toast.error(`Erreur lors de l'envoi pour validation: ${error.message || "Erreur inconnue"}`);
                    })
                    .finally(() => {
                        setReviewSubmitting(false);
                    });

                return; // Exit early as we've handled the accept with validation case
            }

            // For accept case without validation, keep the original logic
            if (decision === 'accept') {
                // First update both tasks to done status directly
                Promise.all([
                    // Update the suivi task
                    dispatch(updateTaskStatus({
                        taskId: task._id,
                        status: 'done'
                    })).unwrap(),

                    // Update the linked realization task if it exists
                    linkedTaskData._id ?
                        dispatch(updateTaskStatus({
                            taskId: linkedTaskData._id,
                            status: 'done'
                        })).unwrap() :
                        Promise.resolve()
                ])
                    .then(() => {
                        toast.success("La tâche de suivi a été validée avec succès");
                        toast.success("La tâche de réalisation a été automatiquement marquée comme complétée");

                        // First, send notifications to task assignees
                        if (task.assignee && task.assignee._id) {
                            sendTaskCompletionNotification(task.title, task.assignee._id, false);
                        }

                        if (linkedTaskData && linkedTaskData.assignee && linkedTaskData.assignee._id) {
                            sendTaskCompletionNotification(linkedTaskData.title, linkedTaskData.assignee._id, false);
                        }

                        // Send single combined notification to manager (if different from assignee)
                        if (task.creator && task.creator._id) {
                            // Extract the core task name without the prefix
                            const baseTaskName = getCleanTaskName(task.title);
                            sendTaskCompletionNotification(baseTaskName, task.creator._id, true);
                        }

                        onClose();
                    })
                    .catch((error) => {
                        console.error("Error updating tasks:", error);
                        toast.error(`Erreur lors de la validation: ${error.message || "Erreur inconnue"}`);
                    })
                    .finally(() => {
                        setReviewSubmitting(false);
                    });

                return; // Exit early as we've handled the accept case specially
            }
        }

        // Regular flow using reviewTask API
        dispatch(
            reviewTask({
                taskId: task._id,
                decision,
                feedback: decision === 'return' ? returnReason : reviewFeedback || undefined,
            })
        )
            .unwrap()
            .then(() => {
                // Show success message based on decision
                if (decision === 'accept') {
                    toast.success("La tâche a été acceptée avec succès");

                    // Show additional message if the task doesn't require validation
                    if (!task.needsValidation && task.linkedTaskId) {
                        toast.success("La tâche liée a été automatiquement marquée comme complétée");
                    }

                    // Send notifications for accepted tasks in the normal flow too
                    try {
                        console.log("Sending notifications for normal task acceptance flow");

                        // Clear tracking of sent notifications
                        window.__sentNotifications = {};

                        // Send to task assignee
                        if (task.assignee && task.assignee._id) {
                            sendTaskCompletionNotification(task.title, task.assignee._id, false);
                        }

                        // Extract clean base task name
                        const baseTaskName = getCleanTaskName(task.title);

                        // Send to manager/creator if different from assignee
                        if (task.creator && task.creator._id &&
                            (!task.assignee || task.creator._id !== task.assignee._id)) {
                            sendTaskCompletionNotification(baseTaskName, task.creator._id, true);
                        }

                        // If there's a linked task, notify its assignee but NOT the manager again
                        if (linkedTaskData && linkedTaskData.assignee && linkedTaskData.assignee._id) {
                            sendTaskCompletionNotification(linkedTaskData.title, linkedTaskData.assignee._id, false);
                        }
                    } catch (notifError) {
                        console.error("Error sending notifications:", notifError);
                    }
                } else if (decision === 'decline') {
                    toast.success("La tâche a été refusée");
                } else if (decision === 'return') {
                    toast.success("La tâche a été retournée pour modification");

                    // Reset the return reason form
                    setReturnReason('');
                    setShowReturnReason(false);

                    // Send notification to the task assignee
                    if (task.assignee && task.assignee._id) {
                        const message = `Votre tâche "${task.title}" a été retournée pour modification. Raison: ${returnReason}`;

                        // Make a direct request to the notification API
                        axiosInstance.post('/notifications', {
                            type: 'TASK_RETURNED',
                            message,
                            userId: String(task.assignee._id),
                            isRead: false,
                            metadata: {
                                taskTitle: task.title,
                                feedback: returnReason,
                                taskId: task._id,
                                returnedBy: currentUser?._id
                            }
                        })
                            .then(response => {
                                console.log("Return notification sent successfully:", response.data);
                            })
                            .catch(error => {
                                console.error("Error sending return notification:", error);
                            });
                    }
                }

                onClose();
            })
            .catch((error) => {
                toast.error(`Erreur lors de la revue: ${error.message}`);
            })
            .finally(() => {
                setReviewSubmitting(false);
            });
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

    // Add state to track if task is pending manager validation
    const isPendingManagerValidation = React.useMemo(() => {
        return task?.reviewFeedback === 'pending_manager_validation';
    }, [task?.reviewFeedback]);

    const isManager = React.useMemo(() => {
        return currentUser?.role === 'manager' || currentUser?.role === 'admin';
    }, [currentUser?.role]);

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

    // Real notification sending function that calls the backend API
    const sendTaskCompletionNotification = async (taskTitle: string, userId: string, isManager: boolean = false, skipIfDuplicate: boolean = false) => {
        try {
            // Extract clean task name without prefixes
            const cleanTaskName = getCleanTaskName(taskTitle);

            // Log the notification being sent
            console.log(`Sending completion notification for task "${cleanTaskName}" to ${isManager ? 'manager' : 'assignee'} ${userId}`);

            // Create appropriate message based on recipient type
            const message = isManager
                ? `La tâche "${cleanTaskName}" a été validée et terminée`
                : `Votre tâche "${cleanTaskName}" a été validée et terminée`;

            // For duplicate check (used to avoid sending multiple notifications to manager)
            if (skipIfDuplicate && window.__sentNotifications) {
                const key = `${userId}-${cleanTaskName}`;
                if (window.__sentNotifications[key]) {
                    console.log(`Skipping duplicate notification for ${userId} about task "${cleanTaskName}"`);
                    return;
                }
                window.__sentNotifications[key] = true;
            }

            const userData = {
                name: getUserName(currentUser),
                id: currentUser?._id || 'unknown'
            };

            // Make sure userId is a string
            const formattedUserId = String(userId);

            console.log('Authorization header present:', !!axiosInstance.defaults.headers.common['Authorization']);
            console.log('Sending request to:', '/notifications');
            console.log('Request data:', {
                type: isManager ? 'TASK_COMPLETED' : 'TASK_VALIDATED',
                message,
                userId: formattedUserId,
                isRead: false,
                metadata: {
                    taskTitle: cleanTaskName,
                    senderId: userData.id,
                    senderName: userData.name,
                    timestamp: new Date().toISOString()
                }
            });

            // Make a direct request to the notification API using the configured axios instance with auth
            const response = await axiosInstance.post('/notifications', {
                type: isManager ? 'TASK_COMPLETED' : 'TASK_VALIDATED',
                message,
                userId: formattedUserId,
                isRead: false,
                metadata: {
                    taskTitle: cleanTaskName,
                    senderId: userData.id,
                    senderName: userData.name,
                    timestamp: new Date().toISOString()
                }
            });

            if (response.data && response.data.success) {
                console.log(`✅ Notification successfully sent to ${userId}:`, response.data);
                toast.success(`Notification envoyée`);

                // Also try sending via socket directly
                try {
                    // @ts-ignore (socket might not be defined in this scope)
                    if (window.socket && window.socket.connected) {
                        // @ts-ignore
                        window.socket.emit('direct-notification', {
                            userId: formattedUserId,
                            notification: {
                                type: isManager ? 'TASK_COMPLETED' : 'TASK_VALIDATED',
                                message,
                                metadata: {
                                    taskTitle: cleanTaskName,
                                    senderId: userData.id,
                                    senderName: userData.name
                                }
                            }
                        });
                        console.log(`🔌 Socket notification sent to ${userId}`);
                    } else {
                        console.warn(`⚠️ Socket not connected, could not send direct notification to ${userId}`);
                    }
                } catch (socketError) {
                    console.error("Socket notification failed:", socketError);
                }
            } else {
                console.error(`❌ Failed to send notification to ${userId}:`, response.data);
                toast.error(`Erreur lors de l'envoi de la notification`);
            }
        } catch (error: any) {
            console.error("Error sending notification:", error);
            console.error("Error response data:", error.response?.data);
            console.error("Error status:", error.response?.status);
            console.error("Error headers:", error.response?.headers);
            toast.error(`Erreur lors de l'envoi de la notification: ${error.response?.data?.message || error.message}`);
        }
    };

    // Handle manager validation for tasks that were already approved by suivi
    const handleManagerValidation = async (decision: 'accept' | 'decline') => {
        if (!task || !task._id) return;

        try {
            setReviewSubmitting(true);

            if (decision === 'accept') {
                await dispatch(reviewTask({
                    taskId: task._id,
                    decision: 'accept',
                    feedback: 'Validated by manager'
                }));

                toast.success('Tâche validée avec succès');
            } else {
                await dispatch(reviewTask({
                    taskId: task._id,
                    decision: 'decline',
                    feedback: returnReason || 'Returned for modifications by manager'
                }));


                setShowReturnReason(false);
                setReturnReason('');
            }

            setConfirmPopover({ isOpen: false });
            setReviewSubmitting(false);
        } catch (error) {
            console.error('Error reviewing task:', error);
            toast.error('Une erreur est survenue lors de la validation');
            setReviewSubmitting(false);
        }
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
                                            <>
                                                <p>La tâche a été marquée comme prête à être révisée. En tant que responsable de suivi, vous devez valider cette tâche.</p>
                                                {task?.needsValidation && (
                                                    <p className="mt-2 font-medium bg-amber-100 p-2 rounded text-amber-800 border border-amber-200">
                                                        <span className="flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            Cette tâche nécessite une validation du manager après votre approbation
                                                        </span>
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p>La tâche a été marquée comme prête à être révisée par le responsable.</p>
                                        )}

                                        {isCurrentUserSuivi && !showReturnReason && (
                                            <div className="mt-3 flex space-x-3">
                                                <button
                                                    onClick={() => handleReviewTask('accept')}
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
                                                    aria-label="Valider cette tâche"
                                                    disabled={reviewSubmitting || isValidationSentToManager}
                                                >
                                                    <CheckIcon className="h-5 w-5 mr-2" />
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowReturnReason(true);
                                                        setReturnReason('');
                                                    }}
                                                    className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 shadow-sm"
                                                    aria-label="Retourner pour modification"
                                                    disabled={reviewSubmitting || isValidationSentToManager}
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
                                                        onClick={() => {
                                                            console.log("Confirmer button clicked", {
                                                                returnReason,
                                                                returnReasonLength: returnReason?.length,
                                                                isButtonDisabled: !returnReason.trim()
                                                            });
                                                            if (!returnReason.trim()) {
                                                                toast.error("Un feedback est requis pour retourner une tâche");
                                                                return;
                                                            }
                                                            setReviewSubmitting(true);
                                                            handleReviewTask('return');
                                                        }}
                                                        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 shadow-sm disabled:opacity-50"
                                                        disabled={!returnReason.trim() || reviewSubmitting}
                                                        aria-label="Confirmer le retour pour modification"
                                                    >
                                                        {reviewSubmitting ? 'Traitement...' : 'Confirmer'}
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

                    {/* Add validation banner for suivi tasks that are linked to realization tasks */}
                    {isSuiviTask && linkedTaskData && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-green-800">Tâche de suivi liée à une tâche de réalisation</h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>
                                            Cette tâche de suivi est liée à la tâche de réalisation "{linkedTaskData.title}".
                                            {task.status === 'done' && linkedTaskData.status === 'done' && (
                                                <span className="font-semibold"> Les deux tâches ont été validées et terminées.</span>
                                            )}
                                            {task.status === 'done' && linkedTaskData.status !== 'done' && (
                                                <span className="font-semibold"> La tâche de suivi est terminée mais la tâche de réalisation est toujours en cours.</span>
                                            )}
                                            {task.status !== 'done' && linkedTaskData.status === 'done' && (
                                                <span className="font-semibold"> La tâche de réalisation est terminée mais la tâche de suivi est toujours en cours.</span>
                                            )}
                                        </p>
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

                    {/* Completion status banner for done tasks */}
                    {task && task.status === 'done' && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className="text-sm font-medium text-green-800">
                                        {isSuiviTask ? "Cette tâche de suivi a été validée et terminée" :
                                            isRealizationTask ? "Cette tâche de réalisation a été validée et terminée" :
                                                "Cette tâche a été terminée"}
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        {isSuiviTask && linkedTaskData ? (
                                            <p>
                                                {linkedTaskData.status === 'done' ?
                                                    "La tâche de réalisation associée a également été terminée." :
                                                    "La tâche de réalisation associée n'a pas encore été terminée."}
                                            </p>
                                        ) : isRealizationTask && linkedTaskData ? (
                                            <p>
                                                {linkedTaskData.status === 'done' ?
                                                    "Cette tâche a été validée par le responsable de suivi." :
                                                    "Cette tâche est en attente de validation par le responsable de suivi."}
                                            </p>
                                        ) : (
                                            <p>Cette tâche a été complétée avec succès.</p>
                                        )}
                                        {task.completedAt && (
                                            <p className="mt-1">
                                                <span className="font-medium">Date de complétion:</span> {formatDate(task.completedAt.toString())}
                                            </p>
                                        )}
                                    </div>
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
            {/* Show validation sent to manager message */}
            {isValidationSentToManager && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700 font-medium">
                            Cette tâche a été envoyée au manager pour validation finale. Les boutons sont désactivés en attendant la décision du manager.
                        </p>
                    </div>
                </div>
            )}
            {/* Show needs validation message */}
            {task?.needsValidation && !isValidationSentToManager && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-amber-700 font-medium">
                            Cette tâche nécessite la validation finale du manager. Après votre validation, elle sera envoyée au manager pour approbation.
                        </p>
                    </div>
                </div>
            )}
            {/* Always show needs validation message at the top of the panel when needsValidation is true */}
            {task?.needsValidation && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-amber-800">Cette tâche nécessite la validation manager</h3>
                            <p className="mt-1 text-sm text-amber-700">
                                Cette tâche requiert une validation finale du manager après la validation par le responsable de suivi.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {isTaskInReview && (
                <>
                    {/* Add task validation notification for suivi tasks */}
                    {task?.needsValidation && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-700">
                                Cette tâche nécessite une validation du manager après votre approbation.
                            </p>
                        </div>
                    )}

                    {/* Manager validation section */}
                    {isPendingManagerValidation && isManager && (
                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                            <h4 className="text-sm font-medium text-purple-800 mb-2">Validation du manager requise</h4>
                            <p className="text-sm text-purple-700 mb-3">
                                Cette tâche a été approuvée par le responsable de suivi et nécessite votre validation finale.
                            </p>
                            {!showReturnReason ? (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setConfirmPopover({ isOpen: true, type: 'accept' })}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                        disabled={reviewSubmitting}
                                    >
                                        Valider
                                    </button>
                                    <button
                                        onClick={() => setShowReturnReason(true)}
                                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium"
                                        disabled={reviewSubmitting}
                                    >
                                        Retourner
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="return-reason-manager" className="block text-sm font-medium text-gray-700 mb-1">
                                            Raison du retour
                                        </label>
                                        <textarea
                                            id="return-reason-manager"
                                            rows={3}
                                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            placeholder="Veuillez préciser la raison du retour..."
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleManagerValidation('decline')}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                                            disabled={reviewSubmitting}
                                        >
                                            Confirmer le retour
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowReturnReason(false);
                                                setReturnReason('');
                                            }}
                                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                                            disabled={reviewSubmitting}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            {/* Show status of review */}
            {task?.status === 'inReview' && (
                <div>
                    {task.reviewFeedback && task.reviewFeedback !== 'pending_manager_validation' ? (
                        <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-700">
                                <ExclamationTriangleIcon className="inline-block h-5 w-5 mr-1 text-yellow-500" />
                                {task.reviewFeedback}
                            </p>
                        </div>
                    ) : isPendingManagerValidation ? (
                        <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-sm font-medium text-amber-800">
                                <InformationCircleIcon className="inline-block h-5 w-5 mr-1 text-amber-500" />
                                En attente de validation finale par le manager
                            </p>
                        </div>
                    ) : null}
                </div>
            )}
        </>
    );
};

export default TaskDetailPanel;