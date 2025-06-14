import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { motion } from 'framer-motion';
import {
    DocumentTextIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    CloudIcon,
    ExclamationCircleIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PencilIcon,
    EyeIcon,
    DocumentDuplicateIcon,
    PlusIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { format, subDays, parseISO, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    fetchDailyReports,
    createDailyReport,
    updateDailyReport,
    submitDailyReport,
    approveDailyReport,
    rejectDailyReport,
    DailyReport
} from '../../store/slices/operationSlice';
import { toast } from 'react-hot-toast';

interface OperationDailyReportProps {
    projectId: string;
    initialReports?: DailyReport[];
}

const OperationDailyReport: React.FC<OperationDailyReportProps> = ({ projectId, initialReports = [] }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { data: reportData, loading } = useSelector((state: RootState) => state.operation.dailyReports);
    const { user } = useSelector((state: RootState) => state.auth);

    // Check if the user is a manager
    const isManager = user?.role === 'Manager';

    const [reports, setReports] = useState<DailyReport[]>([]);
    const [expandedReport, setExpandedReport] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReportId, setRejectReportId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [editingReport, setEditingReport] = useState<DailyReport | null>(null);

    // Add state for the new report form
    const [newReport, setNewReport] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        activities: [{ description: '', startTime: '08:00', endTime: '17:00', status: 'inProgress' as 'completed' | 'inProgress' | 'delayed' | 'cancelled' }],
        weatherConditions: '',
        healthAndSafety: {
            incidents: 0,
            nearMisses: 0,
            safetyMeetingHeld: false,
            notes: ''
        },
        challenges: '',
        solutions: ''
    });

    // Function to add a new activity to the form
    const addActivity = () => {
        setNewReport({
            ...newReport,
            activities: [
                ...newReport.activities,
                { description: '', startTime: '08:00', endTime: '17:00', status: 'inProgress' as 'completed' | 'inProgress' | 'delayed' | 'cancelled' }
            ]
        });
    };

    // Function to update an activity in the form
    const updateActivity = (index: number, field: string, value: string) => {
        const updatedActivities = [...newReport.activities];
        updatedActivities[index] = {
            ...updatedActivities[index],
            [field]: value
        };
        setNewReport({
            ...newReport,
            activities: updatedActivities
        });
    };

    // Function to remove an activity from the form
    const removeActivity = (index: number) => {
        if (newReport.activities.length <= 1) return; // Keep at least one activity
        const updatedActivities = [...newReport.activities];
        updatedActivities.splice(index, 1);
        setNewReport({
            ...newReport,
            activities: updatedActivities
        });
    };

    // Function to handle opening the edit modal
    const handleEditReport = (report: DailyReport) => {
        // Check if user can modify this report
        if (!canModifyReport(report)) {
            toast.error('Vous n\'avez pas les permissions pour modifier ce rapport');
            return;
        }

        // Set the report to be edited
        setEditingReport(report);

        // Pre-fill the form with the report data
        setNewReport({
            date: report.date,
            title: report.title || '',
            activities: report.activities && report.activities.length > 0
                ? report.activities.map(activity => ({
                    description: activity.description || '',
                    startTime: activity.startTime || '08:00',
                    endTime: activity.endTime || '17:00',
                    status: activity.status || 'inProgress' as 'completed' | 'inProgress' | 'delayed' | 'cancelled'
                }))
                : [{ description: '', startTime: '08:00', endTime: '17:00', status: 'inProgress' as 'completed' | 'inProgress' | 'delayed' | 'cancelled' }],
            weatherConditions: report.weatherConditions || '',
            healthAndSafety: {
                incidents: report.healthAndSafety?.incidents || 0,
                nearMisses: report.healthAndSafety?.nearMisses || 0,
                safetyMeetingHeld: report.healthAndSafety?.safetyMeetingHeld || false,
                notes: report.healthAndSafety?.notes || ''
            },
            challenges: report.challenges || '',
            solutions: report.solutions || ''
        });

        // Show the modal
        setShowModal(true);
    };

    // Update the handleCreateReport function to handle both creation and editing
    const handleCreateReport = () => {
        // Validate form
        if (!newReport.date) {
            toast.error('Veuillez sélectionner une date');
            return;
        }

        if (!newReport.activities || newReport.activities.length === 0) {
            toast.error('Veuillez ajouter au moins une activité');
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading(editingReport ? 'Mise à jour du rapport...' : 'Création du rapport...');

        // Create report data
        const reportData = {
            ...newReport,
            title: newReport.title || `Rapport journalier - ${format(new Date(newReport.date), 'dd/MM/yyyy')}`
        };

        if (editingReport) {
            // Update via Redux
            dispatch(updateDailyReport({
                reportId: editingReport._id,
                reportData
            }))
                .unwrap()
                .then(() => {
                    toast.dismiss(loadingToast);
                    toast.success('Rapport mis à jour avec succès');
                    setShowModal(false);
                    setEditingReport(null);
                    resetNewReportForm();
                })
                .catch((error) => {
                    toast.dismiss(loadingToast);
                    toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
                    console.error('Failed to update report:', error);
                });
        } else {
            // Create via Redux
            dispatch(createDailyReport({ projectId: projectId || '', reportData }))
                .unwrap()
                .then(() => {
                    toast.dismiss(loadingToast);
                    toast.success('Rapport créé avec succès');
                    setShowModal(false);
                    resetNewReportForm();
                })
                .catch((error) => {
                    toast.dismiss(loadingToast);
                    toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
                    console.error('Failed to create report:', error);
                });
        }
    };

    // Reset the new report form
    const resetNewReportForm = () => {
        setNewReport({
            date: format(new Date(), 'yyyy-MM-dd'),
            title: '',
            activities: [{ description: '', startTime: '08:00', endTime: '17:00', status: 'inProgress' as 'completed' | 'inProgress' | 'delayed' | 'cancelled' }],
            weatherConditions: '',
            healthAndSafety: {
                incidents: 0,
                nearMisses: 0,
                safetyMeetingHeld: false,
                notes: ''
            },
            challenges: '',
            solutions: ''
        });
    };

    // Add functions to handle approving and rejecting reports
    const handleApproveReport = (reportId: string) => {
        // Check if user is a manager
        if (!isManager) {
            toast.error('Seuls les managers peuvent approuver les rapports');
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading('Approbation du rapport...');

        // Approve via Redux
        dispatch(approveDailyReport(reportId))
            .unwrap()
            .then(() => {
                toast.dismiss(loadingToast);
                toast.success('Rapport approuvé');
            })
            .catch((error) => {
                toast.dismiss(loadingToast);
                toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
                console.error('Failed to approve report:', error);
            });
    };

    const openRejectModal = (reportId: string) => {
        // Check if user is a manager
        if (!isManager) {
            toast.error('Seuls les managers peuvent rejeter les rapports');
            return;
        }

        setRejectReportId(reportId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectReport = (reportId: string) => {
        // Check if user is a manager
        if (!isManager) {
            toast.error('Seuls les managers peuvent rejeter les rapports');
            return;
        }

        if (!rejectionReason.trim()) {
            toast.error('Veuillez fournir une raison de rejet');
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading('Rejet du rapport...');

        // Reject via Redux
        dispatch(rejectDailyReport({ reportId, rejectionReason }))
            .unwrap()
            .then(() => {
                toast.dismiss(loadingToast);
                toast.success('Rapport rejeté');
                setShowRejectModal(false);
                setRejectionReason('');
            })
            .catch((error) => {
                toast.dismiss(loadingToast);
                toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
                console.error('Failed to reject report:', error);
            });
    };

    useEffect(() => {
        if (projectId && projectId !== 'dummy-project') {
            dispatch(fetchDailyReports(projectId))
                .unwrap()
                .catch((error) => {
                    toast.error(`Erreur lors du chargement des rapports: ${error.message || 'Une erreur est survenue'}`);
                    console.error('Error fetching daily reports:', error);
                });
        }
    }, [dispatch, projectId]);

    useEffect(() => {
        // If we have initialReports from props, use those
        if (initialReports && initialReports.length > 0) {
            setReports(initialReports);
        } else if (reportData && reportData.length > 0) {
            // If reports data is available from Redux, use it
            setReports(reportData);
        }
    }, [initialReports, reportData, reports.length]);

    const toggleReportExpansion = (reportId: string) => {
        setExpandedReport(expandedReport === reportId ? null : reportId);
    };

    const getFilteredReports = () => {
        // First filter by status
        let filtered = reports;
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(report => report.status === selectedStatus);
        }

        // Then filter by time period
        const today = new Date();
        const oneWeekAgo = subDays(today, 7);
        const oneMonthAgo = subDays(today, 30);

        if (selectedPeriod === 'week') {
            filtered = filtered.filter(report => {
                const reportDate = parseISO(report.date);
                return isAfter(reportDate, oneWeekAgo) || reportDate.getTime() === oneWeekAgo.getTime();
            });
        } else if (selectedPeriod === 'month') {
            filtered = filtered.filter(report => {
                const reportDate = parseISO(report.date);
                return isAfter(reportDate, oneMonthAgo) || reportDate.getTime() === oneMonthAgo.getTime();
            });
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            case 'submitted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusLabel = (status: string) => {
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

    const getWeatherIcon = (weather: string) => {
        switch (weather) {
            case 'sunny':
                return <div className="text-yellow-500"><CloudIcon className="h-5 w-5" /></div>;
            case 'cloudy':
                return <div className="text-gray-500 dark:text-gray-400"><CloudIcon className="h-5 w-5" /></div>;
            case 'rainy':
                return <div className="text-blue-500"><CloudIcon className="h-5 w-5" /></div>;
            default:
                return <div className="text-gray-400"><CloudIcon className="h-5 w-5" /></div>;
        }
    };

    const getSafetyIcon = (safety: string) => {
        switch (safety) {
            case 'good':
                return <div className="text-green-500"><ShieldCheckIcon className="h-5 w-5" /></div>;
            case 'incident':
                return <div className="text-red-500"><ExclamationCircleIcon className="h-5 w-5" /></div>;
            case 'near-miss':
                return <div className="text-yellow-500"><ExclamationCircleIcon className="h-5 w-5" /></div>;
            default:
                return <div className="text-gray-400"><ShieldCheckIcon className="h-5 w-5" /></div>;
        }
    };

    // Add this function to handle submitting reports
    const handleSubmitReport = (reportId: string) => {
        // Show loading toast
        const loadingToast = toast.loading('Soumission du rapport...');

        // Submit via Redux
        dispatch(submitDailyReport(reportId))
            .unwrap()
            .then(() => {
                toast.dismiss(loadingToast);
                toast.success('Rapport soumis pour approbation');
            })
            .catch((error) => {
                toast.dismiss(loadingToast);
                toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
                console.error('Failed to submit report:', error);
            });
    };

    // Function to check if user can modify a report
    const canModifyReport = (report: DailyReport) => {
        // User can modify if they are the creator or a manager
        return user?._id === report.createdBy || isManager;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <DocumentTextIcon className="h-7 w-7 mr-2 text-[#F28C38]" />
                    Rapports journaliers
                </h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Nouveau rapport
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Statut:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">Tous</option>
                            <option value="draft">Brouillons</option>
                            <option value="submitted">Soumis</option>
                            <option value="approved">Approuvés</option>
                            <option value="rejected">Rejetés</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Période:</span>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F28C38] focus:border-[#F28C38] p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="all">Tous</option>
                        </select>
                    </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getFilteredReports().length} rapport(s) trouvé(s)
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {getFilteredReports().length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun rapport trouvé</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Aucun rapport ne correspond à vos critères de filtrage.
                            </p>
                        </div>
                    ) : (
                        getFilteredReports().map((report) => (
                            <motion.div
                                key={report._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                            >
                                {/* Report header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70 flex justify-between items-center"
                                    onClick={() => toggleReportExpansion(report._id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <DocumentTextIcon className="h-6 w-6 text-[#F28C38]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{report.title}</h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                                    {formatDate(report.date)}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <UserIcon className="h-4 w-4 mr-1" />
                                                    {report.supervisor}
                                                </div>
                                                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                                                    {getStatusLabel(report.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex space-x-2">
                                            {getWeatherIcon(report.weather || '')}
                                            {getSafetyIcon(report.safety || '')}
                                            {report.issues && report.issues.length > 0 && (
                                                <div className="text-amber-500">
                                                    <ExclamationCircleIcon className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                        {expandedReport === report._id ? (
                                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {expandedReport === report._id && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left column */}
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Activités</h4>
                                                <div className="space-y-3">
                                                    {report.activities.map((activity, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 rounded-lg border ${activity.status === 'completed'
                                                                ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30'
                                                                : activity.status === 'delayed'
                                                                    ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                                                                    : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30'
                                                                }`}
                                                        >
                                                            <div className="font-medium mb-1">{activity.description}</div>
                                                            {activity.startTime && activity.endTime && (
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                                    {activity.startTime} - {activity.endTime}
                                                                </div>
                                                            )}
                                                            <div className="text-xs mt-1 font-medium inline-block px-2 py-0.5 rounded-full bg-white dark:bg-gray-800">
                                                                {activity.status === 'completed' && 'Terminé'}
                                                                {activity.status === 'inProgress' && 'En cours'}
                                                                {activity.status === 'delayed' && 'Retardé'}
                                                                {activity.status === 'cancelled' && 'Annulé'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right column */}
                                            <div className="space-y-4">
                                                {/* Weather conditions */}
                                                {report.weatherConditions && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Conditions météorologiques</h4>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                            <div className="flex items-center">
                                                                <CloudIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                                                                <span>{report.weatherConditions}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Health and safety */}
                                                {report.healthAndSafety && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Santé et sécurité</h4>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-sm">
                                                                    <span className="text-gray-500 dark:text-gray-400">Incidents: </span>
                                                                    <span className={report.healthAndSafety.incidents > 0 ? 'text-red-500 font-medium' : ''}>
                                                                        {report.healthAndSafety.incidents}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="text-gray-500 dark:text-gray-400">Quasi-accidents: </span>
                                                                    <span className={report.healthAndSafety.nearMisses > 0 ? 'text-amber-500 font-medium' : ''}>
                                                                        {report.healthAndSafety.nearMisses}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="text-gray-500 dark:text-gray-400">Réunion de sécurité: </span>
                                                                <span className={report.healthAndSafety.safetyMeetingHeld ? 'text-green-500 font-medium' : 'text-gray-500'}>
                                                                    {report.healthAndSafety.safetyMeetingHeld ? 'Oui' : 'Non'}
                                                                </span>
                                                            </div>
                                                            {report.healthAndSafety.notes && (
                                                                <div className="text-sm mt-2">
                                                                    <div className="text-gray-500 dark:text-gray-400">Notes:</div>
                                                                    <div className="mt-1">{report.healthAndSafety.notes}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Challenges and solutions */}
                                                {(report.challenges || report.solutions) && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Défis et solutions</h4>
                                                        <div className="space-y-3">
                                                            {report.challenges && (
                                                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                                                                    <div className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Défis:</div>
                                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{report.challenges}</div>
                                                                </div>
                                                            )}
                                                            {report.solutions && (
                                                                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                                                                    <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Solutions:</div>
                                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{report.solutions}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {report.notes && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Notes générales</h4>
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                            <div className="text-sm">{report.notes}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="mt-6 flex justify-end space-x-3">
                                            {report.status === 'draft' && (
                                                <button
                                                    onClick={() => handleSubmitReport(report._id)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center"
                                                >
                                                    <ArrowRightIcon className="h-4 w-4 mr-1" />
                                                    Soumettre
                                                </button>
                                            )}
                                            {report.status === 'submitted' && isManager && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveReport(report._id)}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm flex items-center"
                                                    >
                                                        <CheckIcon className="h-4 w-4 mr-1" />
                                                        Approuver
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(report._id)}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm flex items-center"
                                                    >
                                                        <XMarkIcon className="h-4 w-4 mr-1" />
                                                        Rejeter
                                                    </button>
                                                </>
                                            )}
                                            {canModifyReport(report) && (
                                                <button
                                                    onClick={() => handleEditReport(report)}
                                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-sm flex items-center"
                                                >
                                                    <PencilIcon className="h-4 w-4 mr-1" />
                                                    Modifier
                                                </button>
                                            )}
                                            <button
                                                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center"
                                            >
                                                <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                                                Dupliquer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', zIndex: 99999 }}>
                    <motion.div
                        key="reject-modal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Rejeter le rapport
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="mb-4">
                                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Motif du rejet
                                </label>
                                <textarea
                                    id="rejectionReason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                    rows={4}
                                    placeholder="Veuillez expliquer pourquoi vous rejetez ce rapport..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleRejectReport(rejectReportId || '')}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Confirmer le rejet
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* New Report Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', zIndex: 99999 }}>
                    <motion.div
                        key="new-report-modal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {editingReport ? 'Modifier le rapport' : 'Nouveau rapport journalier'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingReport(null);
                                    resetNewReportForm();
                                }}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="space-y-4">
                                {/* Date and Title */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            id="reportDate"
                                            value={newReport.date}
                                            onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Titre (optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            id="reportTitle"
                                            value={newReport.title}
                                            onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                                            placeholder="Laissez vide pour générer automatiquement"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                        />
                                    </div>
                                </div>

                                {/* Activities */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Activités *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addActivity}
                                            className="text-sm text-[#F28C38] hover:text-[#E67E2E] font-medium flex items-center"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-1" />
                                            Ajouter une activité
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {newReport.activities.map((activity, index) => (
                                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <div className="flex justify-between mb-2">
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Activité {index + 1}
                                                    </h4>
                                                    {newReport.activities.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeActivity(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XMarkIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Description *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={activity.description}
                                                            onChange={(e) => updateActivity(index, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                            placeholder="Ex: Forage du puits principal"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                Heure de début
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={activity.startTime}
                                                                onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                Heure de fin
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={activity.endTime}
                                                                onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            Statut
                                                        </label>
                                                        <select
                                                            value={activity.status}
                                                            onChange={(e) => updateActivity(index, 'status', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                        >
                                                            <option value="completed">Terminé</option>
                                                            <option value="inProgress">En cours</option>
                                                            <option value="delayed">Retardé</option>
                                                            <option value="cancelled">Annulé</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Weather Conditions */}
                                <div>
                                    <label htmlFor="weatherConditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Conditions météorologiques
                                    </label>
                                    <input
                                        type="text"
                                        id="weatherConditions"
                                        value={newReport.weatherConditions}
                                        onChange={(e) => setNewReport({ ...newReport, weatherConditions: e.target.value })}
                                        placeholder="Ex: Ensoleillé, 32°C"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                    />
                                </div>

                                {/* Health and Safety */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Santé et sécurité</h4>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    Incidents
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={newReport.healthAndSafety.incidents}
                                                    onChange={(e) => setNewReport({
                                                        ...newReport,
                                                        healthAndSafety: {
                                                            ...newReport.healthAndSafety,
                                                            incidents: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    Quasi-accidents
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={newReport.healthAndSafety.nearMisses}
                                                    onChange={(e) => setNewReport({
                                                        ...newReport,
                                                        healthAndSafety: {
                                                            ...newReport.healthAndSafety,
                                                            nearMisses: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="safetyMeeting"
                                                checked={newReport.healthAndSafety.safetyMeetingHeld}
                                                onChange={(e) => setNewReport({
                                                    ...newReport,
                                                    healthAndSafety: {
                                                        ...newReport.healthAndSafety,
                                                        safetyMeetingHeld: e.target.checked
                                                    }
                                                })}
                                                className="h-4 w-4 text-[#F28C38] focus:ring-[#F28C38] border-gray-300 rounded"
                                            />
                                            <label htmlFor="safetyMeeting" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                Réunion de sécurité tenue
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                Notes de sécurité
                                            </label>
                                            <textarea
                                                value={newReport.healthAndSafety.notes}
                                                onChange={(e) => setNewReport({
                                                    ...newReport,
                                                    healthAndSafety: {
                                                        ...newReport.healthAndSafety,
                                                        notes: e.target.value
                                                    }
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                                placeholder="Détails sur les incidents ou mesures de sécurité"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Challenges and Solutions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Défis rencontrés
                                        </label>
                                        <textarea
                                            id="challenges"
                                            value={newReport.challenges}
                                            onChange={(e) => setNewReport({ ...newReport, challenges: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                            placeholder="Décrivez les défis rencontrés aujourd'hui"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="solutions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Solutions appliquées
                                        </label>
                                        <textarea
                                            id="solutions"
                                            value={newReport.solutions}
                                            onChange={(e) => setNewReport({ ...newReport, solutions: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-[#F28C38] focus:border-[#F28C38]"
                                            placeholder="Décrivez les solutions mises en place"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingReport(null);
                                        resetNewReportForm();
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateReport}
                                    className="px-4 py-2 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors"
                                >
                                    {editingReport ? 'Mettre à jour' : 'Créer le rapport'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OperationDailyReport; 