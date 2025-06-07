import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    ChartBarIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationCircleIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon,
    XMarkIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';
import {
    fetchMilestones,
    fetchProgress,
    createProgress,
    createMilestone,
    createMilestoneTask,
    updateMilestone,
    updateMilestoneTask,
    Milestone,
    OperationProgress as ProgressData,
    MilestoneTask
} from '../../store/slices/operationSlice';
import { toast } from 'react-hot-toast';

interface OperationProgressProps {
    projectId: string;
    initialMilestones?: Milestone[];
}

const OperationProgress: React.FC<OperationProgressProps> = ({ projectId, initialMilestones = [] }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { milestones: storeMilestones, data: progressData, loading } = useSelector((state: RootState) => state.operation.progress);

    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>('ms3'); // Default to in-progress milestone
    const [progressSummary, setProgressSummary] = useState({
        overall: 0,
        completed: 0,
        inProgress: 0,
        planned: 0,
        delayed: 0
    });
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState<{
        name: string;
        description: string;
        plannedDate: string;
        status: 'planned' | 'in-progress' | 'completed' | 'delayed';
    }>({
        name: '',
        description: '',
        plannedDate: new Date().toISOString().split('T')[0],
        status: 'planned'
    });
    const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
    const [editMilestoneData, setEditMilestoneData] = useState<{
        id: string;
        status: 'completed' | 'in-progress' | 'planned' | 'delayed';
        actualDate?: string;
    } | null>(null);
    const [editingTask, setEditingTask] = useState<string | null>(null);
    const [editTaskData, setEditTaskData] = useState<{
        id: string;
        milestoneId: string;
        status: 'completed' | 'in-progress' | 'planned' | 'delayed';
        completionPercentage: number;
    } | null>(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [currentMilestoneForTask, setCurrentMilestoneForTask] = useState<string | null>(null);
    const [newTask, setNewTask] = useState<{
        name: string;
        status: 'completed' | 'in-progress' | 'planned' | 'delayed';
        completionPercentage: number;
        startDate: string;
        endDate: string;
        dependsOn?: string[];
    }>({
        name: '',
        status: 'planned',
        completionPercentage: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dependsOn: []
    });

    useEffect(() => {
        if (projectId) {
            // Fetch real data from the API
            dispatch(fetchMilestones(projectId));
            dispatch(fetchProgress(projectId));
        }
    }, [projectId, dispatch]);

    useEffect(() => {
        // If initialMilestones is provided, use it
        if (initialMilestones && initialMilestones.length > 0) {
            setMilestones(initialMilestones);
            // Don't call calculateProgress here, it will be handled in a separate effect
        } else if (storeMilestones && storeMilestones.length > 0) {
            // Use data from Redux store
            setMilestones(storeMilestones);
            // Don't call calculateProgress here, it will be handled in a separate effect
        }
    }, [initialMilestones, storeMilestones]);

    // Separate effect to calculate progress when milestones change
    useEffect(() => {
        if (milestones.length > 0) {
            calculateProgress(milestones);
        }
    }, [milestones]);

    const calculateProgress = (milestoneData: Milestone[]) => {
        let totalTasks = 0;
        let completedTasks = 0;
        let inProgressTasks = 0;
        let plannedTasks = 0;
        let delayedTasks = 0;

        milestoneData.forEach(milestone => {
            milestone.tasks.forEach(task => {
                totalTasks++;
                switch (task.status) {
                    case 'completed':
                        completedTasks++;
                        break;
                    case 'in-progress':
                        inProgressTasks++;
                        break;
                    case 'planned':
                        plannedTasks++;
                        break;
                    case 'delayed':
                        delayedTasks++;
                        break;
                }
            });
        });

        const overallProgress = totalTasks > 0 ? (completedTasks + (inProgressTasks * 0.5)) / totalTasks * 100 : 0;

        setProgressSummary({
            overall: Math.round(overallProgress),
            completed: completedTasks,
            inProgress: inProgressTasks,
            planned: plannedTasks,
            delayed: delayedTasks
        });
    };

    const toggleMilestone = (milestoneId: string) => {
        setExpandedMilestone(expandedMilestone === milestoneId ? null : milestoneId);
    };

    // Helper function to create a demo milestone with sample tasks
    const createDemoMilestone = (milestoneData: any): Milestone => {
        const newId = `ms${milestones.length + 1}`;
        const startDate = new Date(milestoneData.plannedDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 14); // Two weeks after planned date

        // Create 1-3 random tasks
        const numTasks = Math.floor(Math.random() * 3) + 1;
        const tasks: MilestoneTask[] = [];

        for (let i = 0; i < numTasks; i++) {
            const taskStartDate = new Date(startDate);
            taskStartDate.setDate(taskStartDate.getDate() + (i * 3)); // 3 days apart

            const taskEndDate = new Date(taskStartDate);
            taskEndDate.setDate(taskEndDate.getDate() + 5); // 5 days duration

            const task: MilestoneTask = {
                id: `task-${newId}-${i}`,
                name: `Tâche ${i + 1} pour ${milestoneData.name}`,
                status: 'planned' as 'completed' | 'in-progress' | 'planned' | 'delayed',
                completionPercentage: 0,
                startDate: taskStartDate.toISOString(),
                endDate: taskEndDate.toISOString()
            };

            tasks.push(task);
        }

        return {
            id: newId,
            name: milestoneData.name,
            description: milestoneData.description,
            plannedDate: milestoneData.plannedDate,
            status: milestoneData.status,
            tasks: tasks
        };
    };

    const handleAddMilestone = () => {
        // Validate form
        if (!newMilestone.name || !newMilestone.description || !newMilestone.plannedDate) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (projectId) {
            // Show loading toast
            const loadingToast = toast.loading('Ajout du jalon en cours...');

            // Add the jalon to the backend
            dispatch(createMilestone({
                projectId,
                milestoneData: {
                    name: newMilestone.name,
                    description: newMilestone.description,
                    plannedDate: newMilestone.plannedDate,
                    status: newMilestone.status,
                    tasks: []
                }
            }))
                .unwrap()
                .then(() => {
                    // Dismiss loading toast
                    toast.dismiss(loadingToast);

                    // Refresh milestones
                    dispatch(fetchMilestones(projectId));

                    // Close modal and reset form
                    setShowAddMilestoneModal(false);
                    setNewMilestone({
                        name: '',
                        description: '',
                        plannedDate: new Date().toISOString().split('T')[0],
                        status: 'planned'
                    });

                    toast.success('Jalon ajouté avec succès');
                })
                .catch(error => {
                    // Dismiss loading toast
                    toast.dismiss(loadingToast);

                    // Log the error details for debugging
                    console.error('Failed to add milestone:', error);

                    // Different handling based on error type
                    if (error?.response?.status === 404) {
                        toast.error(`API endpoint introuvable: ${error.message || 'Erreur 404'}`);
                        // Continue with demo mode
                        fallbackToDemo(newMilestone);
                    } else if (error?.message?.includes('Network Error') || !navigator.onLine) {
                        toast.error('Problème de connexion au serveur. Jalon ajouté en mode démo uniquement.');
                        fallbackToDemo(newMilestone);
                    } else if (error?.message?.includes('Cannot POST') || error?.message?.includes('Failed to fetch')) {
                        toast.error('API non disponible. Jalon ajouté en mode démo uniquement.');
                        fallbackToDemo(newMilestone);
                    } else {
                        toast.error(`Erreur lors de l'ajout du jalon: ${error.message || 'Erreur inconnue'}`);
                    }
                });
        } else {
            // Just for demo when no projectId is available
            fallbackToDemo(newMilestone);
            toast.success('Jalon ajouté (mode démo)');
        }
    };

    // Helper function to add milestone in demo mode
    const fallbackToDemo = (milestoneData: any) => {
        const newMilestoneWithTasks = createDemoMilestone(milestoneData);
        setMilestones([...milestones, newMilestoneWithTasks]);
        setShowAddMilestoneModal(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: 'completed' | 'in-progress' | 'planned' | 'delayed') => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'planned':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'delayed':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getTaskProgressColor = (task: MilestoneTask) => {
        if (task.status === 'delayed') return 'bg-red-500';
        if (task.status === 'completed') return 'bg-green-500';
        if (task.status === 'in-progress') return 'bg-blue-500';
        return 'bg-gray-300 dark:bg-gray-600';
    };

    const getStatusLabel = (status: 'completed' | 'in-progress' | 'planned' | 'delayed') => {
        switch (status) {
            case 'completed':
                return 'Terminé';
            case 'in-progress':
                return 'En cours';
            case 'planned':
                return 'Planifié';
            case 'delayed':
                return 'En retard';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: 'completed' | 'in-progress' | 'planned' | 'delayed') => {
        switch (status) {
            case 'completed':
                return <CheckIcon className="h-5 w-5" />;
            case 'in-progress':
                return <ChevronDoubleRightIcon className="h-5 w-5" />;
            case 'planned':
                return <ChartBarIcon className="h-5 w-5" />;
            case 'delayed':
                return <ExclamationCircleIcon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const handleEditMilestone = (milestone: Milestone) => {
        setEditingMilestone(milestone.id);
        setEditMilestoneData({
            id: milestone.id,
            status: milestone.status,
            actualDate: milestone.status === 'completed' ? milestone.actualDate || new Date().toISOString().split('T')[0] : undefined
        });
    };

    const saveEditedMilestone = () => {
        if (!editMilestoneData || !projectId) return;

        // Show loading toast
        const loadingToast = toast.loading('Mise à jour du jalon...');

        // Prepare milestone data
        const milestoneData = {
            status: editMilestoneData.status,
            ...(editMilestoneData.status === 'completed' && { actualDate: editMilestoneData.actualDate })
        };

        // Update milestone in backend
        dispatch(updateMilestone({
            projectId,
            milestoneId: editMilestoneData.id,
            milestoneData
        }))
            .unwrap()
            .then((updatedMilestone) => {
                // Dismiss loading toast
                toast.dismiss(loadingToast);

                // Reset editing state
                setEditingMilestone(null);
                setEditMilestoneData(null);

                // Show success message
                toast.success('Statut du jalon mis à jour avec succès');

                // Refresh milestones to ensure we have the latest data
                dispatch(fetchMilestones(projectId));
            })
            .catch(error => {
                // Dismiss loading toast
                toast.dismiss(loadingToast);

                console.error('Failed to update milestone:', error);

                // Different handling based on error type
                if (error?.message?.includes('Network Error') || !navigator.onLine) {
                    toast.error('Problème de connexion au serveur. Mise à jour en mode local uniquement.');
                    // Fall back to local update
                    updateMilestoneLocally();
                } else {
                    toast.error(`Erreur lors de la mise à jour du jalon: ${error.message || 'Erreur inconnue'}`);
                    // Still update locally for better UX
                    updateMilestoneLocally();
                }
            });
    };

    // Helper function for local milestone updates when backend is unavailable
    const updateMilestoneLocally = () => {
        if (!editMilestoneData) return;

        const updatedMilestones = milestones.map(milestone => {
            if (milestone.id === editMilestoneData.id) {
                return {
                    ...milestone,
                    status: editMilestoneData.status,
                    actualDate: editMilestoneData.status === 'completed' ? editMilestoneData.actualDate : undefined
                };
            }
            return milestone;
        });

        setMilestones(updatedMilestones);
        calculateProgress(updatedMilestones);
        setEditingMilestone(null);
        setEditMilestoneData(null);
    };

    const handleEditTask = (task: MilestoneTask, milestoneId: string) => {
        setEditingTask(task.id);
        setEditTaskData({
            id: task.id,
            milestoneId,
            status: task.status,
            completionPercentage: task.completionPercentage
        });
    };

    const saveEditedTask = () => {
        if (!editTaskData || !projectId) return;

        // Show loading toast
        const loadingToast = toast.loading('Mise à jour de la tâche...');

        // Get the milestone and task
        const milestone = milestones.find(m => m.id === editTaskData.milestoneId);
        const task = milestone?.tasks.find(t => t.id === editTaskData.id);

        if (!milestone || !task) {
            toast.dismiss(loadingToast);
            toast.error('Tâche ou jalon introuvable');
            return;
        }

        // Prepare task data
        const taskData = {
            status: editTaskData.status,
            completionPercentage: editTaskData.completionPercentage
        };

        // Update task in backend
        dispatch(updateMilestoneTask({
            projectId,
            milestoneId: editTaskData.milestoneId,
            taskId: editTaskData.id,
            taskData
        }))
            .unwrap()
            .then((updatedTask) => {
                // Dismiss loading toast
                toast.dismiss(loadingToast);

                // Reset editing state
                setEditingTask(null);
                setEditTaskData(null);

                // Show success message
                toast.success('Tâche mise à jour avec succès');

                // Refresh milestones to ensure we have the latest data
                dispatch(fetchMilestones(projectId));
            })
            .catch(error => {
                // Dismiss loading toast
                toast.dismiss(loadingToast);

                console.error('Failed to update task:', error);

                // Different handling based on error type
                if (error?.message?.includes('Network Error') || !navigator.onLine) {
                    toast.error('Problème de connexion au serveur. Mise à jour en mode local uniquement.');
                    // Fall back to local update
                    updateTaskLocally();
                } else {
                    toast.error(`Erreur lors de la mise à jour de la tâche: ${error.message || 'Erreur inconnue'}`);
                    // Still update locally for better UX
                    updateTaskLocally();
                }
            });
    };

    // Helper function for local task updates when backend is unavailable
    const updateTaskLocally = () => {
        if (!editTaskData) return;

        const updatedMilestones = milestones.map(milestone => {
            if (milestone.id === editTaskData.milestoneId) {
                const updatedTasks = milestone.tasks.map(task => {
                    if (task.id === editTaskData.id) {
                        return {
                            ...task,
                            status: editTaskData.status,
                            completionPercentage: editTaskData.completionPercentage
                        };
                    }
                    return task;
                });

                return {
                    ...milestone,
                    tasks: updatedTasks
                };
            }
            return milestone;
        });

        setMilestones(updatedMilestones);
        calculateProgress(updatedMilestones);
        setEditingTask(null);
        setEditTaskData(null);
    };

    const cancelEditMilestone = () => {
        setEditingMilestone(null);
        setEditMilestoneData(null);
    };

    const cancelEditTask = () => {
        setEditingTask(null);
        setEditTaskData(null);
    };

    const openAddTaskModal = (milestoneId: string) => {
        setCurrentMilestoneForTask(milestoneId);
        setShowAddTaskModal(true);
    };

    const handleAddTask = () => {
        // Validate form
        if (!newTask.name || !newTask.startDate || !newTask.endDate) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (!currentMilestoneForTask) return;

        // Ensure dates are properly formatted
        const startDate = newTask.startDate || new Date().toISOString().split('T')[0];
        const endDate = newTask.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Show loading toast
        const loadingToast = toast.loading('Ajout de la tâche en cours...');

        // Create task data
        const taskData = {
            name: newTask.name,
            status: newTask.status,
            completionPercentage: newTask.completionPercentage,
            startDate: startDate,
            endDate: endDate,
            dependsOn: newTask.dependsOn?.length ? newTask.dependsOn : undefined
        };

        console.log('Adding task to milestone:', currentMilestoneForTask);
        console.log('Task data:', taskData);

        if (projectId) {
            // Save to backend
            dispatch(createMilestoneTask({
                projectId,
                milestoneId: currentMilestoneForTask,
                taskData
            }))
                .unwrap()
                .then((result) => {
                    // Dismiss loading toast
                    toast.dismiss(loadingToast);
                    console.log('Task created successfully:', result);

                    // Refresh milestones
                    dispatch(fetchMilestones(projectId));

                    // Reset form and close modal
                    setShowAddTaskModal(false);
                    setCurrentMilestoneForTask(null);
                    setNewTask({
                        name: '',
                        status: 'planned',
                        completionPercentage: 0,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        dependsOn: []
                    });

                    toast.success('Tâche ajoutée avec succès');

                    // Calculate progress after adding the task
                    calculateProgress(milestones);
                })
                .catch(error => {
                    // Dismiss loading toast
                    toast.dismiss(loadingToast);

                    console.error('Failed to add task:', error);

                    // Different handling based on error type
                    if (error?.response?.status === 404) {
                        toast.error(`API endpoint introuvable: ${error.message || 'Erreur 404'}`);
                        fallbackToLocalTask(currentMilestoneForTask, taskData);
                    } else if (error?.message?.includes('Network Error') || !navigator.onLine) {
                        toast.error('Problème de connexion au serveur. Tâche ajoutée en mode local uniquement.');
                        fallbackToLocalTask(currentMilestoneForTask, taskData);
                    } else {
                        toast.error(`Erreur lors de l'ajout de la tâche: ${error.message || 'Erreur inconnue'}`);
                        // Try fallback anyway to improve UX
                        fallbackToLocalTask(currentMilestoneForTask, taskData);
                    }
                });
        } else {
            // Just add to local state if no projectId
            toast.dismiss(loadingToast);
            fallbackToLocalTask(currentMilestoneForTask, taskData);
            toast.success('Tâche ajoutée (mode démo)');
        }
    };

    // Helper function to add task locally when backend is unavailable
    const fallbackToLocalTask = (milestoneId: string, taskData: any) => {
        // Create new task with local ID
        const newTaskData: MilestoneTask = {
            id: `task-${milestoneId}-${Date.now()}`,
            ...taskData
        };

        // Add to milestones
        const updatedMilestones = milestones.map(milestone => {
            if (milestone.id === milestoneId) {
                return {
                    ...milestone,
                    tasks: [...milestone.tasks, newTaskData]
                };
            }
            return milestone;
        });

        // Update state - this will trigger the useEffect that calls calculateProgress
        setMilestones(updatedMilestones);

        // Reset form and close modal
        setShowAddTaskModal(false);
        setCurrentMilestoneForTask(null);
        setNewTask({
            name: '',
            status: 'planned',
            completionPercentage: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dependsOn: []
        });
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <ChartBarIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Progression du Projet
                </h2>
                <button
                    onClick={() => setShowAddMilestoneModal(true)}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Ajouter un jalon
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <ArrowPathIcon className="h-8 w-8 text-[#F28C38] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Progress Summary */}
                    <div className="mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Progression globale
                                    </h3>
                                    <span className="text-lg font-bold text-[#F28C38]">
                                        {progressSummary.overall}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div
                                        className="h-2.5 rounded-full bg-[#F28C38]"
                                        style={{ width: `${progressSummary.overall}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Tâches terminées</p>
                                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                {progressSummary.completed}
                                            </p>
                                        </div>
                                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">En cours</p>
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {progressSummary.inProgress}
                                            </p>
                                        </div>
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                            <ChevronDoubleRightIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Planifiées</p>
                                            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                                                {progressSummary.planned}
                                            </p>
                                        </div>
                                        <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-md">
                                            <ChartBarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">En retard</p>
                                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                                {progressSummary.delayed}
                                            </p>
                                        </div>
                                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-md">
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones List */}
                    <div className="space-y-4">
                        {milestones.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                                <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Aucun jalon trouvé</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Commencez par ajouter des jalons à votre projet pour suivre la progression.
                                </p>
                                <button
                                    onClick={() => setShowAddMilestoneModal(true)}
                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors inline-flex items-center"
                                >
                                    <PlusIcon className="h-5 w-5 mr-1" />
                                    Ajouter un jalon
                                </button>
                            </div>
                        ) : (
                            milestones.map(milestone => (
                                <motion.div
                                    key={milestone.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                                >
                                    <div
                                        className={`p-4 ${editingMilestone !== milestone.id ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80' : ''}`}
                                        onClick={() => editingMilestone !== milestone.id && toggleMilestone(milestone.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-lg ${getStatusColor(milestone.status)}`}>
                                                    {getStatusIcon(milestone.status)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                                        {milestone.name}
                                                        <ChevronRightIcon
                                                            className={`h-5 w-5 ml-1 text-gray-400 transition-transform ${expandedMilestone === milestone.id ? 'transform rotate-90' : ''
                                                                }`}
                                                        />
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Prévu pour le {formatDate(milestone.plannedDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {editingMilestone === milestone.id ? (
                                                    <div className="flex items-center space-x-2">
                                                        <select
                                                            value={editMilestoneData?.status || milestone.status}
                                                            onChange={(e) => setEditMilestoneData({
                                                                ...editMilestoneData!,
                                                                status: e.target.value as 'completed' | 'in-progress' | 'planned' | 'delayed'
                                                            })}
                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        >
                                                            <option key="planned" value="planned">Planifié</option>
                                                            <option key="in-progress" value="in-progress">En cours</option>
                                                            <option key="completed" value="completed">Terminé</option>
                                                            <option key="delayed" value="delayed">En retard</option>
                                                        </select>
                                                        {editMilestoneData?.status === 'completed' && (
                                                            <input
                                                                type="date"
                                                                value={editMilestoneData.actualDate}
                                                                onChange={(e) => setEditMilestoneData({
                                                                    ...editMilestoneData,
                                                                    actualDate: e.target.value
                                                                })}
                                                                className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            />
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                saveEditedMilestone();
                                                            }}
                                                            className="p-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800/30"
                                                        >
                                                            <CheckIcon className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                cancelEditMilestone();
                                                            }}
                                                            className="p-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/30"
                                                        >
                                                            <XMarkIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                                                            {getStatusLabel(milestone.status)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditMilestone(milestone);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {milestone.actualDate && milestone.status === 'completed' && !editingMilestone && (
                                            <div className="mt-2 ml-11 text-sm text-green-600 dark:text-green-400">
                                                Terminé le {formatDate(milestone.actualDate)}
                                            </div>
                                        )}
                                    </div>

                                    {expandedMilestone === milestone.id && !editingMilestone && (
                                        <motion.div
                                            key={`expanded-${milestone.id}`}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-700"
                                        >
                                            <div className="ml-11">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    {milestone.description}
                                                </p>

                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                    Tâches associées
                                                </h4>
                                                {milestone.tasks.length === 0 ? (
                                                    <div className="text-center p-4 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                                                        <p className="text-gray-500 dark:text-gray-400">Aucune tâche associée à ce jalon</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {milestone.tasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                                                            >
                                                                {editingTask === task.id ? (
                                                                    <div className="space-y-3">
                                                                        <div className="flex justify-between">
                                                                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                {task.name}
                                                                            </h5>
                                                                            <div className="flex space-x-1">
                                                                                <button
                                                                                    onClick={saveEditedTask}
                                                                                    className="p-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800/30"
                                                                                >
                                                                                    <CheckIcon className="h-4 w-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={cancelEditTask}
                                                                                    className="p-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/30"
                                                                                >
                                                                                    <XMarkIcon className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col sm:flex-row sm:items-center text-xs space-y-2 sm:space-y-0 sm:space-x-4">
                                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                                {formatDate(task.startDate)} - {formatDate(task.endDate)}
                                                                            </span>
                                                                            <select
                                                                                value={editTaskData?.status || task.status}
                                                                                onChange={(e) => setEditTaskData({
                                                                                    ...editTaskData!,
                                                                                    status: e.target.value as 'completed' | 'in-progress' | 'planned' | 'delayed'
                                                                                })}
                                                                                className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                                            >
                                                                                <option key="planned" value="planned">Planifié</option>
                                                                                <option key="in-progress" value="in-progress">En cours</option>
                                                                                <option key="completed" value="completed">Terminé</option>
                                                                                <option key="delayed" value="delayed">En retard</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                                Progression: {editTaskData?.completionPercentage || task.completionPercentage}%
                                                                            </label>
                                                                            <input
                                                                                type="range"
                                                                                min="0"
                                                                                max="100"
                                                                                step="5"
                                                                                value={editTaskData?.completionPercentage || task.completionPercentage}
                                                                                onChange={(e) => setEditTaskData({
                                                                                    ...editTaskData!,
                                                                                    completionPercentage: parseInt(e.target.value)
                                                                                })}
                                                                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex-1">
                                                                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                    {task.name}
                                                                                </h5>
                                                                                <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1 sm:space-y-0 sm:space-x-4">
                                                                                    <span>{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getStatusColor(task.status)}`}>
                                                                                        {getStatusLabel(task.status)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-4 flex items-center space-x-2">
                                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                    {task.completionPercentage}%
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => handleEditTask(task, milestone.id)}
                                                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                                                >
                                                                                    <PencilIcon className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                                                            <div
                                                                                className={`h-1.5 rounded-full ${getTaskProgressColor(task)}`}
                                                                                style={{ width: `${task.completionPercentage}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        {task.dependsOn && task.dependsOn.length > 0 && (
                                                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                                Dépend de: {task.dependsOn.map((dep, index) => {
                                                                                    const dependencyTask = milestones.flatMap(m => m.tasks).find(t => t.id === dep);
                                                                                    return (
                                                                                        <span key={`${dep}-${index}`}>
                                                                                            {index > 0 && ", "}
                                                                                            {dependencyTask ? dependencyTask.name : dep}
                                                                                        </span>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex justify-end mt-4">
                                                    <button
                                                        className="text-sm text-[#F28C38] hover:text-[#E67E2E] font-medium"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openAddTaskModal(milestone.id);
                                                        }}
                                                    >
                                                        Ajouter une tâche
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', zIndex: 99999 }}>
                    <motion.div
                        key="task-modal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Ajouter une nouvelle tâche
                            </h3>
                            <button
                                onClick={() => setShowAddTaskModal(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom de la tâche *
                                    </label>
                                    <input
                                        type="text"
                                        id="taskName"
                                        value={newTask.name}
                                        onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        placeholder="Ex: Préparation du terrain"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="taskStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date de début *
                                        </label>
                                        <input
                                            type="date"
                                            id="taskStartDate"
                                            value={newTask.startDate}
                                            onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="taskEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date de fin *
                                        </label>
                                        <input
                                            type="date"
                                            id="taskEndDate"
                                            value={newTask.endDate}
                                            onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Statut *
                                    </label>
                                    <select
                                        id="taskStatus"
                                        value={newTask.status}
                                        onChange={(e) => setNewTask({ ...newTask, status: e.target.value as 'planned' | 'in-progress' | 'completed' | 'delayed' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        required
                                    >
                                        <option key="planned" value="planned">Planifié</option>
                                        <option key="in-progress" value="in-progress">En cours</option>
                                        <option key="completed" value="completed">Terminé</option>
                                        <option key="delayed" value="delayed">En retard</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Progression: {newTask.completionPercentage}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={newTask.completionPercentage}
                                        onChange={(e) => setNewTask({ ...newTask, completionPercentage: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAddTaskModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddTask}
                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors"
                                >
                                    Ajouter la tâche
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Milestone Modal */}
            {showAddMilestoneModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', zIndex: 99999 }}>
                    <motion.div
                        key="milestone-modal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Ajouter un nouveau jalon
                            </h3>
                            <button
                                onClick={() => setShowAddMilestoneModal(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="milestoneName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom du jalon *
                                    </label>
                                    <input
                                        type="text"
                                        id="milestoneName"
                                        value={newMilestone.name}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        placeholder="Ex: Préparation du site"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="milestoneDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        id="milestoneDescription"
                                        value={newMilestone.description}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        rows={3}
                                        placeholder="Description détaillée du jalon"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="milestonePlannedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Date prévue *
                                    </label>
                                    <input
                                        type="date"
                                        id="milestonePlannedDate"
                                        value={newMilestone.plannedDate}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, plannedDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="milestoneStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Statut *
                                    </label>
                                    <select
                                        id="milestoneStatus"
                                        value={newMilestone.status}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value as 'planned' | 'in-progress' | 'completed' | 'delayed' })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        required
                                    >
                                        <option key="planned" value="planned">Planifié</option>
                                        <option key="in-progress" value="in-progress">En cours</option>
                                        <option key="completed" value="completed">Terminé</option>
                                        <option key="delayed" value="delayed">En retard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowAddMilestoneModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAddMilestone}
                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors"
                                >
                                    Ajouter le jalon
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OperationProgress; 