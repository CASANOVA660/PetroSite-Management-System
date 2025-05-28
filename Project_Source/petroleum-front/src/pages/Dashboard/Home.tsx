import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { motion } from "framer-motion";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import PageMeta from "../../components/common/PageMeta";
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CheckCircleIcon,
  FireIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "../../store";
import { fetchUserTasks } from "../../store/slices/taskSlice";

export default function Home() {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const [greeting, setGreeting] = useState("");
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    urgent: 0
  });

  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Bonjour");
    else if (hours < 18) setGreeting("Bon après-midi");
    else setGreeting("Bonsoir");

    // Fetch tasks for this user
    dispatch(fetchUserTasks({ includeProjectActions: true }));
  }, [dispatch]);

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
    <>
      <PageMeta
        title="Tableau de Bord | Système de Gestion Pétrolière"
        description="Tableau de bord personnel pour la gestion des opérations pétrolières"
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
          <span className="ml-2 text-amber-500">{user?.nom || "Utilisateur"}</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Voici un aperçu de vos tâches et activités
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Task Overview */}
        <div className="col-span-12 xl:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Mes Tâches
                </h3>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  {taskStats.total} tâches
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4"
              >
                <h4 className="text-purple-700 dark:text-purple-300 text-sm font-medium">Total</h4>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{taskStats.total}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ClipboardDocumentCheckIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-purple-600 dark:text-purple-400">Toutes tâches</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4"
              >
                <h4 className="text-amber-700 dark:text-amber-300 text-sm font-medium">À faire</h4>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">{taskStats.todo}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ClockIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">À commencer</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4"
              >
                <h4 className="text-blue-700 dark:text-blue-300 text-sm font-medium">En cours</h4>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{taskStats.inProgress}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">En progression</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4"
              >
                <h4 className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">Terminées</h4>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{taskStats.completed}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Complétées</span>
                </div>
              </motion.div>
            </div>

            {/* Task Chart */}
            <MonthlySalesChart />
          </div>
        </div>

        {/* Production Overview */}
        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-5 pt-5 bg-white shadow-sm rounded-t-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Ma Production
                  </h3>
                  <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                    Performance individuelle
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
                  <span className="ml-2 text-sm font-bold text-gray-900 dark:text-white">25 tâches</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Actuel:</span>
                  <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {taskStats.inProgress + taskStats.completed}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((taskStats.inProgress + taskStats.completed) / 25) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{Math.min(100, Math.round(((taskStats.inProgress + taskStats.completed) / 25) * 100))}% de l'objectif atteint</span>
                <span>Ce mois</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Statistics */}
        <div className="col-span-12">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ChartPieIcon className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Statistiques de Performance
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                <h4 className="text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-2">Efficacité</h4>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">92%</p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 dark:text-green-400">+1.2% ce mois</span>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <h4 className="text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-2">Taux d'achèvement</h4>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                  {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                </p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 dark:text-green-400">Progression</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <h4 className="text-amber-700 dark:text-amber-400 text-sm font-medium mb-2">Ponctualité</h4>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">98%</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-amber-600 dark:text-amber-400">Livraison à temps</span>
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
