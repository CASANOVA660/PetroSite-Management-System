import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    XMarkIcon,
    ClockIcon,
    CalendarIcon,
    CheckIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { fetchTaskHistory } from '../../store/slices/taskSlice';
import { toast } from 'react-hot-toast';

interface HistoryItem {
    _id: string;
    title: string;
    description?: string;
    content?: string;
    status: string;
    startDate?: string;
    endDate?: string;
    completedAt?: string;
    updatedAt?: string;
    progress?: number;
    assignee?: {
        _id: string;
        nom: string;
        prenom: string;
    };
    responsible?: {
        _id: string;
        nom: string;
        prenom: string;
    };
    responsibleForRealization?: {
        _id: string;
        nom: string;
        prenom: string;
    };
    responsibleForFollowUp?: {
        _id: string;
        nom: string;
        prenom: string;
    };
    manager?: {
        _id: string;
        nom: string;
        prenom: string;
    };
    project?: {
        _id: string;
        name: string;
    };
    source?: string;
}

interface TaskHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

const panelStyles: React.CSSProperties = {
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 100000,
    overflowY: 'auto',
    padding: '24px',
    maxWidth: '90%',
    maxHeight: '90%',
    width: '800px',
    borderRadius: '8px',
    transition: 'transform 0.3s ease, opacity 0.3s ease'
};

const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
};

const TaskHistory: React.FC<TaskHistoryProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks, history } = useSelector((state: RootState) => state.tasks);
    const { actions: projectActions } = useSelector((state: RootState) => state.actions);
    const { actions: globalActions } = useSelector((state: RootState) => state.globalActions);
    const { user } = useSelector((state: RootState) => state.auth);

    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'tasks' | 'actions'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch task history when the modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            dispatch(fetchTaskHistory())
                .unwrap()
                .then(() => {
                    console.log("Successfully fetched task history");
                })
                .catch((error) => {
                    console.error("Error fetching task history:", error);
                    toast.error("Impossible de charger l'historique des tâches");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [dispatch, isOpen]);

    // Combine and format completed items
    useEffect(() => {
        if (!user?._id) return;

        // Active completed tasks from the current task board
        const activeDoneTasks = tasks.done?.filter(task =>
            task.assignee && task.assignee._id === user._id
        ) || [];

        // Archived tasks from history (which are already done/completed)
        const archivedTasks = history?.filter(task =>
            task.assignee && task.assignee._id === user._id
        ) || [];

        console.log(`Combining ${activeDoneTasks.length} active done tasks with ${archivedTasks.length} archived tasks`);

        // Convert both to the history item format
        const formattedActiveTasks = activeDoneTasks.map(task => ({
            ...task,
            source: 'task'
        }));

        const formattedArchivedTasks = archivedTasks.map(task => ({
            ...task,
            source: 'task'
        }));

        // Get all other action types
        const completedGlobalActions = globalActions
            .filter(action =>
                action.status === 'completed' &&
                ((action.responsibleForRealization && action.responsibleForRealization._id === user._id) ||
                    (action.responsibleForFollowUp && action.responsibleForFollowUp._id === user._id))
            )
            .map(action => ({
                ...action,
                source: 'global'
            }));

        const completedProjectActions = projectActions
            .filter(action =>
                action.status === 'completed' &&
                ((action.responsible && action.responsible._id === user._id) ||
                    (action.manager && action.manager._id === user._id))
            )
            .map(action => ({
                ...action,
                source: 'project'
            }));

        // Combine all items (both active and archived)
        const allCompletedItems = [
            ...formattedActiveTasks,
            ...formattedArchivedTasks,
            ...completedGlobalActions,
            ...completedProjectActions
        ];

        // Remove duplicates by ID
        const uniqueItemsMap = new Map();
        allCompletedItems.forEach(item => {
            if (item._id) {
                uniqueItemsMap.set(item._id, item);
            }
        });

        const uniqueItems = Array.from(uniqueItemsMap.values());

        // Sort by completion/update date
        const sortedItems = uniqueItems.sort((a, b) => {
            const getRelevantDate = (item: HistoryItem) =>
                item.completedAt || item.endDate || item.updatedAt || '';
            const dateA = getRelevantDate(a);
            const dateB = getRelevantDate(b);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        setHistoryItems(sortedItems);
    }, [tasks, globalActions, projectActions, user, history]);

    // Debounced search handler
    const handleSearch = useCallback(
        debounce((value: string) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    // Apply filters and search
    const filteredHistoryItems = historyItems.filter(item => {
        if (filter === 'tasks' && item.source !== 'task') return false;
        if (filter === 'actions' && item.source === 'task') return false;

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                item.title?.toLowerCase().includes(search) ||
                (item.description?.toLowerCase().includes(search) || item.content?.toLowerCase().includes(search)) ||
                (item.project?.name && item.project.name.toLowerCase().includes(search))
            );
        }

        return true;
    });

    // Calculate pagination
    useEffect(() => {
        setTotalPages(Math.ceil(filteredHistoryItems.length / pageSize));
        // Reset to first page when filters change
        if (currentPage > Math.ceil(filteredHistoryItems.length / pageSize)) {
            setCurrentPage(1);
        }
    }, [filteredHistoryItems, pageSize]);

    // Get current page items
    const currentItems = filteredHistoryItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset current page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filter]);

    // Pagination controls
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return format(date, 'dd MMMM yyyy', { locale: fr });
        } catch (error) {
            return 'Date invalide';
        }
    };

    const getRelevantDate = (item: HistoryItem) => {
        return item.endDate || item.updatedAt || '';
    };

    const getItemColor = (source?: string) => {
        switch (source) {
            case 'task':
                return 'bg-blue-600';
            case 'global':
                return 'bg-purple-600';
            case 'project':
                return 'bg-emerald-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getItemTitle = (item: HistoryItem) => {
        switch (item.source) {
            case 'task':
                return 'Tâche terminée';
            case 'global':
                return 'Action globale terminée';
            case 'project':
                return `Action de projet terminée${item.project ? ` - ${item.project.name}` : ''}`;
            default:
                return 'Élément terminé';
        }
    };

    const getItemPerson = (item: HistoryItem) => {
        if (item.assignee) return item.assignee;
        if (item.responsible) return item.responsible;
        if (item.responsibleForRealization) return item.responsibleForRealization;
        if (item.manager) return item.manager;
        return null;
    };

    const toggleItemExpansion = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    if (!isOpen) return null;

    return (
        <div style={backdropStyles} onClick={onClose}>
            <div
                style={{
                    ...panelStyles,
                    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
                    opacity: isOpen ? 1 : 0
                }}
                className="flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="history-title"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ zIndex: 100001 }}
                    aria-label="Fermer l'historique"
                >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 id="history-title" className="text-2xl font-bold text-gray-900">
                        Historique des tâches terminées
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredHistoryItems.length} élément{filteredHistoryItems.length !== 1 ? 's' : ''} trouvé{filteredHistoryItems.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Filters */}
                <div className="sticky top-0 bg-white z-10 pb-4 mb-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                            <FunnelIcon className="h-5 w-5 text-gray-500" />
                            <div className="flex rounded-md bg-gray-100 p-1">
                                {['all', 'tasks', 'actions'].map(type => (
                                    <button
                                        key={type}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === type
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                        onClick={() => setFilter(type as 'all' | 'tasks' | 'actions')}
                                        aria-pressed={filter === type}
                                    >
                                        {type === 'all' ? 'Tous' : type === 'tasks' ? 'Tâches' : 'Actions'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par titre, description ou projet..."
                                className="w-full pl-10 pr-10 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                onChange={(e) => handleSearch(e.target.value)}
                                aria-label="Rechercher dans l'historique"
                            />
                            {searchTerm && (
                                <button
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Effacer la recherche"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F28C38]"></div>
                        </div>
                    ) : filteredHistoryItems.length > 0 ? (
                        <>
                            <div className="space-y-6">
                                {currentItems.map((item) => (
                                    <div key={item._id} className="relative pl-10">
                                        <div className={`absolute left-0 top-2 w-3 h-3 rounded-full ${getItemColor(item.source)}`} />
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-medium text-gray-500">{getItemTitle(item)}</span>
                                                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{item.title}</h3>
                                                </div>
                                                <button
                                                    onClick={() => toggleItemExpansion(item._id)}
                                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                                    aria-expanded={expandedItems.has(item._id)}
                                                    aria-controls={`details-${item._id}`}
                                                >
                                                    {expandedItems.has(item._id) ? 'Masquer' : 'Détails'}
                                                </button>
                                            </div>
                                            {expandedItems.has(item._id) && (
                                                <div id={`details-${item._id}`} className="mt-3 space-y-3">
                                                    {(item.description || item.content) && (
                                                        <p className="text-gray-600 text-sm">{item.description || item.content}</p>
                                                    )}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                        {getItemPerson(item) && (
                                                            <div className="flex items-center">
                                                                <div className="mr-2 w-6 h-6 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                                    <img
                                                                        src={`https://ui-avatars.com/api/?name=${getItemPerson(item)?.prenom}+${getItemPerson(item)?.nom}&background=random`}
                                                                        alt={`${getItemPerson(item)?.prenom} ${getItemPerson(item)?.nom}`}
                                                                    />
                                                                </div>
                                                                <span className="text-gray-700">
                                                                    {getItemPerson(item)?.prenom} {getItemPerson(item)?.nom}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {(item.startDate || item.endDate) && (
                                                            <div className="space-y-1">
                                                                {item.startDate && (
                                                                    <div className="flex items-center text-gray-600">
                                                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                                                        Début: {formatDate(item.startDate)}
                                                                    </div>
                                                                )}
                                                                {item.endDate && (
                                                                    <div className="flex items-center text-gray-600">
                                                                        <ClockIcon className="h-4 w-4 mr-2" />
                                                                        Fin: {formatDate(item.endDate)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-2 text-xs text-gray-500">
                                                Terminé le {formatDate(getRelevantDate(item))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span>
                                            Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, filteredHistoryItems.length)} sur {filteredHistoryItems.length} éléments
                                        </span>
                                        <select
                                            className="ml-4 rounded-md border-gray-300 py-1 text-sm"
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                            aria-label="Éléments par page"
                                        >
                                            {[5, 10, 20, 50].map(size => (
                                                <option key={size} value={size}>
                                                    {size} par page
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`rounded-md p-1 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                                            aria-label="Page précédente"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5" />
                                        </button>

                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            // Show first page, last page, current page, and one page before and after current
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                page === currentPage ||
                                                page === currentPage - 1 ||
                                                page === currentPage + 1
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`px-3 py-1 rounded-md ${currentPage === page
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-gray-500 hover:bg-gray-100'
                                                            }`}
                                                        aria-current={currentPage === page ? 'page' : undefined}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                (page === 2 && currentPage > 3) ||
                                                (page === totalPages - 1 && currentPage < totalPages - 2)
                                            ) {
                                                // Show ellipsis for skipped pages
                                                return <span key={page} className="px-2 text-gray-500">...</span>;
                                            } else {
                                                return null;
                                            }
                                        })}

                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className={`rounded-md p-1 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                                            aria-label="Page suivante"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6h4m-4 4v10m-6-6h12" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élément terminé</h3>
                            <p className="text-gray-500 max-w-md text-sm">
                                {searchTerm
                                    ? "Aucun résultat pour votre recherche. Essayez un autre terme."
                                    : "Vos tâches et actions terminées apparaîtront ici une fois complétées."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskHistory;