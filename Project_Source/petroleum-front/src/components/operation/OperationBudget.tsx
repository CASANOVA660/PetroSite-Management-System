import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CurrencyDollarIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    ExclamationTriangleIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface OperationBudgetProps {
    projectId: string;
    initialBudget?: BudgetCategory[];
}

interface BudgetCategory {
    id: string;
    name: string;
    planned: number;
    actual: number;
    remaining: number;
    percent: number;
}

interface BudgetSummary {
    totalPlanned: number;
    totalActual: number;
    totalRemaining: number;
    percentSpent: number;
}

// Dummy budget data
const budgetData: BudgetCategory[] = [
    {
        id: 'equip',
        name: 'Équipement',
        planned: 120000,
        actual: 115000,
        remaining: 5000,
        percent: 95.8
    },
    {
        id: 'labor',
        name: 'Main d\'œuvre',
        planned: 85000,
        actual: 78000,
        remaining: 7000,
        percent: 91.8
    },
    {
        id: 'mat',
        name: 'Matériaux',
        planned: 65000,
        actual: 72000,
        remaining: -7000,
        percent: 110.8
    },
    {
        id: 'transp',
        name: 'Transport',
        planned: 35000,
        actual: 30000,
        remaining: 5000,
        percent: 85.7
    },
    {
        id: 'fuel',
        name: 'Carburant',
        planned: 25000,
        actual: 28000,
        remaining: -3000,
        percent: 112.0
    },
    {
        id: 'misc',
        name: 'Divers',
        planned: 20000,
        actual: 18000,
        remaining: 2000,
        percent: 90.0
    }
];

const OperationBudget: React.FC<OperationBudgetProps> = ({ projectId, initialBudget = [] }) => {
    const [loading, setLoading] = useState(true);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [summary, setSummary] = useState<BudgetSummary>({
        totalPlanned: 0,
        totalActual: 0,
        totalRemaining: 0,
        percentSpent: 0
    });

    useEffect(() => {
        // Simulate data loading
        setLoading(true);

        // If initialBudget is provided, use it
        if (initialBudget && initialBudget.length > 0) {
            setBudgetCategories(initialBudget);
            calculateSummary(initialBudget);
            setLoading(false);
        } else {
            // Use dummy data with a timeout to simulate API fetch
            const timer = setTimeout(() => {
                setBudgetCategories(budgetData);
                calculateSummary(budgetData);
                setLoading(false);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [projectId, initialBudget]);

    const calculateSummary = (categories: BudgetCategory[]) => {
        const totalPlanned = categories.reduce((acc, cat) => acc + cat.planned, 0);
        const totalActual = categories.reduce((acc, cat) => acc + cat.actual, 0);
        const totalRemaining = totalPlanned - totalActual;
        const percentSpent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

        setSummary({
            totalPlanned,
            totalActual,
            totalRemaining,
            percentSpent
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const toggleCategory = (categoryId: string) => {
        if (expandedCategory === categoryId) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(categoryId);
        }
    };

    const getBudgetStatusColor = (percent: number) => {
        if (percent > 105) return 'text-red-600 dark:text-red-400';
        if (percent > 95) return 'text-amber-600 dark:text-amber-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getBudgetBarColor = (percent: number) => {
        if (percent > 105) return 'bg-red-500';
        if (percent > 95) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <CurrencyDollarIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Budget du Projet
                </h2>
                <button
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Ajouter une dépense
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <ArrowPathIcon className="h-8 w-8 text-[#F28C38] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Budget Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget Total</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(summary.totalPlanned)}
                                    </p>
                                </div>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Dépenses Actuelles</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(summary.totalActual)}
                                    </p>
                                </div>
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <ArrowDownIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {summary.percentSpent.toFixed(1)}% du budget utilisé
                                </p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                    <div
                                        className={`h-2 rounded-full ${getBudgetBarColor(summary.percentSpent)}`}
                                        style={{ width: `${Math.min(summary.percentSpent, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget Restant</p>
                                    <p className={`text-2xl font-bold mt-1 ${summary.totalRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {formatCurrency(summary.totalRemaining)}
                                    </p>
                                </div>
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <ArrowUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Budget Categories */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-900 p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <div className="col-span-5">Catégorie</div>
                            <div className="col-span-2 text-right">Prévu</div>
                            <div className="col-span-2 text-right">Réel</div>
                            <div className="col-span-2 text-right">Restant</div>
                            <div className="col-span-1 text-right">%</div>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {budgetCategories.map((category) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer"
                                >
                                    <div
                                        className="grid grid-cols-12 p-4 items-center"
                                        onClick={() => toggleCategory(category.id)}
                                    >
                                        <div className="col-span-5 font-medium text-gray-900 dark:text-white flex items-center">
                                            <ChevronDownIcon
                                                className={`h-5 w-5 mr-2 text-gray-400 transition-transform ${expandedCategory === category.id ? 'transform rotate-180' : ''
                                                    }`}
                                            />
                                            {category.name}
                                            {category.percent > 105 && (
                                                <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-red-500" />
                                            )}
                                        </div>
                                        <div className="col-span-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatCurrency(category.planned)}
                                        </div>
                                        <div className="col-span-2 text-right text-gray-700 dark:text-gray-300">
                                            {formatCurrency(category.actual)}
                                        </div>
                                        <div className={`col-span-2 text-right font-medium ${category.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatCurrency(category.remaining)}
                                        </div>
                                        <div className={`col-span-1 text-right font-medium ${getBudgetStatusColor(category.percent)}`}>
                                            {category.percent.toFixed(1)}%
                                        </div>
                                    </div>

                                    {expandedCategory === category.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-gray-50 dark:bg-gray-800/50 px-4 pb-4"
                                        >
                                            <div className="ml-7 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                                    Détails pour {category.name}
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progression du budget</p>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                                            <div
                                                                className={`h-2.5 rounded-full ${getBudgetBarColor(category.percent)}`}
                                                                style={{ width: `${Math.min(category.percent, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {category.percent > 100
                                                            ? `Cette catégorie a dépassé le budget prévu de ${formatCurrency(Math.abs(category.remaining))}.`
                                                            : `Cette catégorie est actuellement à ${category.percent.toFixed(1)}% du budget prévu.`
                                                        }
                                                    </p>

                                                    <div className="flex justify-end">
                                                        <button className="text-sm text-[#F28C38] hover:text-[#E67E2E] font-medium">
                                                            Voir toutes les transactions
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OperationBudget; 