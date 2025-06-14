import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { motion, AnimatePresence } from "framer-motion";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import PageMeta from "../../components/common/PageMeta";
import {
    ChartBarIcon,
    UsersIcon,
    ClipboardDocumentCheckIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ChartPieIcon,
    CheckCircleIcon,
    FireIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    WrenchScrewdriverIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "../../store";
import { fetchProjects } from "../../store/slices/projectSlice";
import { fetchUsers } from "../../store/slices/userSlice";
import { fetchUserTasks } from "../../store/slices/taskSlice";
import { fetchEquipment } from "../../store/slices/equipmentSlice";
import { fetchProjectBudgetStats } from "../../store/slices/budgetSlice";
import { fetchDailyReports } from "../../store/slices/operationSlice";
import { Project } from "../../store/slices/projectSlice";
import { DailyReport } from "../../store/slices/operationSlice";

// Calendar component for global planning
const GlobalPlanningCalendar = () => {
    const { projects } = useSelector((state: RootState) => state.projects);
    const { tasks } = useSelector((state: RootState) => state.tasks);

    // Get current date info
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Generate calendar days
    const calendarDays = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>);
    }

    // Add calendar days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isToday = day === today.getDate();

        // Find events for this day (simplified example)
        const dayEvents = projects
            ?.filter(project => {
                const projectDate = new Date(project.startDate);
                return projectDate.getDate() === day &&
                    projectDate.getMonth() === currentMonth &&
                    projectDate.getFullYear() === currentYear;
            })
            .slice(0, 2); // Limit to 2 events per day for display

        calendarDays.push(
            <div
                key={`day-${day}`}
                className={`h-24 border border-gray-200 dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                    } p-1 overflow-hidden`}
            >
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {day}
                    </span>
                    {isToday && (
                        <span className="text-xs bg-blue-500 text-white px-1 rounded">
                            Aujourd'hui
                        </span>
                    )}
                </div>
                {dayEvents && dayEvents.map((event, idx) => (
                    <div
                        key={`event-${day}-${idx}`}
                        className="text-xs truncate bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-1 rounded mb-1"
                    >
                        {event.name}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
                <h3 className="font-semibold">
                    {new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex space-x-2">
                    <button className="p-1 hover:bg-white/20 rounded">
                        <ChevronDownIcon className="h-5 w-5" />
                    </button>
                    <button className="p-1 hover:bg-white/20 rounded">
                        <ChevronUpIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700">
                {dayNames.map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {calendarDays}
            </div>
        </div>
    );
};

// Mock data for the ProjectOverview component
const mockProjects = [
    { id: 1, name: "Pipeline Extension Project", progress: 65, status: "In Progress" },
    { id: 2, name: "Refinery Maintenance", progress: 92, status: "Completion" },
    { id: 3, name: "Offshore Platform D", progress: 35, status: "Early Stage" },
    { id: 4, name: "Storage Facility Upgrade", progress: 78, status: "Advanced" },
];

const ProjectOverview = () => {
    return (
        <div className="ove rflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Project Overview
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View All
                </button>
            </div>

            <div className="space-y-4">
                {mockProjects.map((project) => (
                    <motion.div
                        key={project.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === "Completion" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                project.status === "In Progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                    project.status === "Early Stage" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full ${project.progress > 75 ? "bg-green-500" :
                                    project.progress > 50 ? "bg-blue-500" :
                                        project.progress > 25 ? "bg-yellow-500" : "bg-red-500"
                                    }`}
                                style={{ width: `${project.progress}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{project.progress}% Complete</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const BudgetSummary = () => {
    const { stats, loading } = useSelector((state: RootState) => state.budget);
    const [budgetData, setBudgetData] = useState({
        total: 0,
        used: 0,
        remaining: 0,
        percentage: 0,
        categories: [
            { name: 'Équipements', amount: 0, percentage: 0, color: 'bg-blue-500' },
            { name: 'Personnel', amount: 0, percentage: 0, color: 'bg-green-500' },
            { name: 'Opérations', amount: 0, percentage: 0, color: 'bg-amber-500' },
            { name: 'Maintenance', amount: 0, percentage: 0, color: 'bg-purple-500' },
            { name: 'Divers', amount: 0, percentage: 0, color: 'bg-gray-500' }
        ]
    });

    useEffect(() => {
        if (stats && stats.totalByCurrency) {
            // Extract real data from budget stats
            const currencies = Object.keys(stats.totalByCurrency);
            if (currencies.length > 0) {
                const mainCurrency = currencies[0]; // Use first currency
                const total = stats.totalByCurrency[mainCurrency] || 0;

                // For demo purposes, we'll simulate the used amount as 60% of total
                // In a real app, this would come from the API
                const used = total * 0.6;
                const remaining = total - used;
                const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

                // Simulate category distributions based on real types if available
                const categoryTypes = stats.byType ? Object.keys(stats.byType) : [];
                const categories = budgetData.categories.map((cat, idx) => {
                    const categoryName = categoryTypes[idx] || cat.name;
                    const amount = used * (categoryTypes[idx] ? stats.byType[categoryTypes[idx]] / stats.totalCount : (20 - idx * 3) / 100);
                    return {
                        ...cat,
                        name: categoryName,
                        amount,
                        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
                    };
                });

                setBudgetData({
                    total,
                    used,
                    remaining,
                    percentage,
                    categories
                });
            }
        }
    }, [stats]);

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M €`;
        } else if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}K €`;
        } else {
            return `${value.toFixed(0)} €`;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <BanknotesIcon className="h-5 w-5 text-emerald-500 mr-2" />
                    Budget
                </h3>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : budgetData.total > 0 ? (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Budget total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(budgetData.total)}</p>
                        </div>
                        <div className="relative h-20 w-20">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#f3f4f6"
                                    strokeWidth="12"
                                    className="dark:stroke-gray-700"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="12"
                                    strokeDasharray={`${budgetData.percentage * 2.51} 251`}
                                    strokeDashoffset="0"
                                    className="dark:stroke-emerald-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-gray-800 dark:text-white">
                                    {budgetData.percentage}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                            <p className="text-xs text-green-700 dark:text-green-300">Utilisé</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(budgetData.used)}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                            <p className="text-xs text-blue-700 dark:text-blue-300">Restant</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(budgetData.remaining)}</p>
                        </div>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Répartition par catégorie</h4>

                    <div className="space-y-3">
                        {budgetData.categories.filter(cat => cat.amount > 0).map((category, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{category.name}</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(category.amount)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({category.percentage}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        {budgetData.categories.filter(cat => cat.amount > 0).map((category, index) => (
                            <div
                                key={index}
                                className={`h-full ${category.color} inline-block`}
                                style={{
                                    width: `${category.percentage}%`,
                                    marginLeft: index === 0 ? '0' : '-1px' // Prevent gaps between segments
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12">
                    <BanknotesIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Aucune donnée budgétaire disponible
                    </p>
                </div>
            )}
        </div>
    );
};

const ResourceAllocation = () => {
    const { equipment } = useSelector((state: RootState) => state.equipment);
    const { users } = useSelector((state: RootState) => state.users);

    // Calculate resource allocation percentages
    const equipmentUsage = equipment && equipment.length > 0
        ? Math.floor((equipment.filter((e: any) => e.status === 'In Use').length / equipment.length) * 100)
        : 75; // Fallback value

    const personnelAllocation = users && users.length > 0
        ? Math.floor((users.filter(u => u.role !== 'Manager' && u.role !== 'Admin').length / users.length) * 100)
        : 50; // Fallback value

    const vehicleUsage = 40; // Static for demo

    // Animation variants
    const circleVariants = {
        hidden: { strokeDashoffset: 283 },
        visible: (percent: number) => ({
            strokeDashoffset: 283 - (283 * percent / 100),
            transition: { duration: 1.5, ease: "easeInOut" }
        })
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <ChartPieIcon className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Allocation des Ressources
                    </h3>
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
                    <span>Gérer</span>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="flex items-center justify-around flex-wrap">
                {/* Equipment Allocation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center m-2"
                >
                    <div className="relative h-28 w-28">
                        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="10"
                            />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="10"
                                strokeDasharray="283"
                                variants={circleVariants}
                                initial="hidden"
                                animate="visible"
                                custom={equipmentUsage}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{equipmentUsage}%</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">utilisés</span>
                        </div>
                    </div>
                    <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Équipements</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{equipment?.length || 0} disponibles</span>
                </motion.div>

                {/* Personnel Allocation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex flex-col items-center m-2"
                >
                    <div className="relative h-28 w-28">
                        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="10"
                            />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="10"
                                strokeDasharray="283"
                                variants={circleVariants}
                                initial="hidden"
                                animate="visible"
                                custom={personnelAllocation}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{personnelAllocation}%</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">assignés</span>
                        </div>
                    </div>
                    <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Personnel</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{users?.length || 0} employés</span>
                </motion.div>

                {/* Vehicle Allocation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="flex flex-col items-center m-2"
                >
                    <div className="relative h-28 w-28">
                        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="10"
                            />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="10"
                                strokeDasharray="283"
                                variants={circleVariants}
                                initial="hidden"
                                animate="visible"
                                custom={vehicleUsage}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{vehicleUsage}%</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">en service</span>
                        </div>
                    </div>
                    <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Véhicules</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">12 disponibles</span>
                </motion.div>
            </div>
        </div>
    );
};

const TasksOverview = () => {
    const { tasks } = useSelector((state: RootState) => state.tasks);
    const [taskStats, setTaskStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        urgent: 0
    });

    useEffect(() => {
        if (tasks && tasks.todo && tasks.inProgress && tasks.inReview && tasks.done) {
            const flatTasks = [
                ...tasks.todo,
                ...tasks.inProgress,
                ...tasks.inReview,
                ...tasks.done
            ];

            setTaskStats({
                total: flatTasks.length,
                completed: tasks.done.length,
                inProgress: tasks.inProgress.length,
                todo: tasks.todo.length,
                urgent: flatTasks.filter((task: any) => task.priority === 'high').length
            });
        }
    }, [tasks]);

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Aperçu des Tâches
                    </h3>
                </div>
                <button className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1">
                    <span>Détails</span>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 flex flex-col justify-between"
                >
                    <div>
                        <h4 className="text-purple-700 dark:text-purple-300 text-sm font-medium">Total des Tâches</h4>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">{taskStats.total}</p>
                    </div>
                    <div className="flex justify-between mt-4">
                        <span className="text-xs text-purple-600 dark:text-purple-300 font-medium flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            {taskStats.completed} terminées
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-300 font-medium flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {taskStats.total - taskStats.completed} en cours
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 flex flex-col justify-between"
                >
                    <div>
                        <h4 className="text-amber-700 dark:text-amber-300 text-sm font-medium">Tâches Urgentes</h4>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">{taskStats.urgent}</p>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs text-amber-600 dark:text-amber-300 font-medium flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Nécessitent une attention immédiate
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 flex flex-col justify-between"
                >
                    <div>
                        <h4 className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Tâches Terminées</h4>
                        <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{taskStats.completed}</p>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                            {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% du total
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex flex-col justify-between"
                >
                    <div>
                        <h4 className="text-blue-700 dark:text-blue-300 text-sm font-medium">En Progression</h4>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{taskStats.inProgress}</p>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                            {taskStats.total > 0 ? Math.round((taskStats.inProgress / taskStats.total) * 100) : 0}% du total
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// New component for Equipment Status KPI that matches the existing style
const EquipmentStatusKPI = () => {
    const { equipment, loading } = useSelector((state: RootState) => state.equipment);
    const [equipmentStats, setEquipmentStats] = useState({
        total: 0,
        available: 0,
        inUse: 0,
        maintenance: 0,
        reserved: 0
    });

    useEffect(() => {
        if (equipment && equipment.length > 0) {
            const stats = {
                total: equipment.length,
                available: equipment.filter((eq: any) => eq.status === 'available').length,
                inUse: equipment.filter((eq: any) => eq.status === 'In Use' || eq.status === 'inUse').length,
                maintenance: equipment.filter((eq: any) => eq.status === 'maintenance').length,
                reserved: equipment.filter((eq: any) => eq.status === 'reserved').length
            };
            setEquipmentStats(stats);
        }
    }, [equipment]);

    // Calculate percentage for each status
    const getPercentage = (count: number) => {
        return equipmentStats.total > 0 ? Math.round((count / equipmentStats.total) * 100) : 0;
    };

    // Create data for the doughnut chart
    const chartData = [
        { name: 'Disponible', value: equipmentStats.available, color: '#10b981' }, // green-500
        { name: 'En utilisation', value: equipmentStats.inUse, color: '#3b82f6' }, // blue-500
        { name: 'Maintenance', value: equipmentStats.maintenance, color: '#f59e0b' }, // amber-500
        { name: 'Réservé', value: equipmentStats.reserved, color: '#8b5cf6' }  // purple-500
    ];

    // Calculate position for each segment in SVG circle
    const calculateCirclePath = () => {
        const results = [];
        let cumulativePercent = 0;

        for (const item of chartData) {
            // Skip if no value
            if (item.value === 0) continue;

            const percent = getPercentage(item.value);
            const startAngle = cumulativePercent * 3.6; // 3.6 = 360 / 100
            cumulativePercent += percent;
            const endAngle = cumulativePercent * 3.6;

            // Convert angles to radians and calculate x,y coordinates
            const startRad = (startAngle - 90) * Math.PI / 180; // -90 to start from top
            const endRad = (endAngle - 90) * Math.PI / 180;

            const r = 40; // radius
            const cx = 50; // center x
            const cy = 50; // center y

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            // Create SVG arc path
            const largeArcFlag = percent > 50 ? 1 : 0;
            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            results.push({ path, color: item.color });
        }

        return results;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-500 mr-2" />
                    État des Équipements
                </h3>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ) : equipmentStats.total > 0 ? (
                <div>
                    {/* Doughnut Chart */}
                    <div className="flex justify-center mb-6 relative">
                        <svg width="160" height="160" viewBox="0 0 100 100">
                            {/* Background circle */}
                            {equipmentStats.total === 0 ? (
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            ) : (
                                calculateCirclePath().map((segment, i) => (
                                    <path key={i} d={segment.path} fill={segment.color} />
                                ))
                            )}
                            {/* Inner circle/background for text */}
                            <circle cx="50" cy="50" r="30" fill="white" className="dark:fill-gray-800" />
                            {/* Text in the center */}
                            <text x="50" y="45" textAnchor="middle" className="fill-gray-700 dark:fill-gray-200 text-lg font-semibold">
                                {equipmentStats.total}
                            </text>
                            <text x="50" y="60" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-xs">
                                équipements
                            </text>
                        </svg>
                    </div>

                    {/* Legend & Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-start space-x-2">
                            <div className="mt-1 h-3 w-3 rounded-full bg-green-500"></div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {equipmentStats.available} ({getPercentage(equipmentStats.available)}%)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <div className="mt-1 h-3 w-3 rounded-full bg-blue-500"></div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">En utilisation</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {equipmentStats.inUse} ({getPercentage(equipmentStats.inUse)}%)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <div className="mt-1 h-3 w-3 rounded-full bg-amber-500"></div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {equipmentStats.maintenance} ({getPercentage(equipmentStats.maintenance)}%)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <div className="mt-1 h-3 w-3 rounded-full bg-purple-500"></div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Réservé</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {equipmentStats.reserved} ({getPercentage(equipmentStats.reserved)}%)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Utilization bar */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'utilisation</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {getPercentage(equipmentStats.inUse)}%
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${getPercentage(equipmentStats.inUse)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8">
                    <WrenchScrewdriverIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Aucun équipement disponible</p>
                </div>
            )}
        </div>
    );
};

// New component for Project Status KPI that matches the existing style
const ProjectStatusKPI = () => {
    const { projects, loading } = useSelector((state: RootState) => state.projects);
    const [statusCounts, setStatusCounts] = useState({
        total: 0,
        enCours: 0,
        enOperation: 0,
        cloture: 0,
        annule: 0
    });

    useEffect(() => {
        if (projects && projects.length > 0) {
            setStatusCounts({
                total: projects.length,
                enCours: projects.filter(p => p.status === 'En cours').length,
                enOperation: projects.filter(p => p.status === 'En opération').length,
                cloture: projects.filter(p => p.status === 'Clôturé').length,
                annule: projects.filter(p => p.status === 'Annulé').length
            });
        }
    }, [projects]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <ChartPieIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Statut des Projets
                </h3>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : statusCounts.total > 0 ? (
                <div className="space-y-5">
                    {/* En cours */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">En cours</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {statusCounts.enCours} ({Math.round((statusCounts.enCours / statusCounts.total) * 100)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${(statusCounts.enCours / statusCounts.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* En opération */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">En opération</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {statusCounts.enOperation} ({Math.round((statusCounts.enOperation / statusCounts.total) * 100)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${(statusCounts.enOperation / statusCounts.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Clôturé */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Clôturé</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {statusCounts.cloture} ({Math.round((statusCounts.cloture / statusCounts.total) * 100)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-purple-500"
                                style={{ width: `${(statusCounts.cloture / statusCounts.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Annulé */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Annulé</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {statusCounts.annule} ({Math.round((statusCounts.annule / statusCounts.total) * 100)}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-red-500"
                                style={{ width: `${(statusCounts.annule / statusCounts.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total des projets</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{statusCounts.total}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8">
                    <ChartPieIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Aucun projet disponible</p>
                </div>
            )}
        </div>
    );
};

// Define modern StatCard component
const StatCard = ({ icon, title, value, subtitle, color, trend }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: { value: number; isPositive: boolean };
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${color}`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`text-xs font-medium flex items-center ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {trend.isPositive ? (
                                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                            ) : (
                                <ArrowTrendingUpIcon className="h-3 w-3 mr-1 rotate-180" />
                            )}
                            {trend.value}%
                        </span>
                    )}
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {title}
                </h3>
                <div className="mt-1 flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className={`h-1 ${color}`}></div>
        </motion.div>
    );
};

const ActiveProjectsOverview = () => {
    const { projects, loading } = useSelector((state: RootState) => state.projects);

    // Filter for active projects and get top 4
    const activeProjects = useMemo(() => {
        if (!projects) return [];
        return projects
            .filter(project =>
                project.status === 'En cours' ||
                project.status === 'En opération'
            )
            .slice(0, 4);
    }, [projects]);

    // Calculate progress based on dates
    const calculateProgress = (project: any) => {
        if (!project.startDate || !project.endDate) return 0;

        const start = new Date(project.startDate).getTime();
        const end = new Date(project.endDate).getTime();
        const now = new Date().getTime();

        if (now <= start) return 0;
        if (now >= end) return 100;

        const totalDuration = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / totalDuration) * 100);
    };

    // Color classes based on status
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'En cours':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'En opération':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Clôturé':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Projets Actifs
                </h3>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full w-full"></div>
                            <div className="flex justify-between mt-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/5"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/5"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeProjects.length > 0 ? (
                <div className="space-y-4">
                    {activeProjects.map(project => {
                        const progress = calculateProgress(project);

                        return (
                            <motion.div
                                key={project._id}
                                whileHover={{ scale: 1.01 }}
                                className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-300"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(project.status)}`}>
                                        {project.status}
                                    </span>
                                </div>

                                {project.clientName && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        Client: {project.clientName}
                                    </p>
                                )}

                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${progress > 90 ? "bg-green-500" :
                                            progress > 60 ? "bg-blue-500" :
                                                progress > 30 ? "bg-amber-500" : "bg-red-500"
                                            }`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between mt-3">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {progress}% Complété
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Aucun projet actif trouvé
                    </p>
                </div>
            )}
        </div>
    );
};

const ReportsSummary = () => {
    const { dailyReports } = useSelector((state: RootState) => state.operation);
    const [reportStats, setReportStats] = useState({
        total: 0,
        approved: 0,
        submitted: 0,
        draft: 0,
        rejected: 0,
        recentReports: [] as any[]
    });

    useEffect(() => {
        if (dailyReports && dailyReports.data) {
            const stats = {
                total: dailyReports.data.length,
                approved: dailyReports.data.filter(r => r.status === 'approved').length,
                submitted: dailyReports.data.filter(r => r.status === 'submitted').length,
                draft: dailyReports.data.filter(r => r.status === 'draft').length,
                rejected: dailyReports.data.filter(r => r.status === 'rejected').length,
                recentReports: [...dailyReports.data]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
            };
            setReportStats(stats);
        }
    }, [dailyReports]);

    // Format date to readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get badge color based on status
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'submitted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-amber-500 mr-2" />
                    Rapports Journaliers
                </h3>
            </div>

            {dailyReports?.loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
            ) : reportStats.total > 0 ? (
                <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {/* Total */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{reportStats.total}</p>
                        </div>

                        {/* Approved */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400">Approuvés</p>
                            <p className="text-xl font-bold text-green-800 dark:text-green-300">{reportStats.approved}</p>
                        </div>

                        {/* Submitted */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Soumis</p>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-300">{reportStats.submitted}</p>
                        </div>

                        {/* Draft */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Brouillons</p>
                            <p className="text-xl font-bold text-amber-800 dark:text-amber-300">{reportStats.draft}</p>
                        </div>
                    </div>

                    {reportStats.recentReports.length > 0 && (
                        <>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Rapports récents
                            </h4>

                            <div className="space-y-3">
                                {reportStats.recentReports.map(report => (
                                    <motion.div
                                        key={report._id}
                                        whileHover={{ scale: 1.01 }}
                                        className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {report.title || `Rapport du ${formatDate(report.date)}`}
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {formatDate(report.date)}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(report.status)}`}>
                                                {report.status === 'approved' ? 'Approuvé' :
                                                    report.status === 'submitted' ? 'Soumis' :
                                                        report.status === 'draft' ? 'Brouillon' : 'Rejeté'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Aucun rapport disponible</p>
                </div>
            )}
        </div>
    );
};

export default function ManagerDashboard() {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { projects } = useSelector((state: RootState) => state.projects);
    const { users } = useSelector((state: RootState) => state.users);
    const { equipment } = useSelector((state: RootState) => state.equipment);
    const [greeting, setGreeting] = useState("");
    const [showCalendar, setShowCalendar] = useState(false);
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalUsers: 0,
        totalTasksInProgress: 0,
        equipmentUtil: 0
    });

    useEffect(() => {
        // Set greeting based on time of day
        const hours = new Date().getHours();
        if (hours < 12) setGreeting("Bonjour");
        else if (hours < 18) setGreeting("Bon après-midi");
        else setGreeting("Bonsoir");

        // Fetch data needed for the dashboard
        dispatch(fetchProjects());
        dispatch(fetchUsers());
        dispatch(fetchUserTasks({ includeProjectActions: true }));
        dispatch(fetchEquipment());
        dispatch(fetchProjectBudgetStats(""));
        dispatch(fetchDailyReports(""));
    }, [dispatch, user?._id]);

    useEffect(() => {
        // Calculate dashboard stats when data is available
        setStats({
            totalProjects: projects?.length || 0,
            totalUsers: users?.length || 0,
            totalTasksInProgress: 0, // We'll calculate this from tasks if available
            equipmentUtil: equipment && equipment.length > 0 ?
                Math.round((equipment.filter((e: any) => e.status === 'In Use' || e.status === 'inUse').length / equipment.length) * 100) : 0
        });
    }, [projects, users, equipment]);

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    return (
        <>
            <PageMeta
                title="Tableau de Bord Manager | Système de Gestion Pétrolière"
                description="Tableau de bord de gestion des opérations pétrolières"
            />

            {/* Calendar Toggle Button */}
            <div className="flex justify-end mb-4">
                <motion.button
                    onClick={toggleCalendar}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <CalendarIcon className="h-5 w-5" />
                    <span>Planning Global</span>
                    {showCalendar ? (
                        <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                    )}
                </motion.button>
            </div>

            {/* Collapsible Calendar */}
            <AnimatePresence>
                {showCalendar && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8 overflow-hidden"
                    >
                        <GlobalPlanningCalendar />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Greeting Header with Animation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {greeting}, <span className="text-blue-600 dark:text-blue-400">{user?.nom || "Manager"}</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Voici une vue d'ensemble de vos projets et opérations
                </p>
            </motion.div>

            {/* Stats Cards - using real data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<ChartBarIcon className="h-6 w-6 text-white" />}
                    title="Projets"
                    value={stats.totalProjects}
                    color="bg-blue-600"
                    trend={projects && projects.length > 0 ? {
                        value: Math.round(projects.filter(p => p.status === 'En cours' || p.status === 'En opération').length / projects.length * 100),
                        isPositive: true
                    } : undefined}
                />
                <StatCard
                    icon={<UsersIcon className="h-6 w-6 text-white" />}
                    title="Employés"
                    value={stats.totalUsers}
                    color="bg-green-600"
                    trend={undefined}
                />
                <StatCard
                    icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />}
                    title="Équipements"
                    value={equipment?.length || 0}
                    color="bg-amber-600"
                    trend={equipment && equipment.length > 0 ? {
                        value: Math.round(equipment.filter((e: any) => e.status === 'available').length / equipment.length * 100),
                        isPositive: true
                    } : undefined}
                />
                <StatCard
                    icon={<BanknotesIcon className="h-6 w-6 text-white" />}
                    title="Utilisation Équipements"
                    value={`${stats.equipmentUtil}%`}
                    color="bg-purple-600"
                    trend={undefined}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Projects */}
                    <ActiveProjectsOverview />

                    {/* Project Status Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProjectStatusKPI />
                        <EquipmentStatusKPI />
                    </div>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    {/* Budget Summary */}
                    <BudgetSummary />

                    {/* Daily Reports Summary */}
                    <ReportsSummary />
                </div>
            </div>
        </>
    );
} 