import React, { useEffect, useState, useRef } from 'react';
import { GlobalAction } from '../../store/slices/globalActionSlice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    fetchTasksWithCommentsForAction,
    addCommentToActionTask,
    uploadFileToActionTask
} from '../../store/slices/taskSlice';
import { PaperClipIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface GlobalActionViewProps {
    action: GlobalAction | any; // Accept any action type
}

type TabType = 'details' | 'comments' | 'files';

const GlobalActionView: React.FC<GlobalActionViewProps> = ({ action }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { actionTasks, actionComments, actionFiles, loading } = useSelector((state: RootState) => state.tasks);
    const { user } = useSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [commentText, setCommentText] = useState('');
    const [uploading, setUploading] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (action && action._id) {
            dispatch(fetchTasksWithCommentsForAction({
                actionId: action._id,
                isProjectAction: !!action.isProjectAction
            }));
        }
    }, [action, dispatch]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'À faire';
            case 'in_progress':
                return 'En cours';
            case 'completed':
                return 'Terminé';
            case 'cancelled':
                return 'Annulé';
            default:
                return status;
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'todo':
                return 'bg-yellow-100 text-yellow-800';
            case 'inProgress':
                return 'bg-blue-100 text-blue-800';
            case 'inReview':
                return 'bg-purple-100 text-purple-800';
            case 'done':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTaskStatusLabel = (status: string) => {
        switch (status) {
            case 'todo':
                return 'À faire';
            case 'inProgress':
                return 'En cours';
            case 'inReview':
                return 'En revue';
            case 'done':
                return 'Terminé';
            default:
                return status;
        }
    };

    // Helper function to get user name from either responsible or responsibleForRealization
    const getResponsibleName = () => {
        if (action.source === 'Project' && action.responsible) {
            return `${action.responsible.nom || ''} ${action.responsible.prenom || ''}`.trim();
        } else if (action.responsibleForRealization) {
            return `${action.responsibleForRealization.nom || ''} ${action.responsibleForRealization.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    // Helper function to get follow-up name from either manager or responsibleForFollowUp
    const getFollowUpName = () => {
        if (action.source === 'Project' && action.manager) {
            return `${action.manager.nom || ''} ${action.manager.prenom || ''}`.trim();
        } else if (action.responsibleForFollowUp) {
            return `${action.responsibleForFollowUp.nom || ''} ${action.responsibleForFollowUp.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    // Get the source text to display
    const getSourceText = () => {
        if (action.isProjectAction) {
            return 'Action de projet';
        } else {
            return 'Action globale';
        }
    };

    // Get source badge color
    const getSourceColor = () => {
        if (action.isProjectAction) {
            return 'bg-indigo-100 text-indigo-800';
        } else {
            return 'bg-emerald-100 text-emerald-800';
        }
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return 'file-pdf';
            case 'doc':
            case 'docx':
                return 'file-word';
            case 'xls':
            case 'xlsx':
                return 'file-excel';
            case 'ppt':
            case 'pptx':
                return 'file-powerpoint';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'file-image';
            default:
                return 'file';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !action._id) return;

        try {
            if (actionTasks.length > 0) {
                // Add comment to the first task
                const taskId = actionTasks[0]._id;

                await dispatch(addCommentToActionTask({
                    taskId,
                    text: commentText,
                    actionId: action._id,
                    isProjectAction: !!action.isProjectAction
                })).unwrap();

                setCommentText('');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !action._id || actionTasks.length === 0) return;

        const taskId = actionTasks[0]._id;

        Array.from(files).forEach(async (file) => {
            const fileId = Date.now().toString() + file.name;
            setUploading(prev => ({ ...prev, [fileId]: 0 }));

            try {
                // Show progress animation
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 5;
                    setUploading(prev => ({ ...prev, [fileId]: Math.min(progress, 95) }));
                    if (progress >= 95) {
                        clearInterval(interval);
                    }
                }, 200);

                await dispatch(uploadFileToActionTask({
                    taskId,
                    file,
                    actionId: action._id,
                    isProjectAction: !!action.isProjectAction
                })).unwrap();

                clearInterval(interval);
                setUploading(prev => ({ ...prev, [fileId]: 100 }));

                // Clear uploaded file after a short delay
                setTimeout(() => {
                    setUploading(prev => {
                        const newState = { ...prev };
                        delete newState[fileId];
                        return newState;
                    });
                }, 1000);
            } catch (error) {
                console.error('Failed to upload file:', error);
                setUploading(prev => {
                    const newState = { ...prev };
                    delete newState[fileId];
                    return newState;
                });
            }
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderDetailsTab = () => (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Titre</h3>
                    <p className="text-sm">{action.title}</p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700">Catégorie</h3>
                    <p className="text-sm">{action.category}</p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-700">Contenu</h3>
                <p className="text-sm">{action.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(action.projectId && typeof action.projectId === 'object') && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Projet</h3>
                        <p className="text-sm">{action.projectId.name}</p>
                    </div>
                )}

                {action.projectCategory && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Catégorie du projet</h3>
                        <p className="text-sm">{action.projectCategory}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Responsable de réalisation</h3>
                    <p className="text-sm">{getResponsibleName()}</p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-700">Responsable de suivi</h3>
                    <p className="text-sm">{getFollowUpName()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-700">Dates</h3>
                    <p className="text-sm">
                        Du {format(new Date(action.startDate), 'dd/MM/yyyy', { locale: fr })} au{' '}
                        {format(new Date(action.endDate), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                </div>
            </div>

            {/* Related Tasks Section */}
            <div className="border-t border-gray-200 pt-3 mt-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tâches associées ({loading ? '...' : actionTasks.length})</h3>

                {loading ? (
                    <p className="text-sm text-gray-500">Chargement des tâches...</p>
                ) : actionTasks.length > 0 ? (
                    <div className="space-y-2">
                        {actionTasks.map((task) => (
                            <div key={task._id} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium">{task.title}</p>
                                        <p className="text-xs text-gray-500">
                                            Assigné à: {task.assignee.nom} {task.assignee.prenom}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                        {getTaskStatusLabel(task.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Aucune tâche associée à cette action.</p>
                )}
            </div>
        </div>
    );

    const renderCommentsTab = () => (
        <div className="space-y-4">
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Chargement des commentaires...</p>
                    </div>
                ) : actionComments && actionComments.length > 0 ? (
                    actionComments.map((comment, index) => (
                        <div key={comment._id || index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                                        {comment.author.prenom ? comment.author.prenom.charAt(0) : '?'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {comment.author.prenom} {comment.author.nom}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Aucun commentaire pour le moment.</p>
                    </div>
                )}
            </div>

            {actionTasks.length > 0 && (
                <form onSubmit={handleCommentSubmit} className="mt-4">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Ajouter un commentaire..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-2">
                            <button
                                type="submit"
                                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={!commentText.trim() || loading}
                            >
                                {loading ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );

    const renderFilesTab = () => (
        <div className="space-y-4">
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Chargement des fichiers...</p>
                    </div>
                ) : actionFiles && actionFiles.length > 0 ? (
                    actionFiles.map((file, index) => (
                        <div key={file._id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center space-x-3">
                                <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)} · Ajouté le {format(new Date(file.uploadedAt || file.createdAt), 'dd/MM/yyyy', { locale: fr })}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-500"
                            >
                                Télécharger
                            </a>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Aucun fichier attaché pour le moment.</p>
                    </div>
                )}
            </div>

            {/* Show upload progress */}
            {Object.keys(uploading).length > 0 && (
                <div className="space-y-2 mt-2">
                    {Object.entries(uploading).map(([id, progress]) => (
                        <div key={id} className="bg-gray-100 rounded-md p-2">
                            <div className="flex justify-between text-xs text-gray-700 mb-1">
                                <span>{id.substring(13)}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {actionTasks.length > 0 && (
                <div className="mt-4">
                    <label htmlFor="file-upload" className="relative cursor-pointer">
                        <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span>Ajouter des fichiers</span>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                disabled={loading}
                            />
                        </div>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, PDF, DOCX, XLSX jusqu'à 10MB
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor()}`}>
                    {getSourceText()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                    {getStatusLabel(action.status)}
                </span>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`${activeTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                        Détails
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`${activeTab === 'comments'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                        Commentaires
                        <span className="ml-2 rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                            {actionComments?.length || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`${activeTab === 'files'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <PaperClipIcon className="h-5 w-5 mr-2" />
                        Fichiers
                        <span className="ml-2 rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                            {actionFiles?.length || 0}
                        </span>
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="py-2">
                {activeTab === 'details' && renderDetailsTab()}
                {activeTab === 'comments' && renderCommentsTab()}
                {activeTab === 'files' && renderFilesTab()}
            </div>
        </div>
    );
};

export default GlobalActionView; 