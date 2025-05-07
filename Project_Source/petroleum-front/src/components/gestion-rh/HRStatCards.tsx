import { UsersIcon, ClipboardDocumentCheckIcon, ClockIcon, BellAlertIcon, FolderIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Types
interface StatCardProps {
    title: string;
    value: string | number;
    percentChange: number;
    icon: React.ReactNode;
    color: string;
}

export default function HRStatCards() {
    // Mock data - would be replaced with real API calls
    const stats = [
        {
            title: 'Total Employés',
            value: 243,
            percentChange: 12,
            icon: <UsersIcon className="h-6 w-6" />,
            color: 'bg-blue-500/10 text-blue-500'
        },
        {
            title: 'Contrats Actifs',
            value: 198,
            percentChange: 4,
            icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />,
            color: 'bg-green-500/10 text-green-500'
        },
        {
            title: 'Renouvellements en Attente',
            value: 16,
            percentChange: -3,
            icon: <ClockIcon className="h-6 w-6" />,
            color: 'bg-orange-500/10 text-orange-500'
        },
        {
            title: 'Alertes Performance',
            value: 8,
            percentChange: -25,
            icon: <BellAlertIcon className="h-6 w-6" />,
            color: 'bg-red-500/10 text-red-500'
        },
        {
            title: 'Documents Chargés',
            value: 2456,
            percentChange: 17,
            icon: <FolderIcon className="h-6 w-6" />,
            color: 'bg-purple-500/10 text-purple-500'
        }
    ];

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