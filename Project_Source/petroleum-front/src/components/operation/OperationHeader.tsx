import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../store/slices/projectSlice';
import axios from 'axios';
import {
    CalendarIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Define interfaces for stats
interface EquipmentStats {
    total: number;
    active: number;
    pending: number;
}

interface PersonnelStats {
    total: number;
    day: number;
    night: number;
}

interface BudgetStats {
    percentage: number;
    used: number;
    total: number;
}

interface OperationHeaderProps {
    project: Project;
    equipmentStats?: EquipmentStats;
    personnelStats?: PersonnelStats;
    budgetStats?: BudgetStats;
    progressPercentage?: number;
}

const OperationHeader: React.FC<OperationHeaderProps> = ({
    project,
    equipmentStats: propEquipmentStats,
    personnelStats: propPersonnelStats,
    budgetStats: propBudgetStats,
    progressPercentage: propProgressPercentage
}) => {
    const [loading, setLoading] = useState(!propEquipmentStats || !propPersonnelStats || !propBudgetStats);
    const [equipmentStats, setEquipmentStats] = useState<EquipmentStats>(propEquipmentStats || { total: 0, active: 0, pending: 0 });
    const [personnelStats, setPersonnelStats] = useState<PersonnelStats>(propPersonnelStats || { total: 0, day: 0, night: 0 });
    const [budgetStats, setBudgetStats] = useState<BudgetStats>(propBudgetStats || { percentage: 0, used: 0, total: 0 });

    // Calculate progress percentage based on project dates
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const today = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const daysPercentage = Math.min(100, Math.floor((daysElapsed / totalDays) * 100));

    // Calculate overall project progress - use provided value or days percentage as fallback
    const progressPercentage = propProgressPercentage || daysPercentage;

    // Fetch operation stats when component mounts, but only if props weren't provided
    useEffect(() => {
        // If all stats are provided via props, don't fetch
        if (propEquipmentStats && propPersonnelStats && propBudgetStats) {
            setLoading(false);
            return;
        }

        if (project._id) {
            setLoading(true);

            // Fetch equipment stats if not provided via props
            const fetchEquipmentStats = async () => {
                if (propEquipmentStats) return;
                try {
                    const response = await axios.get(`/api/projects/${project._id}/equipment/stats`);
                    setEquipmentStats(response.data.data || { total: 0, active: 0, pending: 0 });
                } catch (error: any) {
                    console.error('Error fetching equipment stats:', error);
                    // Set default values if fetch fails
                    setEquipmentStats({ total: 0, active: 0, pending: 0 });
                }
            };

            // Fetch personnel stats if not provided via props
            const fetchPersonnelStats = async () => {
                if (propPersonnelStats) return;
                try {
                    const response = await axios.get(`/api/projects/${project._id}/personnel/stats`);
                    setPersonnelStats(response.data.data || { total: 0, day: 0, night: 0 });
                } catch (error: any) {
                    console.error('Error fetching personnel stats:', error);
                    // Set default values if fetch fails
                    setPersonnelStats({ total: 0, day: 0, night: 0 });
                }
            };

            // Fetch budget stats if not provided via props
            const fetchBudgetStats = async () => {
                if (propBudgetStats) return;
                try {
                    const response = await axios.get(`/api/projects/${project._id}/budget/stats`);
                    setBudgetStats(response.data.data || { percentage: 0, used: 0, total: 0 });
                } catch (error: any) {
                    console.error('Error fetching budget stats:', error);
                    // Set default values if fetch fails
                    setBudgetStats({ percentage: 0, used: 0, total: 0 });
                }
            };

            // Execute all fetches in parallel
            Promise.all([
                fetchEquipmentStats(),
                fetchPersonnelStats(),
                fetchBudgetStats()
            ])
                .then(() => setLoading(false))
                .catch((error) => {
                    toast.error(`Erreur lors du chargement des statistiques: ${error.message || 'Une erreur est survenue'}`);
                    setLoading(false);
                });
        }
    }, [project._id, propEquipmentStats, propPersonnelStats, propBudgetStats]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {project.name}
                        </h1>
                        <div className="flex items-center mt-1 text-gray-500 dark:text-gray-400">
                            <span className="text-sm">{project.projectNumber}</span>
                            <span className="mx-2">•</span>
                            <span className="text-sm">Client: {project.clientName}</span>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center"
                    >
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 flex items-center space-x-4">
                            <div className="flex items-center">
                                <div className="relative h-10 w-10 mr-3">
                                    <svg className="h-10 w-10" viewBox="0 0 36 36">
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="2"
                                        />
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                            strokeDasharray={`${progressPercentage}, 100`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 18 18)"
                                        />
                                    </svg>
                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{progressPercentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Progression</p>
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                                        {project.status === 'En opération' ? 'En opération' : 'En cours'}
                                    </p>
                                </div>
                            </div>
                            <span className="h-8 w-px bg-gray-300 dark:bg-gray-600"></span>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Jours restants</p>
                                <p className="font-semibold text-gray-700 dark:text-gray-300">{daysRemaining} jours</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                                <CalendarIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Durée du projet</h3>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{totalDays} jours</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="h-1 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${daysPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                                <WrenchScrewdriverIcon className="h-5 w-5 text-green-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipements</h3>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">
                                    {loading ? (
                                        <span className="animate-pulse">--</span>
                                    ) : (
                                        `${equipmentStats.active} / ${equipmentStats.total}`
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {loading ? (
                                        <span className="animate-pulse">Chargement...</span>
                                    ) : (
                                        `${equipmentStats.active} actifs, ${equipmentStats.pending} en attente`
                                    )}
                                </p>
                            </div>
                            <button className="text-xs flex items-center text-green-500 hover:text-green-400">
                                Détails <ChevronDownIcon className="h-3 w-3 ml-1" />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                                <UserGroupIcon className="h-5 w-5 text-indigo-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Personnel</h3>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">
                                    {loading ? (
                                        <span className="animate-pulse">--</span>
                                    ) : (
                                        personnelStats.total
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {loading ? (
                                        <span className="animate-pulse">Chargement...</span>
                                    ) : (
                                        `${personnelStats.day} jour, ${personnelStats.night} nuit`
                                    )}
                                </p>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-500">J</div>
                                <div className="h-6 w-6 rounded-full bg-indigo-200 dark:bg-indigo-800/30 flex items-center justify-center text-xs font-bold text-indigo-600">N</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                                <CurrencyDollarIcon className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget utilisé</h3>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">
                                    {loading ? (
                                        <span className="animate-pulse">--</span>
                                    ) : (
                                        `${budgetStats.percentage.toFixed(1)}%`
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {loading ? (
                                        <span className="animate-pulse">Chargement...</span>
                                    ) : (
                                        `${formatCurrency(budgetStats.used)} sur ${formatCurrency(budgetStats.total)}`
                                    )}
                                </p>
                            </div>
                            <div className="h-1 w-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${loading ? 0 : budgetStats.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default OperationHeader; 