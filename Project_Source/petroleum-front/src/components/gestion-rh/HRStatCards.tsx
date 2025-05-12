import { UsersIcon, ClipboardDocumentCheckIcon, ClockIcon, BellAlertIcon, FolderIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchEmployees } from '../../store/slices/employeesSlice';

// Types
interface StatCardProps {
    title: string;
    value: string | number;
    percentChange: number;
    icon: React.ReactNode;
    color: string;
}

export default function HRStatCards() {
    const dispatch = useDispatch();
    const { employees, loading } = useSelector((state: RootState) => state.employees);

    useEffect(() => {
        dispatch(fetchEmployees() as any);
    }, [dispatch]);

    // Compute stats from employees
    const totalEmployees = employees.length;
    const activeContracts = employees.filter(e => e.status === 'active').length;
    // For demo: contracts expiring soon = status 'pending' (customize as needed)
    const pendingRenewals = employees.filter(e => e.status === 'pending').length;
    // For demo: performance alerts = status 'onleave' (customize as needed)
    const performanceAlerts = employees.filter(e => e.status === 'onleave').length;
    // Document count: sum all documents in all folders (recursive)
    function countDocuments(folders: any[]): number {
        if (!folders) return 0;
        return folders.reduce((acc, folder) => {
            const docs = Array.isArray(folder.documents) ? folder.documents.length : 0;
            const sub = folder.subfolders ? countDocuments(folder.subfolders) : 0;
            return acc + docs + sub;
        }, 0);
    }
    const documentCount = employees.reduce((acc, e) => acc + countDocuments(e.folders || []), 0);

    // For percentChange, you may want to fetch previous period data. Here, we use dummy values.
    const stats = [
        {
            title: 'Total Employés',
            value: totalEmployees,
            percentChange: 12, // TODO: Replace with real delta
            icon: <UsersIcon className="h-6 w-6" />, color: 'bg-[#FA812F]/10 text-[#FA812F]'
        },
        {
            title: 'Contrats Actifs',
            value: activeContracts,
            percentChange: 4, // TODO: Replace with real delta
            icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />, color: 'bg-[#FA812F]/10 text-[#FA812F]'
        },
        {
            title: 'Renouvellements en Attente',
            value: pendingRenewals,
            percentChange: -3, // TODO: Replace with real delta
            icon: <ClockIcon className="h-6 w-6" />, color: 'bg-[#FA812F]/10 text-[#FA812F]'
        },
        {
            title: 'Alertes Performance',
            value: performanceAlerts,
            percentChange: -25, // TODO: Replace with real delta
            icon: <BellAlertIcon className="h-6 w-6" />, color: 'bg-[#FA812F]/10 text-[#FA812F]'
        },
        {
            title: 'Documents Chargés',
            value: documentCount,
            percentChange: 17, // TODO: Replace with real delta
            icon: <FolderIcon className="h-6 w-6" />, color: 'bg-[#FA812F]/10 text-[#FA812F]'
        }
    ];

    if (loading) {
        return <div className="h-32 flex items-center justify-center text-gray-500">Chargement des statistiques...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    percentChange={stat.percentChange}
                    icon={stat.icon}
                    color={stat.color}
                />
            ))}
        </div>
    );
}

function StatCard({ title, value, percentChange, icon, color }: StatCardProps) {
    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <span className={`p-2 rounded-lg ${color}`}>
                    {icon}
                </span>
                <div className={`text-sm font-medium ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                    {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}%
                </div>
            </div>

            <div className="mt-1">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</h3>
                <p className="text-2xl font-bold text-black dark:text-white mt-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>

            <div className="mt-3">
                <motion.div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"
                    whileHover={{ scale: 1.03 }}
                >
                    <motion.div
                        className={`h-1.5 rounded-full ${percentChange >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(percentChange) * 3, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
} 