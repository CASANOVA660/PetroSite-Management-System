import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DocumentTextIcon,
    PlusIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    DocumentDuplicateIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/solid';

interface OperationDailyReportProps {
    projectId: string;
}

interface DailyReport {
    id: string;
    date: string;
    title: string;
    supervisor: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    activities: string[];
    issues?: string[];
    weather?: string;
    safety?: string;
    hours: {
        planned: number;
        actual: number;
    };
}

// Dummy daily report data
const reportsData: DailyReport[] = [
    {
        id: 'dr1',
        date: '2023-10-24',
        title: 'Installation foreuse B-204',
        supervisor: 'Ahmed Benali',
        status: 'approved',
        submittedAt: '2023-10-24T18:30:00',
        activities: [
            'Installation de la foreuse B-204 sur le site',
            'Calibrage et tests initiaux',
            'Formation de l\'équipe sur les nouvelles procédures'
        ],
        issues: [],
        weather: 'Ensoleillé, 28°C',
        safety: 'Aucun incident à signaler',
        hours: {
            planned: 10,
            actual: 9
        }
    },
    {
        id: 'dr2',
        date: '2023-10-23',
        title: 'Préparation du site de forage',
        supervisor: 'Ahmed Benali',
        status: 'approved',
        submittedAt: '2023-10-23T19:15:00',
        activities: [
            'Nettoyage du terrain',
            'Installation des barrières de sécurité',
            'Positionnement des équipements auxiliaires'
        ],
        issues: [
            'Retard de livraison des matériaux de protection'
        ],
        weather: 'Partiellement nuageux, 25°C',
        safety: 'Aucun incident à signaler',
        hours: {
            planned: 8,
            actual: 10
        }
    },
    {
        id: 'dr3',
        date: '2023-10-25',
        title: 'Début des opérations de forage',
        supervisor: 'Mohammed Rafi',
        status: 'submitted',
        submittedAt: '2023-10-25T17:45:00',
        activities: [
            'Première phase de forage à 50m',
            'Analyse des échantillons préliminaires',
            'Ajustement des paramètres de forage'
        ],
        issues: [
            'Problème technique avec le système de refroidissement'
        ],
        weather: 'Ensoleillé, 30°C',
        safety: 'Incident mineur - surchauffe d\'équipement',
        hours: {
            planned: 12,
            actual: 11
        }
    },
    {
        id: 'dr4',
        date: '2023-10-26',
        title: 'Continuation des opérations',
        supervisor: 'Mohammed Rafi',
        status: 'draft',
        activities: [
            'Forage continu jusqu\'à 100m',
            'Maintenance préventive des équipements',
            'Préparation des rapports d\'échantillons'
        ],
        weather: 'Ensoleillé, 29°C',
        safety: 'Aucun incident à signaler',
        hours: {
            planned: 12,
            actual: 6
        }
    }
];

const OperationDailyReport: React.FC<OperationDailyReportProps> = ({ projectId }) => {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedReport, setExpandedReport] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<DailyReport['status'] | 'all'>('all');

    useEffect(() => {
        // Simulate data loading
        setLoading(true);
        const timer = setTimeout(() => {
            setReports(reportsData);
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [projectId]);

    const toggleReport = (reportId: string) => {
        if (expandedReport === reportId) {
            setExpandedReport(null);
        } else {
            setExpandedReport(reportId);
        }
    };

    // Filter reports based on search term and status
    const filteredReports = reports.filter(report => {
        const matchesSearch =
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Sort reports by date (newest first)
    const sortedReports = [...filteredReports].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getStatusColor = (status: DailyReport['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'submitted':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'approved':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusLabel = (status: DailyReport['status']) => {
        switch (status) {
            case 'draft':
                return 'Brouillon';
            case 'submitted':
                return 'Soumis';
            case 'approved':
                return 'Approuvé';
            case 'rejected':
                return 'Rejeté';
            default:
                return status;
        }
    };

    const getStatusIcon = (status: DailyReport['status']) => {
        switch (status) {
            case 'draft':
                return <DocumentTextIcon className="h-5 w-5" />;
            case 'submitted':
                return <DocumentDuplicateIcon className="h-5 w-5" />;
            case 'approved':
                return <CheckCircleIcon className="h-5 w-5" />;
            case 'rejected':
                return <XCircleIcon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
        return new Date(timeString).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <DocumentTextIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Rapports Journaliers
                </h2>
                <button
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Nouveau Rapport
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F28C38] focus:border-transparent sm:text-sm"
                        placeholder="Rechercher par titre ou superviseur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${statusFilter === 'all'
                                ? 'bg-[#F28C38] text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setStatusFilter('draft')}
                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${statusFilter === 'draft'
                                ? 'bg-gray-700 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        Brouillons
                    </button>
                    <button
                        onClick={() => setStatusFilter('submitted')}
                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${statusFilter === 'submitted'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        Soumis
                    </button>
                    <button
                        onClick={() => setStatusFilter('approved')}
                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${statusFilter === 'approved'
                                ? 'bg-green-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        Approuvés
                    </button>
                    <button
                        onClick={() => setStatusFilter('rejected')}
                        className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${statusFilter === 'rejected'
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                    >
                        Rejetés
                    </button>
                </div>
            </div>

            {/* Daily Reports List */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <ArrowPathIcon className="h-8 w-8 text-[#F28C38] animate-spin" />
                </div>
            ) : sortedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">Aucun rapport trouvé</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Aucun rapport ne correspond à vos critères de recherche.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedReports.map(report => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80"
                                onClick={() => toggleReport(report.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${getStatusColor(report.status)}`}>
                                            {getStatusIcon(report.status)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                                {report.title}
                                                <ChevronRightIcon
                                                    className={`h-5 w-5 ml-1 text-gray-400 transition-transform ${expandedReport === report.id ? 'transform rotate-90' : ''
                                                        }`}
                                                />
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {formatDate(report.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {getStatusLabel(report.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center mt-3 space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <UserIcon className="h-4 w-4 mr-1" />
                                        {report.supervisor}
                                    </div>
                                    <div className="flex items-center">
                                        <ClockIcon className="h-4 w-4 mr-1" />
                                        {report.hours.actual} / {report.hours.planned} heures
                                    </div>
                                    {report.issues && report.issues.length > 0 && (
                                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                            {report.issues.length} problème(s)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expandedReport === report.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-100 dark:border-gray-700"
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Activités réalisées
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                {report.activities.map((activity, index) => (
                                                    <li key={index}>{activity}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {report.issues && report.issues.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Problèmes rencontrés
                                                </h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400 ml-2">
                                                    {report.issues.map((issue, index) => (
                                                        <li key={index}>{issue}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {report.weather && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Conditions météo
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {report.weather}
                                                    </p>
                                                </div>
                                            )}

                                            {report.safety && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Sécurité
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {report.safety}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {report.submittedAt && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                                Soumis le {formatDate(report.submittedAt)} à {formatTime(report.submittedAt)}
                                            </div>
                                        )}

                                        <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                            <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                Voir détails
                                            </button>

                                            {report.status === 'draft' && (
                                                <button className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-[#F28C38] rounded-lg hover:bg-[#E67E2E] transition-colors">
                                                    <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                                                    Soumettre
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OperationDailyReport; 