import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, PencilIcon, BanknotesIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
    BudgetItem,
    fetchProjectBudgets,
    fetchProjectBudgetTotals,
    fetchProjectBudgetStats,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem
} from '../../store/slices/budgetSlice';

interface BudgetProps {
    projectId: string;
}

const Budget: React.FC<BudgetProps> = ({ projectId }) => {
    // Redux state
    const dispatch = useDispatch<AppDispatch>();
    const {
        items: budgetItems = [],
        totals = [],
        stats,
        loading,
        error
    } = useSelector((state: RootState) => state.budget);

    // Form state
    const [budgetType, setBudgetType] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    // Fetch budget data when component mounts
    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectBudgets(projectId));
            dispatch(fetchProjectBudgetTotals(projectId));
            dispatch(fetchProjectBudgetStats(projectId));
        }
    }, [dispatch, projectId]);

    // Function to handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!budgetType || !description || !amount) {
            toast.error('Tous les champs sont obligatoires');
            return;
        }

        if (isNaN(parseFloat(amount))) {
            toast.error('Le montant doit être un nombre');
            return;
        }

        try {
            if (editingId) {
                // Update existing budget item
                await dispatch(updateBudgetItem({
                    id: editingId,
                    data: {
                        type: budgetType,
                        description,
                        amount: parseFloat(amount),
                        currency
                    }
                })).unwrap();
                toast.success('Budget mis à jour avec succès');
                setEditingId(null);
            } else {
                // Add new budget item
                await dispatch(addBudgetItem({
                    projectId,
                    type: budgetType,
                    description,
                    amount: parseFloat(amount),
                    currency
                })).unwrap();
                toast.success('Budget ajouté avec succès');
            }

            // Reset form
            setBudgetType('');
            setDescription('');
            setAmount('');
            setCurrency('EUR');
            setIsFormVisible(false);
        } catch (err) {
            toast.error('Une erreur est survenue');
            console.error('Budget operation error:', err);
        }
    };

    // Function to edit a budget item
    const handleEdit = (item: BudgetItem) => {
        setBudgetType(item.type);
        setDescription(item.description);
        setAmount(item.amount.toString());
        setCurrency(item.currency);
        setEditingId(item._id || item.id || '');
        setIsFormVisible(true);
    };

    // Function to delete a budget item
    const handleDelete = async (id: string) => {
        try {
            await dispatch(deleteBudgetItem(id)).unwrap();
            toast.success('Budget supprimé avec succès');
        } catch (err) {
            toast.error('Erreur lors de la suppression du budget');
            console.error('Delete budget error:', err);
        }
    };

    // Refresh budget data
    const handleRefresh = () => {
        if (projectId) {
            dispatch(fetchProjectBudgets(projectId));
            dispatch(fetchProjectBudgetTotals(projectId));
            dispatch(fetchProjectBudgetStats(projectId));
        }
    };

    // Reset form
    const resetForm = () => {
        setBudgetType('');
        setDescription('');
        setAmount('');
        setCurrency('EUR');
        setEditingId(null);
        setIsFormVisible(false);
    };

    // Calculate budget totals based on Redux store data
    const budgetTotals = totals.reduce((acc, { currency, total }) => {
        acc[currency] = total;
        return acc;
    }, {} as Record<string, number>);

    // Show error if any
    useEffect(() => {
        if (error) {
            toast.error(`Erreur: ${error}`);
        }
    }, [error]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-8"
        >
            {/* Header with title and actions */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <BanknotesIcon className="h-8 w-8 text-emerald-500" />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Gestion du Budget
                    </h2>
                </div>
                <div className="flex space-x-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                        title="Actualiser"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsFormVisible(!isFormVisible)}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${isFormVisible
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            }`}
                    >
                        {isFormVisible ? (
                            <>
                                <XMarkIcon className="h-5 w-5" />
                                <span>Fermer</span>
                            </>
                        ) : (
                            <>
                                <PlusIcon className="h-5 w-5" />
                                <span>Nouveau budget</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Budget Totals */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(budgetTotals).map(([currency, total]) => (
                    <motion.div
                        key={currency}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/30"
                    >
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total ({currency})</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </motion.div>
                ))}

                {/* Add Budget Stats Card if available */}
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/30 col-span-full"
                    >
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">Statistiques</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Nombre total</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalCount} budgets</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Par type</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {Object.entries(stats.byType).map(([type, count]) => (
                                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                            {type}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {Object.keys(budgetTotals).length === 0 && !loading && (
                    <div className="col-span-full bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl text-center">
                        <p className="text-gray-500 dark:text-gray-400">Aucun budget disponible</p>
                    </div>
                )}
            </div>

            {/* Budget Form */}
            <AnimatePresence>
                {isFormVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 shadow-md border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {editingId ? 'Modifier le budget' : 'Ajouter un budget'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                                <div>
                                    <label htmlFor="budgetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Type de Budget
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="budgetType"
                                            value={budgetType}
                                            onChange={(e) => setBudgetType(e.target.value)}
                                            className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-emerald-500 focus:ring-0 dark:text-white transition-all duration-200 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                                            required
                                        >
                                            <option value="">-- Sélectionner --</option>
                                            <option value="Opérationnel">Opérationnel</option>
                                            <option value="Investissement">Investissement</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="RH">Ressources Humaines</option>
                                            <option value="Technique">Technique</option>
                                            <option value="HSE">HSE</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-emerald-500 focus:ring-0 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Description du budget"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Montant
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="amount"
                                            step="0.01"
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-emerald-500 focus:ring-0 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                            placeholder="0.00"
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">{currency}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Devise
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="currency"
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-emerald-500 focus:ring-0 dark:text-white transition-all duration-200 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                                        >
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                            <option value="MAD">MAD</option>
                                            <option value="DZD">DZD</option>
                                            <option value="TND">TND</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Annuler
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors duration-200"
                                >
                                    {loading ? (
                                        <div className="flex items-center space-x-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Traitement...</span>
                                        </div>
                                    ) : editingId ? (
                                        <div className="flex items-center space-x-2">
                                            <PencilIcon className="w-4 h-4" />
                                            <span>Mettre à jour</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <PlusIcon className="w-4 h-4" />
                                            <span>Ajouter</span>
                                        </div>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Budget Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Devise
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des données budgétaires...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : !budgetItems || budgetItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                <BanknotesIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun budget n'a été ajouté</p>
                                            <button
                                                onClick={() => setIsFormVisible(true)}
                                                className="mt-2 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors duration-200"
                                            >
                                                Ajouter un budget
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                budgetItems.map((item, index) => (
                                    <motion.tr
                                        key={item._id || item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-2">
                                                <div className={`h-2 w-2 rounded-full ${item.type === 'Opérationnel' ? 'bg-blue-500' :
                                                    item.type === 'Investissement' ? 'bg-purple-500' :
                                                        item.type === 'Marketing' ? 'bg-pink-500' :
                                                            item.type === 'RH' ? 'bg-yellow-500' :
                                                                item.type === 'Technique' ? 'bg-indigo-500' :
                                                                    item.type === 'HSE' ? 'bg-red-500' :
                                                                        'bg-gray-500'
                                                    }`}></div>
                                                <span>{item.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-medium">
                                            {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.currency}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors duration-150"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDelete(item._id || item.id || '')}
                                                    className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-150"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default Budget; 