import { useState, useEffect, useMemo } from "react";
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
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "../../store";
import { fetchUserTasks } from "../../store/slices/taskSlice";
import { fetchUsers } from "../../store/slices/userSlice";
import { fetchEquipment } from "../../store/slices/equipmentSlice";
import { fetchDailyReports } from "../../store/slices/operationSlice";

// Define reusable StatCard component
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

// Common TasksOverview component for all roles
const TasksOverview = ({ taskStats }: { taskStats: any }) => {
  return (
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

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% complété</span>
        <span>Ce mois</span>
      </div>
    </div>
  );
};

// HR specific components
const HREmployeeOverview = ({ userStats }: { userStats: any }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
          Aperçu des Employés
        </h3>
      </div>

      <div className="space-y-5">
        {/* Active Employees */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Employés Actifs</span>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {userStats.active} ({userStats.total > 0 ? Math.round((userStats.active / userStats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${userStats.total > 0 ? (userStats.active / userStats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Inactive Employees */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Employés Inactifs</span>
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {userStats.inactive} ({userStats.total > 0 ? Math.round((userStats.inactive / userStats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-red-500"
              style={{ width: `${userStats.total > 0 ? (userStats.inactive / userStats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Distribution par Rôle
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Managers</div>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{userStats.managers}</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Opérateurs</div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">{userStats.operators}</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Chef de Base</div>
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{userStats.baseChiefs}</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">RH</div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{userStats.hr}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentActivity = () => {
  const mockActivities = [
    { id: 1, type: 'new-employee', user: 'Ahmed Karim', action: 'a été embauché', time: '2h' },
    { id: 2, type: 'leave-request', user: 'Sofia Mansouri', action: 'a demandé un congé', time: '4h' },
    { id: 3, type: 'contract-update', user: 'Mehdi Alaoui', action: 'a renouvelé son contrat', time: '1j' },
    { id: 4, type: 'training', user: 'Yasmine Tazi', action: 'a terminé sa formation', time: '2j' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Activité Récente
        </h3>
      </div>

      <div className="space-y-4">
        {mockActivities.map(activity => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">{activity.user}</span> {activity.action}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Il y a {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Base Chief specific components
const EquipmentStatusOverview = ({ equipmentStats }: { equipmentStats: any }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <WrenchScrewdriverIcon className="h-5 w-5 text-indigo-500 mr-2" />
          État des Équipements
        </h3>
      </div>

      {equipmentStats.total > 0 ? (
        <div>
          {/* Doughnut Chart */}
          <div className="flex justify-center mb-6 relative">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" className="dark:stroke-gray-700" />
                <path
                  d={`M 50 5 A 45 45 0 0 1 95 50`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                />
                <path
                  d={`M 95 50 A 45 45 0 0 1 50 95`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="10"
                />
                <path
                  d={`M 50 95 A 45 45 0 0 1 5 50`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="10"
                />
                <path
                  d={`M 5 50 A 45 45 0 0 1 50 5`}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="10"
                />
                <circle cx="50" cy="50" r="30" fill="white" className="dark:fill-gray-800" />
                <text x="50" y="45" textAnchor="middle" className="fill-gray-700 dark:fill-gray-200 text-lg font-semibold">
                  {equipmentStats.total}
                </text>
                <text x="50" y="60" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-xs">
                  équipements
                </text>
              </svg>
            </div>
          </div>

          {/* Legend & Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-3 w-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {equipmentStats.available} ({equipmentStats.total > 0 ? Math.round((equipmentStats.available / equipmentStats.total) * 100) : 0}%)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="mt-1 h-3 w-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En utilisation</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {equipmentStats.inUse} ({equipmentStats.total > 0 ? Math.round((equipmentStats.inUse / equipmentStats.total) * 100) : 0}%)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="mt-1 h-3 w-3 rounded-full bg-amber-500"></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {equipmentStats.maintenance} ({equipmentStats.total > 0 ? Math.round((equipmentStats.maintenance / equipmentStats.total) * 100) : 0}%)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="mt-1 h-3 w-3 rounded-full bg-purple-500"></div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Réservé</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {equipmentStats.reserved} ({equipmentStats.total > 0 ? Math.round((equipmentStats.reserved / equipmentStats.total) * 100) : 0}%)
                </p>
              </div>
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

const MaintenanceSchedule = () => {
  const mockMaintenanceItems = [
    { id: 1, equipment: 'Foreuse SL-450', date: '12/08/2023', status: 'Planifiée' },
    { id: 2, equipment: 'Pompe hydraulique PH-100', date: '15/08/2023', status: 'En retard' },
    { id: 3, equipment: 'Générateur GE-5000', date: '20/08/2023', status: 'Planifiée' },
    { id: 4, equipment: 'Compresseur AIR-MAX', date: '25/08/2023', status: 'Planifiée' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <WrenchScrewdriverIcon className="h-5 w-5 text-amber-500 mr-2" />
          Maintenance Planifiée
        </h3>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Équipement</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockMaintenanceItems.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.equipment}</td>
                <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">{item.date}</td>
                <td className="px-3 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Planifiée' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Operator Chief specific components
const ReportsSummary = ({ reportStats }: { reportStats: any }) => {
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-amber-500 mr-2" />
          Rapports Journaliers
        </h3>
      </div>

      {reportStats.total > 0 ? (
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

          {reportStats.recentReports && reportStats.recentReports.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rapports récents
              </h4>

              <div className="space-y-3">
                {reportStats.recentReports.map((report: any) => (
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

const OperationPerformance = () => {
  // Mock data for operation performance metrics
  const performanceData = {
    safety: {
      incidents: 0,
      nearMisses: 2,
      complianceRate: 98
    },
    efficiency: {
      equipmentUtilization: 85,
      operationUptime: 95
    },
    production: {
      target: 1000,
      actual: 950,
      percentage: 95
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
          Performance Opérationnelle
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Safety metrics */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            Sécurité
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Incidents</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.safety.incidents}</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1 bg-green-500 rounded-full"
                  style={{ width: `${Math.max(0, 100 - performanceData.safety.incidents * 10)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Quasi-accidents</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.safety.nearMisses}</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1 bg-green-500 rounded-full"
                  style={{ width: `${Math.max(0, 100 - performanceData.safety.nearMisses * 5)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Conformité</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.safety.complianceRate}%</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1 bg-green-500 rounded-full"
                  style={{ width: `${performanceData.safety.complianceRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency metrics */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Efficacité
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Utilisation des équipements</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.efficiency.equipmentUtilization}%</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1 bg-blue-500 rounded-full"
                  style={{ width: `${performanceData.efficiency.equipmentUtilization}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Temps de fonctionnement</span>
                <span className="font-medium text-gray-900 dark:text-white">{performanceData.efficiency.operationUptime}%</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-1 bg-blue-500 rounded-full"
                  style={{ width: `${performanceData.efficiency.operationUptime}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Production metrics */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
            Production
          </h4>

          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#e5e7eb"
                  className="dark:stroke-gray-700"
                  strokeWidth="10"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#f59e0b"
                  className="dark:stroke-amber-500"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * performanceData.production.percentage / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-amber-800 dark:text-amber-300">
                  {performanceData.production.percentage}%
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {performanceData.production.actual} / {performanceData.production.target}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Objectif de production atteint
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { users } = useSelector((state: RootState) => state.users);
  const { equipment } = useSelector((state: RootState) => state.equipment);
  const { dailyReports } = useSelector((state: RootState) => state.operation);

  const [greeting, setGreeting] = useState("");
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    urgent: 0
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    managers: 0,
    operators: 0,
    baseChiefs: 0,
    hr: 0
  });
  const [equipmentStats, setEquipmentStats] = useState({
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    reserved: 0
  });
  const [reportStats, setReportStats] = useState({
    total: 0,
    approved: 0,
    submitted: 0,
    draft: 0,
    rejected: 0,
    recentReports: [] as any[]
  });

  useEffect(() => {
    // Set greeting based on time of day
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Bonjour");
    else if (hours < 18) setGreeting("Bon après-midi");
    else setGreeting("Bonsoir");

    // Fetch data based on user role
    dispatch(fetchUserTasks({ includeProjectActions: true }));

    // For RH personnel, fetch user data
    if (user?.role === "RH" || user?.role === "Admin") {
      dispatch(fetchUsers());
    }

    // For Base Chief and Operators, fetch equipment data
    if (user?.role === "Chef de Base" || user?.role === "Opérateur" || user?.role === "Admin") {
      dispatch(fetchEquipment());
    }

    // For Operators, fetch daily reports
    if (user?.role === "Opérateur" || user?.role === "Chef Opérateur" || user?.role === "Admin") {
      dispatch(fetchDailyReports(""));
    }
  }, [dispatch, user?.role]);

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

  // Calculate user statistics when user data changes
  useEffect(() => {
    if (users && users.length > 0) {
      setUserStats({
        total: users.length,
        active: users.filter(u => u.estActif).length,
        inactive: users.filter(u => !u.estActif).length,
        managers: users.filter(u => u.role === 'Manager').length,
        operators: users.filter(u => u.role === 'Opérateur' || u.role === 'Chef Opérateur').length,
        baseChiefs: users.filter(u => u.role === 'Chef de Base').length,
        hr: users.filter(u => u.role === 'RH').length
      });
    }
  }, [users]);

  // Calculate equipment statistics when equipment data changes
  useEffect(() => {
    if (equipment && equipment.length > 0) {
      setEquipmentStats({
        total: equipment.length,
        available: equipment.filter((eq: any) => eq.status === 'available').length,
        inUse: equipment.filter((eq: any) => eq.status === 'In Use' || eq.status === 'inUse').length,
        maintenance: equipment.filter((eq: any) => eq.status === 'maintenance').length,
        reserved: equipment.filter((eq: any) => eq.status === 'reserved').length
      });
    }
  }, [equipment]);

  // Calculate report statistics when report data changes
  useEffect(() => {
    if (dailyReports && dailyReports.data) {
      setReportStats({
        total: dailyReports.data.length,
        approved: dailyReports.data.filter(r => r.status === 'approved').length,
        submitted: dailyReports.data.filter(r => r.status === 'submitted').length,
        draft: dailyReports.data.filter(r => r.status === 'draft').length,
        rejected: dailyReports.data.filter(r => r.status === 'rejected').length,
        recentReports: [...dailyReports.data]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
      });
    }
  }, [dailyReports]);

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

      {/* Common Stats for all roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />}
          title="Mes Tâches"
          value={taskStats.total}
          color="bg-purple-600"
          trend={taskStats.total > 0 ? {
            value: Math.round((taskStats.completed / taskStats.total) * 100),
            isPositive: true
          } : undefined}
        />
        <StatCard
          icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
          title="Tâches Complétées"
          value={taskStats.completed}
          color="bg-green-600"
          subtitle={`${taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%`}
        />
        <StatCard
          icon={<ClockIcon className="h-6 w-6 text-white" />}
          title="En Progression"
          value={taskStats.inProgress}
          color="bg-blue-600"
        />
        <StatCard
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-white" />}
          title="Tâches Urgentes"
          value={taskStats.urgent}
          color="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Common Task Overview for all roles */}
        <div className="col-span-12 xl:col-span-6">
          <TasksOverview taskStats={taskStats} />
        </div>

        {/* Role-specific sections */}
        {user?.role === "RH" && (
          <div className="col-span-12 xl:col-span-6">
            <HREmployeeOverview userStats={userStats} />
          </div>
        )}

        {user?.role === "Chef de Base" && (
          <div className="col-span-12 xl:col-span-6">
            <EquipmentStatusOverview equipmentStats={equipmentStats} />
          </div>
        )}

        {(user?.role === "Opérateur" || user?.role === "Chef Opérateur") && (
          <div className="col-span-12 xl:col-span-6">
            <ReportsSummary reportStats={reportStats} />
          </div>
        )}

        {/* Second row of content */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview - common for all */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FireIcon className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Ma Performance
                  </h3>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-4 rounded-xl">
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

              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>

            {/* Role-specific secondary section */}
            {user?.role === "RH" && <RecentActivity />}

            {user?.role === "Chef de Base" && <MaintenanceSchedule />}

            {(user?.role === "Opérateur" || user?.role === "Chef Opérateur") && <OperationPerformance />}
          </div>
        </div>
      </div>
    </>
  );
}
