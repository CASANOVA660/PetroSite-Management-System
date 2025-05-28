import { useState, useEffect } from "react";
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
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "../../store";
import { fetchProjects } from "../../store/slices/projectSlice";
import { fetchUsers } from "../../store/slices/userSlice";
import { fetchUserTasks } from "../../store/slices/taskSlice";
import { fetchEquipment } from "../../store/slices/equipmentSlice";
import { fetchProjectBudgetStats } from "../../store/slices/budgetSlice";

// Mock data for the ProjectOverview component
const mockProjects = [
    { id: 1, name: "Pipeline Extension Project", progress: 65, status: "In Progress" },
    { id: 2, name: "Refinery Maintenance", progress: 92, status: "Completion" },
    { id: 3, name: "Offshore Platform D", progress: 35, status: "Early Stage" },
    { id: 4, name: "Storage Facility Upgrade", progress: 78, status: "Advanced" },
];

const ProjectOverview = () => {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
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
    const { stats } = useSelector((state: RootState) => state.budget);
    const [budgetData, setBudgetData] = useState({
        total: 0,
        remaining: 0,
        categories: [
            { name: 'Équipements', amount: 0, percentage: 0 },
            { name: 'Personnel', amount: 0, percentage: 0 },
            { name: 'Opérations', amount: 0, percentage: 0 },
            { name: 'Maintenance', amount: 0, percentage: 0 },
            { name: 'Divers', amount: 0, percentage: 0 }
        ]
    });

    useEffect(() => {
        if (stats) {
            // For demo purposes - simulating budget data based on stats
            const total = 12400000; // Use hardcoded value for demo
            const used = 7200000;   // Use hardcoded value for demo
            const remaining = total - used;

            // Simulate category distributions
            const categoryPercentages = [45, 25, 15, 10, 5]; // Distribution percentages
            const categories = budgetData.categories.map((cat, idx) => {
                const amount = (used * categoryPercentages[idx] / 100);
                return {
                    ...cat,
                    amount,
                    percentage: Math.round((amount / total) * 100)
                };
            });

            setBudgetData({
                total,
                remaining,
                categories
            });
        }
    }, [stats, budgetData.categories]);

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(1)}K`;
        } else {
            return `$${value.toFixed(0)}`;
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <BanknotesIcon className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Budget Résumé
                    </h3>
                </div>
                <button className="text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1">
                    <span>Détails</span>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4"
                >
                    <h4 className="text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-2">Budget Total</h4>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{formatCurrency(budgetData.total)}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">Année fiscale en cours</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4"
                >
                    <h4 className="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-2">Restant</h4>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(budgetData.remaining)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                        {Math.round((budgetData.remaining / budgetData.total) * 100)}% du total
                    </p>
                </motion.div>
            </div>

            <div className="space-y-4">
                {budgetData.categories.map((category, index) => (
                    <motion.div
                        key={category.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="space-y-2"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{category.name}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${category.percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-1.5 rounded-full ${index === 0 ? "bg-indigo-500" :
                                    index === 1 ? "bg-emerald-500" :
                                        index === 2 ? "bg-amber-500" :
                                            index === 3 ? "bg-blue-500" : "bg-purple-500"
                                    }`}
                            />
                        </div>
                        <div className="flex justify-end">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {category.percentage}% du budget
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
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

const StatCard = ({ icon, title, value, trend, color, bgColor, delay = 0 }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`p-6 rounded-2xl border border-gray-200 ${bgColor} dark:border-gray-800 dark:bg-white/[0.03] shadow-sm overflow-hidden relative`}
        >
            <div className={`absolute right-0 top-0 w-32 h-32 -mr-10 -mt-8 rounded-full opacity-10 ${color}`}></div>
            <div className="flex items-center mb-4 z-10 relative">
                <div className={`p-3 rounded-xl mr-4 ${color}`}>
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            </div>
            <div className="flex justify-between items-end z-10 relative">
                <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className={`text-sm mt-1 ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-medium flex items-center gap-1`}>
                        <ArrowTrendingUpIcon className={`h-4 w-4 ${!trend.startsWith('+') && 'rotate-180'}`} />
                        {trend} vs mois dernier
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const ProjectPerformance = () => {
    const { projects } = useSelector((state: RootState) => state.projects);
    const [activeProjects, setActiveProjects] = useState<any[]>([]);

    useEffect(() => {
        // Get top 4 projects by progress
        if (projects && projects.length > 0) {
            const filtered = projects
                .filter(p => p.status === 'En cours')
                .slice(0, 4)
                .map(p => ({
                    id: p._id,
                    name: p.name,
                    progress: Math.floor(Math.random() * 40) + 60, // Simulated progress for demo
                    status: 'En cours',
                    deadline: p.endDate ? new Date(p.endDate) : null
                }));
            setActiveProjects(filtered);
        }
    }, [projects]);

    // Calculate days remaining
    const getDaysRemaining = (deadline: Date | null) => {
        if (!deadline) return null;
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <FireIcon className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Performance Projets
                    </h3>
                </div>
                <button className="text-sm text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1">
                    <span>Tous les projets</span>
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-4">
                {activeProjects.length > 0 ? (
                    activeProjects.map((project) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.01 }}
                            className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/40"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                                <div className="flex items-center">
                                    {project.deadline && (
                                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 mr-2 ${getDaysRemaining(project.deadline) && getDaysRemaining(project.deadline)! < 7
                                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                            }`}>
                                            <ClockIcon className="h-3 w-3" />
                                            {getDaysRemaining(project.deadline)
                                                ? `${getDaysRemaining(project.deadline)} jours`
                                                : "Date non définie"}
                                        </span>
                                    )}
                                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircleIcon className="h-3 w-3" />
                                        Actif
                                    </span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${project.progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-2.5 rounded-full ${project.progress > 90 ? "bg-emerald-500" :
                                        project.progress > 75 ? "bg-green-500" :
                                            project.progress > 50 ? "bg-blue-500" :
                                                project.progress > 25 ? "bg-amber-500" : "bg-red-500"
                                        }`}
                                />
                            </div>

                            <div className="flex justify-between mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {project.progress < 50 ? "En retard" :
                                        project.progress < 75 ? "Progression normale" :
                                            "Avance sur planning"}
                                </span>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{project.progress}%</span>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <ExclamationTriangleIcon className="h-12 w-12 mb-3 text-gray-300" />
                        <p>Aucun projet actif trouvé</p>
                    </div>
                )}
            </div>
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
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalUsers: 0,
        totalTasks: 0,
        budgetUsage: 0
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
    }, [dispatch, user?._id]);

    useEffect(() => {
        // Calculate dashboard stats when data is available
        setStats({
            totalProjects: projects?.length || 0,
            totalUsers: users?.length || 0,
            totalTasks: 185, // Placeholder - would calculate from actual tasks
            budgetUsage: 58 // Placeholder - would calculate from actual budget data
        });
    }, [projects, users]);

    return (
        <>
            <PageMeta
                title="Tableau de Bord Manager | Système de Gestion Pétrolière"
                description="Tableau de bord de gestion des opérations pétrolières"
            />

            {/* Greeting Header with Animation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                    <span>{greeting},</span>
                    <span className="ml-2 text-amber-500">{user?.nom || "Manager"}</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Voici ce qui se passe avec vos projets aujourd'hui
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<ChartBarIcon className="h-6 w-6 text-white" />}
                    title="Projets"
                    value={stats.totalProjects}
                    trend="+3"
                    color="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    bgColor="bg-white"
                    delay={0.1}
                />
                <StatCard
                    icon={<UsersIcon className="h-6 w-6 text-white" />}
                    title="Membres d'Équipe"
                    value={stats.totalUsers}
                    trend="+5"
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                    bgColor="bg-white"
                    delay={0.2}
                />
                <StatCard
                    icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />}
                    title="Tâches"
                    value={stats.totalTasks}
                    trend="+28"
                    color="bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                    bgColor="bg-white"
                    delay={0.3}
                />
                <StatCard
                    icon={<BanknotesIcon className="h-6 w-6 text-white" />}
                    title="Budget Utilisé"
                    value={`${stats.budgetUsage}%`}
                    trend="+7%"
                    color="bg-gradient-to-br from-violet-500 to-violet-600 text-white"
                    bgColor="bg-white"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="col-span-12 space-y-6 xl:col-span-8">
                    {/* Replace Monthly Sales Chart with a more appropriately named component */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Performance Mensuelle des Projets
                                </h3>
                            </div>
                        </div>
                        <MonthlySalesChart />
                    </div>

                    {/* Middle Section - Project Performance and Resource Allocation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProjectPerformance />
                        <ResourceAllocation />
                    </div>

                    {/* Tasks Overview Component */}
                    <TasksOverview />
                </div>

                {/* Right Sidebar */}
                <div className="col-span-12 space-y-6 xl:col-span-4">
                    {/* Replace Monthly Target with Production Overview */}
                    <div className="rounded-2xl border border-gray-200 overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="px-5 pt-5 bg-white shadow-sm rounded-t-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                        Production Mensuelle
                                    </h3>
                                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                                        Progression de la production pétrolière
                                    </p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-lg">
                                    <FireIcon className="h-5 w-5 text-amber-500" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Objectif:</span>
                                    <span className="ml-2 text-sm font-bold text-gray-900 dark:text-white">85,000 barils</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Actuel:</span>
                                    <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">72,500 barils</span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '85%' }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                                />
                            </div>

                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>85% de l'objectif atteint</span>
                                <span>12 jours restants</span>
                            </div>
                        </div>

                        {/* Custom chart for petroleum production trends */}
                        <div className="bg-white dark:bg-gray-900 pt-4">
                            <MonthlySalesChart />
                        </div>
                    </div>

                    {/* Budget Summary */}
                    <BudgetSummary />
                </div>

                {/* Full Width Chart - renamed to match petroleum context better */}
                <div className="col-span-12">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <ChartPieIcon className="h-5 w-5 text-indigo-500" />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Performance des Opérations
                                </h3>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    Mensuel
                                </button>
                                <button className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    Trimestriel
                                </button>
                                <button className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    Annuel
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                                <h4 className="text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-2">Efficacité des Forages</h4>
                                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">94%</p>
                                <div className="flex items-center mt-2">
                                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-xs text-green-600 dark:text-green-400">+2.4% ce mois</span>
                                </div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                                <h4 className="text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-2">Temps Opérationnel</h4>
                                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">98.2%</p>
                                <div className="flex items-center mt-2">
                                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-xs text-green-600 dark:text-green-400">+0.7% ce mois</span>
                                </div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                                <h4 className="text-amber-700 dark:text-amber-400 text-sm font-medium mb-2">Incidents Sécurité</h4>
                                <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">0</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-xs text-amber-600 dark:text-amber-400">Même que le mois dernier</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <h4 className="text-blue-700 dark:text-blue-400 text-sm font-medium mb-2">Conformité</h4>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">100%</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-xs text-blue-600 dark:text-blue-400">Standards respectés</span>
                                </div>
                            </div>
                        </div>

                        <StatisticsChart />
                    </div>
                </div>
            </div>
        </>
    );
} 