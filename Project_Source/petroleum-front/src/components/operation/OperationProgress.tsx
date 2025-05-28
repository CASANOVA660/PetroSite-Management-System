import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ChartBarIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationCircleIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';

interface OperationProgressProps {
    projectId: string;
    initialMilestones?: Milestone[];
}

interface MilestoneTask {
    id: string;
    name: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    completionPercentage: number;
    startDate: string;
    endDate: string;
    dependsOn?: string[];
}

interface Milestone {
    id: string;
    name: string;
    description: string;
    plannedDate: string;
    actualDate?: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    tasks: MilestoneTask[];
}

// Dummy milestone data
const milestonesData: Milestone[] = [
    {
        id: 'ms1',
        name: 'Préparation du site',
        description: 'Préparation du terrain et installation des équipements de base',
        plannedDate: '2023-10-15',
        actualDate: '2023-10-17',
        status: 'completed',
        tasks: [
            {
                id: 'task1',
                name: 'Nettoyage du terrain',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-12',
                endDate: '2023-10-14'
            },
            {
                id: 'task2',
                name: 'Installation des barrières de sécurité',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-14',
                endDate: '2023-10-16'
            },
            {
                id: 'task3',
                name: 'Préparation des zones de travail',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-15',
                endDate: '2023-10-17'
            }
        ]
    },
    {
        id: 'ms2',
        name: 'Installation des équipements',
        description: 'Installation et calibrage des équipements de forage',
        plannedDate: '2023-10-22',
        actualDate: '2023-10-24',
        status: 'completed',
        tasks: [
            {
                id: 'task4',
                name: 'Transport des équipements sur site',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-18',
                endDate: '2023-10-20',
                dependsOn: ['task1', 'task3']
            },
            {
                id: 'task5',
                name: 'Installation de la foreuse principale',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-20',
                endDate: '2023-10-22',
                dependsOn: ['task4']
            },
            {
                id: 'task6',
                name: 'Calibrage et tests initiaux',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-22',
                endDate: '2023-10-24',
                dependsOn: ['task5']
            }
        ]
    },
    {
        id: 'ms3',
        name: 'Opérations de forage initial',
        description: 'Première phase des opérations de forage',
        plannedDate: '2023-10-30',
        status: 'in-progress',
        tasks: [
            {
                id: 'task7',
                name: 'Forage exploratoire',
                status: 'completed',
                completionPercentage: 100,
                startDate: '2023-10-25',
                endDate: '2023-10-27',
                dependsOn: ['task6']
            },
            {
                id: 'task8',
                name: 'Analyse des échantillons initiaux',
                status: 'in-progress',
                completionPercentage: 75,
                startDate: '2023-10-27',
                endDate: '2023-10-29'
            },
            {
                id: 'task9',
                name: 'Ajustement des paramètres de forage',
                status: 'in-progress',
                completionPercentage: 40,
                startDate: '2023-10-28',
                endDate: '2023-10-30',
                dependsOn: ['task8']
            }
        ]
    },
    {
        id: 'ms4',
        name: 'Forage principal',
        description: 'Phase principale des opérations de forage',
        plannedDate: '2023-11-15',
        status: 'planned',
        tasks: [
            {
                id: 'task10',
                name: 'Forage à profondeur cible',
                status: 'planned',
                completionPercentage: 0,
                startDate: '2023-11-01',
                endDate: '2023-11-10',
                dependsOn: ['task9']
            },
            {
                id: 'task11',
                name: 'Tests et analyses continues',
                status: 'planned',
                completionPercentage: 0,
                startDate: '2023-11-05',
                endDate: '2023-11-15'
            }
        ]
    },
    {
        id: 'ms5',
        name: 'Finalisation et rapport',
        description: 'Finalisation des opérations et préparation des rapports',
        plannedDate: '2023-11-30',
        status: 'planned',
        tasks: [
            {
                id: 'task12',
                name: 'Analyses finales des échantillons',
                status: 'planned',
                completionPercentage: 0,
                startDate: '2023-11-16',
                endDate: '2023-11-23',
                dependsOn: ['task11']
            },
            {
                id: 'task13',
                name: 'Préparation du rapport technique',
                status: 'planned',
                completionPercentage: 0,
                startDate: '2023-11-20',
                endDate: '2023-11-28',
                dependsOn: ['task12']
            },
            {
                id: 'task14',
                name: 'Présentation des résultats',
                status: 'planned',
                completionPercentage: 0,
                startDate: '2023-11-29',
                endDate: '2023-11-30',
                dependsOn: ['task13']
            }
        ]
    }
];

const OperationProgress: React.FC<OperationProgressProps> = ({ projectId, initialMilestones = [] }) => {
    const [loading, setLoading] = useState(true);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>('ms3'); // Default to in-progress milestone
    const [progressSummary, setProgressSummary] = useState({
        overall: 0,
        completed: 0,
        inProgress: 0,
        planned: 0,
        delayed: 0
    });

    useEffect(() => {
        // Simulate data loading
        setLoading(true);

        // If initialMilestones is provided, use it
        if (initialMilestones && initialMilestones.length > 0) {
            setMilestones(initialMilestones);
            calculateProgress(initialMilestones);
            setLoading(false);
        } else {
            // Use dummy data with a timeout to simulate API fetch
            const timer = setTimeout(() => {
                setMilestones(milestonesData);
                calculateProgress(milestonesData);
                setLoading(false);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [projectId, initialMilestones]);

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

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <ChartBarIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Progression du Projet
                </h2>
                <button
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
                        {milestones.map(milestone => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                            >
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80"
                                    onClick={() => toggleMilestone(milestone.id)}
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
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                                                {getStatusLabel(milestone.status)}
                                            </span>
                                        </div>
                                    </div>

                                    {milestone.actualDate && milestone.status === 'completed' && (
                                        <div className="mt-2 ml-11 text-sm text-green-600 dark:text-green-400">
                                            Terminé le {formatDate(milestone.actualDate)}
                                        </div>
                                    )}
                                </div>

                                {expandedMilestone === milestone.id && (
                                    <motion.div
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
                                            <div className="space-y-3">
                                                {milestone.tasks.map(task => (
                                                    <div
                                                        key={task.id}
                                                        className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm"
                                                    >
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
                                                            <div className="ml-4 w-20 text-right">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {task.completionPercentage}%
                                                                </span>
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
                                                                Dépend de: {task.dependsOn.map(dep => {
                                                                    const dependencyTask = milestones.flatMap(m => m.tasks).find(t => t.id === dep);
                                                                    return dependencyTask ? dependencyTask.name : dep;
                                                                }).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end mt-4">
                                                <button className="text-sm text-[#F28C38] hover:text-[#E67E2E] font-medium">
                                                    Gérer les tâches
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default OperationProgress; 