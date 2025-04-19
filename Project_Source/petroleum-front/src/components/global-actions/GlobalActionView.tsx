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
import { PaperClipIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon, DocumentIcon, PhotoIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface GlobalActionViewProps {
    action: GlobalAction | any;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'details' | 'comments' | 'files';

const GlobalActionView: React.FC<GlobalActionViewProps> = ({ action, isOpen, onClose }) => {
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
                return 'bg-amber-100 text-amber-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-emerald-100 text-emerald-800';
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
                return 'bg-amber-100 text-amber-800';
            case 'inProgress':
                return 'bg-blue-100 text-blue-800';
            case 'inReview':
                return 'bg-purple-100 text-purple-800';
            case 'done':
                return 'bg-emerald-100 text-emerald-800';
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

    const getResponsibleName = () => {
        if (action.source === 'Project' && action.responsible) {
            return `${action.responsible.nom || ''} ${action.responsible.prenom || ''}`.trim();
        } else if (action.responsibleForRealization) {
            return `${action.responsibleForRealization.nom || ''} ${action.responsibleForRealization.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    const getFollowUpName = () => {
        if (action.source === 'Project' && action.manager) {
            return `${action.manager.nom || ''} ${action.manager.prenom || ''}`.trim();
        } else if (action.responsibleForFollowUp) {
            return `${action.responsibleForFollowUp.nom || ''} ${action.responsibleForFollowUp.prenom || ''}`.trim();
        }
        return 'Non assigné';
    };

    const getSourceText = () => {
        if (action.isProjectAction) {
            return 'Action de projet';
        } else {
            return 'Action globale';
        }
    };

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
                return <DocumentIcon className="h-6 w-6 text-red-500" />;
            case 'doc':
            case 'docx':
                return <DocumentIcon className="h-6 w-6 text-blue-500" />;
            case 'xls':
            case 'xlsx':
                return <DocumentIcon className="h-6 w-6 text-green-500" />;
            case 'ppt':
            case 'pptx':
                return <DocumentIcon className="h-6 w-6 text-orange-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <PhotoIcon className="h-6 w-6 text-purple-500" />;
            default:
                return <DocumentIcon className="h-6 w-6 text-gray-500" />;
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

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderDetailsTab = () => (
        <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{action.title}</h2>
                <p className="text-gray-600 mb-3">{action.content}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Catégorie</span>
                        <span className="text-md text-gray-700">{action.category}</span>
                    </div>

                    {(action.projectId && typeof action.projectId === 'object') && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Projet</span>
                            <span className="text-md text-gray-700">{action.projectId.name}</span>
                        </div>
                    )}

                    {action.projectCategory && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Catégorie du projet</span>
                            <span className="text-md text-gray-700">{action.projectCategory}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Responsables</h3>

                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Réalisation</span>
                            <span className="text-md text-gray-700">{getResponsibleName()}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Suivi</span>
                            <span className="text-md text-gray-700">{getFollowUpName()}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Période</h3>

                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Début</span>
                            <span className="text-md text-gray-700">
                                {format(new Date(action.startDate), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Fin</span>
                            <span className="text-md text-gray-700">
                                {format(new Date(action.endDate), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Tâches associées</h3>
                    <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                        {loading ? '...' : actionTasks.length}
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F28C38]"></div>
                    </div>
                ) : actionTasks.length > 0 ? (
                    <div className="space-y-2">
                        {actionTasks.map((task) => (
                            <div key={task._id} className="p-3 border border-gray-200 rounded-lg bg-white transition-all hover:shadow-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                                            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1"></span>
                                            {task.assignee.nom} {task.assignee.prenom}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                        {getTaskStatusLabel(task.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-sm text-gray-500">Aucune tâche associée à cette action.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCommentsTab = () => (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C38]"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {actionComments && actionComments.length > 0 ? (
                        actionComments.map((comment, index) => (
                            <div key={comment._id || index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[#F28C38] bg-opacity-20 flex items-center justify-center text-[#F28C38] text-sm font-medium">
                                            {comment.author.prenom ? comment.author.prenom.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-sm font-semibold text-gray-800">
                                                {comment.author.prenom} {comment.author.nom}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{comment.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Aucun commentaire pour le moment.</p>
                        </div>
                    )}
                </div>
            )}

            {actionTasks.length > 0 && (
                <form onSubmit={handleCommentSubmit} className="mt-4">
                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <textarea
                            rows={4}
                            className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C38] focus:border-transparent resize-none"
                            placeholder="Ajouter un commentaire..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-3">
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-[#F28C38] rounded-md hover:bg-[#e07c28] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] disabled:opacity-50"
                                disabled={!commentText.trim() || loading}
                            >
                                {loading ? 'Envoi...' : 'Envoyer le commentaire'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );

    const renderFilesTab = () => (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F28C38]"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {actionFiles && actionFiles.length > 0 ? (
                        actionFiles.map((file, index) => (
                            <div key={file._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white transition-all hover:shadow-md">
                                <div className="flex items-center space-x-3">
                                    {getFileIcon(file.name)}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-800">{file.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatFileSize(file.size)} · {format(new Date(file.uploadedAt || file.createdAt), 'dd MMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center px-3 py-1.5 text-xs font-medium text-[#F28C38] hover:text-[#e07c28] transition-colors"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                    Télécharger
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <PaperClipIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Aucun fichier attaché pour le moment.</p>
                        </div>
                    )}
                </div>
            )}

            {Object.keys(uploading).length > 0 && (
                <div className="space-y-3 mt-4">
                    {Object.entries(uploading).map(([id, progress]) => (
                        <div key={id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="flex justify-between text-xs text-gray-700 mb-1.5">
                                <span className="font-medium">{id.substring(13)}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-[#F28C38] h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {actionTasks.length > 0 && (
                <div className="mt-6 text-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer inline-block">
                        <div className="flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]">
                            <PaperClipIcon className="h-5 w-5 text-[#F28C38] mr-2" />
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
                                aria-label="Téléverser des fichiers"
                            />
                        </div>
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, PDF, DOCX, XLSX jusqu'à 10MB
                    </p>
                </div>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <>
            {/* Background overlay */}
            <div
                className="fixed inset-0 transition-opacity"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'none',
                    zIndex: 99999
                }}
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal container */}
            <div className="fixed inset-0 z-[100000] flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Center alignment helper */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>

                {/* Modal panel */}
                <div
                    className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
                    style={{ zIndex: 100001, opacity: 1 }}
                >
                    <div className="relative">
                        <button
                            type="button"
                            className="absolute top-4 right-4 p-2 rounded-full text-white hover:bg-white/20 focus:outline-none"
                            onClick={onClose}
                            aria-label="Fermer le modal"
                        >
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-[#F28C38] to-[#f7a254] text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">{action.title}</h2>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor()}`}>
                                        {getSourceText()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                                        {getStatusLabel(action.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 bg-gray-50">
                            <div className="px-6">
                                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`${activeTab === 'details'
                                            ? 'border-[#F28C38] text-[#F28C38]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                                        aria-current={activeTab === 'details' ? 'page' : undefined}
                                    >
                                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                                        Détails
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className={`${activeTab === 'comments'
                                            ? 'border-[#F28C38] text-[#F28C38]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                                        aria-current={activeTab === 'comments' ? 'page' : undefined}
                                    >
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                                        Commentaires
                                        <span className="ml-2 rounded-full bg-gray-200 text-gray-700 text-xs px-2 py-0.5">
                                            {actionComments?.length || 0}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('files')}
                                        className={`${activeTab === 'files'
                                            ? 'border-[#F28C38] text-[#F28C38]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                                        aria-current={activeTab === 'files' ? 'page' : undefined}
                                    >
                                        <PaperClipIcon className="h-5 w-5 mr-2" />
                                        Fichiers
                                        <span className="ml-2 rounded-full bg-gray-200 text-gray-700 text-xs px-2 py-0.5">
                                            {actionFiles?.length || 0}
                                        </span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {activeTab === 'details' && renderDetailsTab()}
                            {activeTab === 'comments' && renderCommentsTab()}
                            {activeTab === 'files' && renderFilesTab()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GlobalActionView;