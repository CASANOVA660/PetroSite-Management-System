import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { fetchUserTasks, updateTaskStatus, addNewTask, updateTask } from '../store/slices/taskSlice';
import { RootState, AppDispatch } from '../store';
import { toast, Toaster } from 'react-hot-toast';
import socket from '../utils/socket';
import { PlusIcon, CheckIcon, ChatBubbleLeftRightIcon, PaperClipIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageMeta from '../components/common/PageMeta';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

// Update the Task interface to include inReview status
interface Task {
    _id: string;
    title: string;
    description: string;
    assignee: {
        _id: string;
        nom: string;
        prenom: string;
    };
    status: 'todo' | 'inProgress' | 'inReview' | 'done';
    progress?: number;
    startDate?: string;
    endDate?: string;
}

interface TaskTag {
    id: string;
    name: string;
    color: string;
}

const formatDate = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);

    // If it's today, return "Aujourd'hui"
    if (date.toDateString() === today.toDateString()) {
        return 'Aujourd\'hui';
    }

    // Otherwise, return formatted date
    return date.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
    });
};

const getDaysRemaining = (endDateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateString);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: Math.abs(diffDays), overdue: true };
    return { days: diffDays, overdue: false };
};

const ProgressBar = ({ percentage }: { percentage: number }) => {
    return (
        <div className="w-full mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-500">Progression</span>
                <span className="text-xs font-medium text-gray-700">{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                    className="h-full rounded-full bg-[#F28C38]"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const ProgressDots = ({ percentage, total = 10 }: { percentage: number, total?: number }) => {
    const filledDots = Math.floor((percentage / 100) * total);

    return (
        <div className="flex space-x-1 mt-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < filledDots ? 'bg-[#F28C38]' : 'bg-gray-200'}`}
                ></div>
            ))}
        </div>
    );
};

const TaskCard = ({ task, index, onViewDetails }: { task: any, index: number, onViewDetails: (task: any) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Generate tags from task properties
    const tags: TaskTag[] = [
        { id: '1', name: task.project?.name || 'projet', color: 'bg-blue-100 text-blue-600' },
        { id: '2', name: 'client', color: 'bg-gray-100 text-gray-600' }
    ];

    // Calculate progress randomly for demo (in real app, this would come from task data)
    const progress = task.progress || Math.floor(Math.random() * 100);

    // Calculate days remaining
    const { days, overdue } = task.endDate ? getDaysRemaining(task.endDate) : { days: 0, overdue: false };

    return (
        <div className="bg-white rounded-xl shadow p-4 mb-3 border border-gray-200">
            {/* Title and collapse button */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
                >
                    {isExpanded ?
                        <ChevronUpIcon className="w-5 h-5" /> :
                        <ChevronDownIcon className="w-5 h-5" />
                    }
                </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                    <span
                        key={tag.id}
                        className={`text-xs px-2 py-1 rounded-md ${tag.color}`}
                    >
                        #{tag.name}
                    </span>
                ))}
            </div>

            {/* Progress bar */}
            <ProgressBar percentage={progress} />

            {/* Timeline information with icons */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                <div className="flex items-center mb-2 text-xs text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-medium mr-1">Début:</span>
                    <span>{task.startDate ? formatDate(task.startDate) : 'Non défini'}</span>
                </div>

                <div className="flex items-center text-xs text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-medium mr-1">Échéance:</span>
                    <span>{task.endDate ? formatDate(task.endDate) : 'Aucune échéance'}</span>
                </div>

                {task.endDate && (
                    <div className={`flex items-center mt-2 text-xs ${overdue ? 'text-red-500' : 'text-gray-600'}`}>
                        <ClockIcon className={`w-4 h-4 mr-1 ${overdue ? 'text-red-500' : 'text-gray-500'}`} />
                        <span className="font-medium mr-1">{overdue ? 'En retard:' : 'Reste:'}</span>
                        <span>
                            {days} jour{days !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Description - only visible when expanded */}
            {isExpanded && (
                <div className="text-sm text-gray-600 mb-3 border-t border-b border-gray-100 py-2">
                    {task.description || "Aucune description fournie."}
                </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex justify-between items-center">
                {/* Avatars */}
                <div className="flex -space-x-2">
                    <img
                        src={`https://ui-avatars.com/api/?name=${task.assignee.prenom}+${task.assignee.nom}&background=random`}
                        alt={`${task.assignee.prenom} ${task.assignee.nom}`}
                        className="w-7 h-7 rounded-full border-2 border-white"
                    />
                </div>

                {/* View details button */}
                <button
                    className="text-xs flex items-center text-[#F28C38] hover:text-[#e07520] font-medium"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(task);
                    }}
                >
                    <EyeIcon className="w-3 h-3 mr-1" />
                    Voir détails
                </button>
            </div>
        </div>
    );
};

const TaskColumn = ({ title, tasks, droppableId, onViewDetails }: { title: string, tasks: any[], droppableId: string, onViewDetails: (task: any) => void }) => {
    const statusLabels = {
        todo: "À faire",
        inProgress: "En cours",
        inReview: "En revue",
        done: "Terminé"
    };

    const frenchTitle = statusLabels[droppableId as keyof typeof statusLabels] || title;

    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">{frenchTitle}</h2>
                    <div className="flex space-x-2">
                        <button className="p-1 rounded-md hover:bg-gray-200">
                            <PlusIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-gray-200">
                            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="5" cy="12" r="2" fill="currentColor" />
                                <circle cx="12" cy="12" r="2" fill="currentColor" />
                                <circle cx="19" cy="12" r="2" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <Droppable droppableId={droppableId}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 min-h-[200px]"
                    >
                        {tasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <TaskCard task={task} index={index} onViewDetails={onViewDetails} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

const Tasks: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks, loading, error } = useSelector((state: RootState) => state.tasks);
    const { user } = useSelector((state: RootState) => state.auth);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

    // Filter tasks to show only those assigned to the current user
    const filterTasksByCurrentUser = (tasksObj: any) => {
        if (!user || !user._id) return { todo: [], inProgress: [], inReview: [], done: [] };

        const filteredTasks = Object.keys(tasksObj).reduce((acc: any, status) => {
            // Filter tasks for each status category
            acc[status] = tasksObj[status]?.filter((task: any) =>
                task.assignee && task.assignee._id === user._id
            ) || [];
            return acc;
        }, {});

        // Ensure all status arrays exist
        return {
            todo: filteredTasks.todo || [],
            inProgress: filteredTasks.inProgress || [],
            inReview: filteredTasks.inReview || [],
            done: filteredTasks.done || []
        };
    };

    // Filter tasks by current user
    const taskData = filterTasksByCurrentUser(tasks);

    // Get today's date in format "Day Month Date, Year"
    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Fetch tasks on component mount
    useEffect(() => {
        const loadTasks = async () => {
            try {
                await dispatch(fetchUserTasks()).unwrap();
            } catch (err) {
                toast.error('Erreur lors du chargement des tâches');
            }
        };
        loadTasks();
    }, [dispatch]);

    // Handle socket events
    useEffect(() => {
        if (!user?._id) return;

        const handleNewTask = (task: any) => {
            if (task.assignee._id === user._id) {
                dispatch(addNewTask(task));
                toast.success('Nouvelle tâche assignée');
            }
        };

        const handleTaskUpdate = (task: any) => {
            if (task.assignee._id === user._id) {
                dispatch(updateTask(task));
            }
        };

        socket.on('newTask', handleNewTask);
        socket.on('taskUpdated', handleTaskUpdate);

        return () => {
            socket.off('newTask', handleNewTask);
            socket.off('taskUpdated', handleTaskUpdate);
        };
    }, [dispatch, user?._id]);

    const handleDragEnd = useCallback(async (result: any) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        try {
            await dispatch(updateTaskStatus({ taskId: draggableId, status: newStatus })).unwrap();
            toast.success('Statut de la tâche mis à jour');
        } catch (err) {
            toast.error('Erreur lors de la mise à jour du statut');
        }
    }, [dispatch]);

    const openAddTaskModal = () => {
        setIsAddTaskModalOpen(true);
    };

    const closeAddTaskModal = () => {
        setIsAddTaskModalOpen(false);
    };

    const handleAddTask = (task: any) => {
        console.log('Nouvelle tâche à ajouter:', task);
        // Here you would typically dispatch an action to add the task
        toast.success('Tâche ajoutée avec succès');
    };

    const handleViewTaskDetails = (task: any) => {
        setSelectedTask(task);
        setIsTaskDetailOpen(true);
    };

    const closeTaskDetails = () => {
        setIsTaskDetailOpen(false);
    };

    if (loading && Object.keys(tasks).length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Tâches" description="Tableau de gestion des tâches" />
            <Toaster position="bottom-right" />

            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center mb-2">
                            <h1 className="text-2xl font-bold mr-4">Tableau</h1>
                            <button className="text-gray-500 flex items-center text-sm border border-gray-300 rounded-md px-3 py-1">
                                <span>Tâches quotidiennes</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('fr-FR', { month: 'long' })}<br />Aujourd'hui: {today}</p>
                    </div>

                    {/* User Avatars */}
                    <div className="flex items-center mt-4 md:mt-0">
                        <div className="flex -space-x-2 mr-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <img
                                    key={i}
                                    src={`https://ui-avatars.com/api/?name=User+${i}&background=random`}
                                    alt={`Utilisateur ${i}`}
                                    className="w-8 h-8 rounded-full border-2 border-white"
                                />
                            ))}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button className="flex items-center text-gray-700 border border-gray-300 rounded-md px-3 py-2">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <span>Filtres</span>
                            </button>

                            <button
                                onClick={openAddTaskModal}
                                className="bg-[#F28C38] text-white rounded-md px-3 py-2 flex items-center"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                <span>Créer une tâche</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Todo Column */}
                        <TaskColumn
                            title="À faire"
                            tasks={taskData.todo || []}
                            droppableId="todo"
                            onViewDetails={handleViewTaskDetails}
                        />

                        {/* In Progress Column */}
                        <TaskColumn
                            title="En cours"
                            tasks={taskData.inProgress || []}
                            droppableId="inProgress"
                            onViewDetails={handleViewTaskDetails}
                        />

                        {/* In Review Column */}
                        <TaskColumn
                            title="En revue"
                            tasks={taskData.inReview || []}
                            droppableId="inReview"
                            onViewDetails={handleViewTaskDetails}
                        />

                        {/* Done Column */}
                        <TaskColumn
                            title="Terminé"
                            tasks={taskData.done || []}
                            droppableId="done"
                            onViewDetails={handleViewTaskDetails}
                        />
                    </div>
                </DragDropContext>
            </div>

            {isAddTaskModalOpen && (
                <AddTaskModal
                    isOpen={isAddTaskModalOpen}
                    onClose={closeAddTaskModal}
                    onAdd={handleAddTask}
                />
            )}

            <TaskDetailPanel
                isOpen={isTaskDetailOpen}
                onClose={closeTaskDetails}
                task={selectedTask}
            />
        </>
    );
};

export default Tasks;