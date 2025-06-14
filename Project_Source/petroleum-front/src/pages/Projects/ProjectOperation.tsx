import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AppDispatch, RootState } from '../../store';
import { fetchProjectById, updateProjectStatus } from '../../store/slices/projectSlice';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { toast } from 'react-hot-toast';
import {
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    WrenchScrewdriverIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import OperationHeader from '../../components/operation/OperationHeader';
import OperationEquipment from '../../components/operation/OperationEquipment';
import OperationEmployees from '../../components/operation/OperationEmployees';
import Budget from '../../components/budget/Budget';
import OperationShifts from '../../components/operation/OperationShifts';
import OperationDailyReport from '../../components/operation/OperationDailyReport';
import OperationProgress from '../../components/operation/OperationProgress';

// Define types for project resources
interface Equipment {
    _id: string;
    name: string;
    type: string;
    serialNumber?: string;
    status: 'available' | 'inUse' | 'maintenance' | 'reserved';
    location?: string;
    maintenanceDate?: string;
    image?: string;
    description?: string;
    assignedTo?: string;
}

interface Employee {
    _id: string;
    name: string;
    role: string;
    specialization: string;
    phone: string;
    email: string;
    photo?: string;
    status: 'active' | 'onLeave' | 'pending';
    shift?: 'day' | 'night';
    shiftStart?: string;
    shiftEnd?: string;
    position?: string;
    experience: number;
    certifications?: string[];
}

interface Budget {
    _id: string;
    category: string;
    amount: number;
    spent: number;
    remaining: number;
    description?: string;
    status: 'on-track' | 'over-budget' | 'under-budget';
}

interface BudgetCategory {
    id: string;
    name: string;
    planned: number;
    actual: number;
    remaining: number;
    percent: number;
}

interface Milestone {
    id: string;
    name: string;
    description: string;
    plannedDate: string;
    actualDate?: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    tasks: MilestoneTask[];
}

interface MilestoneTask {
    id: string;
    name: string;
    status: 'completed' | 'in-progress' | 'planned' | 'delayed';
    completionPercentage: number;
    startDate: string;
    endDate: string;
    dependsOn?: string[];
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const ProjectOperation: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedProject, loading, error } = useSelector((state: RootState) => state.projects);
    const [activeTab, setActiveTab] = useState<string>('progress');
    const [loadingProjectData, setLoadingProjectData] = useState(true);

    // State for project resources
    const [projectEquipment, setProjectEquipment] = useState<Equipment[]>([]);
    const [projectEmployees, setProjectEmployees] = useState<Employee[]>([]);
    const [projectBudget, setProjectBudget] = useState<Budget[]>([]);
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
    const [isLoadingResources, setIsLoadingResources] = useState(true);

    useEffect(() => {
        if (id) {
            dispatch(fetchProjectById(id))
                .unwrap()
                .catch((err) => {
                    toast.error('Erreur lors du chargement du projet');
                    console.error('Error fetching project:', err);
                })
                .finally(() => {
                    setLoadingProjectData(false);
                });
        }
    }, [dispatch, id]);

    // Auto-update project status if it's clôturé and start date has arrived
    useEffect(() => {
        if (selectedProject && selectedProject.status === 'Clôturé') {
            const startDate = new Date(selectedProject.startDate);
            const today = new Date();

            // Reset hours to compare just dates
            startDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (startDate <= today) {
                // The project should now be 'En opération'
                toast.success(`Le projet ${selectedProject.name} est maintenant en opération`);

                // Update the project status
                dispatch(updateProjectStatus({
                    id: selectedProject._id,
                    status: 'En opération',
                    statusNote: 'Passage automatique en phase opérationnelle après clôture de la phase de préparation.'
                }));
            }
        }
    }, [selectedProject, dispatch]);

    // Load project resources (equipment, employees, budget) when project is loaded
    useEffect(() => {
        if (selectedProject && !loadingProjectData) {
            setIsLoadingResources(true);

            // In a real implementation, these would be API calls
            // For now, we'll simulate loading with setTimeout
            setTimeout(() => {
                // Mock data for equipment, employees, and budget
                const mockEquipment: Equipment[] = [
                    {
                        _id: 'eq1',
                        name: 'Foreuse FD-3000',
                        type: 'Forage',
                        serialNumber: 'FD3000-123456',
                        status: 'inUse',
                        location: 'Site A',
                        maintenanceDate: '2023-12-15',
                        description: 'Foreuse à haute performance pour puits profonds'
                    },
                    {
                        _id: 'eq2',
                        name: 'Pompe P-500',
                        type: 'Pompage',
                        serialNumber: 'P500-789012',
                        status: 'available',
                        location: 'Entrepôt',
                        maintenanceDate: '2023-11-20',
                        description: 'Pompe industrielle pour extraction de fluides'
                    }
                ];

                const mockEmployees: Employee[] = [
                    {
                        _id: 'emp1',
                        name: 'Ahmed Benali',
                        role: 'Opérateur de forage',
                        specialization: 'Forage profond',
                        phone: '+213555123456',
                        email: 'ahmed.benali@example.com',
                        status: 'active',
                        shift: 'day',
                        shiftStart: '08:00',
                        shiftEnd: '20:00',
                        position: 'Chef d\'équipe',
                        experience: 8,
                        certifications: ['IWCF', 'H2S Safety']
                    },
                    {
                        _id: 'emp2',
                        name: 'Mohammed Rafi',
                        role: 'Technicien de maintenance',
                        specialization: 'Équipements hydrauliques',
                        phone: '+213555789012',
                        email: 'mohammed.rafi@example.com',
                        status: 'active',
                        shift: 'night',
                        shiftStart: '20:00',
                        shiftEnd: '08:00',
                        experience: 5,
                        certifications: ['Hydraulic Systems', 'Mechanical Engineering']
                    }
                ];

                const mockBudget: Budget[] = [
                    {
                        _id: 'budget1',
                        category: 'Équipement',
                        amount: 120000,
                        spent: 80000,
                        remaining: 40000,
                        status: 'on-track',
                        description: 'Budget pour l\'achat et la location d\'équipements'
                    },
                    {
                        _id: 'budget2',
                        category: 'Personnel',
                        amount: 85000,
                        spent: 40000,
                        remaining: 45000,
                        status: 'under-budget',
                        description: 'Salaires et indemnités du personnel'
                    }
                ];

                // Convert Budget to BudgetCategory for OperationBudget
                const budgetCategories: BudgetCategory[] = mockBudget.map(budget => ({
                    id: budget._id,
                    name: budget.category,
                    planned: budget.amount,
                    actual: budget.spent,
                    remaining: budget.remaining,
                    percent: budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
                }));

                setProjectEquipment(mockEquipment);
                setProjectEmployees(mockEmployees);
                setProjectBudget(mockBudget);
                setBudgetCategories(budgetCategories);
                setIsLoadingResources(false);
            }, 1000);
        }
    }, [selectedProject, loadingProjectData]);

    if (loadingProjectData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-[#F28C38] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (error || !selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Projet non trouvé
                    </h2>
                    <button
                        onClick={() => navigate('/projects/operation')}
                        className="px-6 py-3 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-lg hover:shadow-xl"
                    >
                        Retour à la liste
                    </button>
                </motion.div>
            </div>
        );
    }

    // Check if project is clôturé (ready for operation) or already in operation
    if (selectedProject.status !== 'Clôturé' && selectedProject.status !== 'En opération') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center max-w-lg"
                >
                    <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                        <ClockIcon className="h-12 w-12 text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Projet non prêt pour opération
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Ce projet n'a pas encore le statut 'Clôturé' ou 'En opération'. Il doit être clôturé en phase de préparation avant de pouvoir passer en opération.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate(`/projects/${id}`)}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-lg hover:shadow-xl flex items-center"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Détails du projet
                        </button>
                        <button
                            onClick={() => navigate('/projects/operation')}
                            className="px-6 py-3 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-lg hover:shadow-xl"
                        >
                            Liste des projets
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Check if project has a future start date
    const isUpcomingProject = () => {
        if (!selectedProject.startDate) return false;
        const startDate = new Date(selectedProject.startDate);
        const today = new Date();
        startDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return startDate > today;
    };

    // Format a date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Non définie';
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'Date invalide';
        }
    };

    const tabs = [
        { id: 'progress', label: 'Progression', icon: <ChartBarIcon className="h-5 w-5" /> },
        { id: 'budget', label: 'Budget', icon: <CurrencyDollarIcon className="h-5 w-5" /> },
        { id: 'reports', label: 'Rapports', icon: <DocumentTextIcon className="h-5 w-5" /> },
        { id: 'shifts', label: 'Planification', icon: <CalendarIcon className="h-5 w-5" /> },
        { id: 'employees', label: 'Personnel', icon: <UserGroupIcon className="h-5 w-5" /> },
        { id: 'equipment', label: 'Équipements', icon: <WrenchScrewdriverIcon className="h-5 w-5" /> },
    ];

    const renderContent = () => {
        if (!id) return null;

        if (isLoadingResources) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38] mb-4"></div>
                        <p className="text-gray-500">Chargement des ressources du projet...</p>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'progress':
                return <OperationProgress projectId={id} />;
            case 'budget':
                return <Budget projectId={id} />;
            case 'reports':
                return <OperationDailyReport projectId={id} />;
            case 'employees':
                return <OperationEmployees projectId={id} initialEmployees={projectEmployees} />;
            case 'equipment':
                return <OperationEquipment projectId={id} initialEquipment={projectEquipment} />;
            case 'shifts':
                return <OperationShifts projectId={id} />;
            default:
                return <OperationProgress projectId={id} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageMeta
                title={`Opération | ${selectedProject.name}`}
                description="Gestion des opérations du projet pétrolier"
            />
            <PageBreadcrumb pageTitle="Opération du Projet" />

            {/* Project Start Date Notice */}
            {isUpcomingProject() && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Projet à venir</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>Ce projet débutera le {formatDate(selectedProject.startDate)}. Lorsque cette date arrivera, le projet passera automatiquement en phase d'opération.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Header with KPIs */}
            <OperationHeader
                project={selectedProject}
                equipmentStats={{
                    total: projectEquipment.length,
                    active: projectEquipment.filter(eq => eq.status === 'inUse').length,
                    pending: projectEquipment.filter(eq => eq.status === 'reserved' || eq.status === 'maintenance').length
                }}
                personnelStats={{
                    total: projectEmployees.length,
                    day: projectEmployees.filter(emp => emp.shift === 'day').length,
                    night: projectEmployees.filter(emp => emp.shift === 'night').length
                }}
                budgetStats={{
                    percentage: budgetCategories.length > 0
                        ? budgetCategories.reduce((sum, cat) => sum + cat.actual, 0) / budgetCategories.reduce((sum, cat) => sum + cat.planned, 0) * 100
                        : 42.8,
                    used: budgetCategories.length > 0
                        ? budgetCategories.reduce((sum, cat) => sum + cat.actual, 0)
                        : 128450,
                    total: budgetCategories.length > 0
                        ? budgetCategories.reduce((sum, cat) => sum + cat.planned, 0)
                        : 300000
                }}
                progressPercentage={68} // This could be calculated based on milestones or tasks if available
            />

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'border-b-2 border-[#F28C38] text-[#F28C38] dark:text-[#F28C38]'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8 pb-16">
                <motion.div
                    key={activeTab}
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
    );
};

export default ProjectOperation; 