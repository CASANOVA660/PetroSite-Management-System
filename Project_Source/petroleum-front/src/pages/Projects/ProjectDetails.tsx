import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { AppDispatch, RootState } from '../../store';
import { fetchProjectById } from '../../store/slices/projectSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { toast } from 'react-toastify';
import DocumentsGlobale from '../../components/documents/DocumentsGlobale';
import DossierAdministratif from '../../components/documents/DossierAdministratif';
import DossierTechnique from '../../components/documents/DossierTechnique';
import DossierRH from '../../components/documents/DossierRH';
import DossierHSE from '../../components/documents/DossierHSE';
import Actions from '../../components/actions/Actions';
import KpiConfiguration from '../../components/documents/configkpi/KpiConfiguration';
import Budget from '../../components/budget/Budget';
import ProjectRequirements from '../../components/requirements/ProjectRequirements';
import ProjectStatus from '../../components/projects/ProjectStatus';
import { generateProjectPDF } from '../../utils/pdfUtils';
import axios from 'axios';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    DocumentIcon,
    FolderIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    CalendarIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ChartBarIcon,
    WrenchScrewdriverIcon,
    PencilIcon,
    ArrowLeftIcon,
    CurrencyDollarIcon,
    TrashIcon,
    DocumentTextIcon,
    BeakerIcon,
    LightBulbIcon,
    LockClosedIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { clearProjectActions } from '../../store/slices/actionSlice';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectPlanning from '../../components/planning/ProjectPlanning';

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    color: string;
    isLocked?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, color, isLocked = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
            <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${color}`}>
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    {isLocked && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <LockClosedIcon className="h-5 w-5 mr-1" />
                            <span className="text-sm">Lecture seule</span>
                        </div>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDownIcon className="h-6 w-6 text-gray-500" />
                </motion.div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, selectedProject } = useSelector((state: RootState) => state.projects);
    const { users } = useSelector((state: RootState) => state.users);
    const { user } = useSelector((state: RootState) => state.auth);
    const [exportingPdf, setExportingPdf] = useState(false);

    // Check user roles
    const isRespRH = user?.role === 'Resp. RH';
    const isChefDeBase = user?.role === 'Chef de base';

    useEffect(() => {
        if (id) {
            dispatch(clearProjectActions(id));
            dispatch(fetchProjectById(id))
                .unwrap()
                .catch((err) => {
                    toast.error('Erreur lors du chargement du projet');
                    console.error('Error fetching project:', err);
                });
            dispatch(fetchUsers());
        }

        return () => {
            dispatch(clearProjectActions(null));
        };
    }, [dispatch, id]);

    const handleExportPDF = async () => {
        if (!selectedProject) return;

        try {
            setExportingPdf(true);

            // Create an extended project object with all the data
            const extendedProject = {
                ...selectedProject,
                documents: [] as any[],
                employees: [] as any[]
            };

            console.log('Starting PDF export with project:', selectedProject._id);

            // Try to fetch documents from different dossiers
            try {
                // Try different API patterns for documents
                const documentEndpointPatterns = [
                    // Pattern 1: Direct document endpoints
                    {
                        global: `/documents/project/${id}`,
                        administratif: `/documents/project/${id}/administratif`,
                        technique: `/documents/project/${id}/technique`,
                        rh: `/documents/project/${id}/rh`,
                        hse: `/documents/project/${id}/hse`
                    },
                    // Pattern 2: Alternative structure
                    {
                        global: `/projects/${id}/documents`,
                        administratif: `/projects/${id}/documents/administratif`,
                        technique: `/projects/${id}/documents/technique`,
                        rh: `/projects/${id}/documents/rh`,
                        hse: `/projects/${id}/documents/hse`
                    },
                    // Pattern 3: Another alternative
                    {
                        global: `/api/documents/project/${id}`,
                        administratif: `/api/documents/project/${id}/administratif`,
                        technique: `/api/documents/project/${id}/technique`,
                        rh: `/api/documents/project/${id}/rh`,
                        hse: `/api/documents/project/${id}/hse`
                    }
                ];

                // Try each pattern until we get documents
                for (const pattern of documentEndpointPatterns) {
                    if (extendedProject.documents.length > 0) break; // Stop if we already have documents

                    console.log('Trying document endpoint pattern:', pattern.global);

                    // Try each dossier type in the current pattern
                    for (const [dossierType, endpoint] of Object.entries(pattern)) {
                        try {
                            console.log(`Fetching ${dossierType} documents from: ${endpoint}`);
                            const response = await axios.get(endpoint);

                            console.log(`${dossierType} documents response:`, response.data);

                            let docsData = [];
                            if (response.data?.data && Array.isArray(response.data.data)) {
                                docsData = response.data.data;
                            } else if (Array.isArray(response.data)) {
                                docsData = response.data;
                            } else if (response.data?.documents && Array.isArray(response.data.documents)) {
                                docsData = response.data.documents;
                            }

                            if (docsData.length > 0) {
                                const docsWithType = docsData.map((doc: any) => ({
                                    ...doc,
                                    dossierType
                                }));
                                extendedProject.documents.push(...docsWithType);
                                console.log(`Added ${docsWithType.length} ${dossierType} documents`);
                            }
                        } catch (error) {
                            console.log(`Error fetching ${dossierType} documents from ${endpoint}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.log('Error in document fetching process:', error);
            }

            // Try to fetch employees assigned to the project
            try {
                // Try different API patterns for employees
                const employeeEndpointPatterns = [
                    `/projects/${id}/employees`,
                    `/employees/project/${id}`,
                    `/api/projects/${id}/employees`,
                    `/api/employees/project/${id}`,
                    `/projectemployees/${id}`,
                    `/api/projectemployees/${id}`
                ];

                // Try each pattern until we get employees
                for (const endpoint of employeeEndpointPatterns) {
                    if (extendedProject.employees.length > 0) break; // Stop if we already have employees

                    try {
                        console.log(`Fetching employees from: ${endpoint}`);
                        const response = await axios.get(endpoint);

                        console.log('Employees response:', response.data);

                        let employeesData = [];
                        if (response.data?.data && Array.isArray(response.data.data)) {
                            employeesData = response.data.data;
                        } else if (Array.isArray(response.data)) {
                            employeesData = response.data;
                        } else if (response.data?.employees && Array.isArray(response.data.employees)) {
                            employeesData = response.data.employees;
                        }

                        if (employeesData.length > 0) {
                            extendedProject.employees = employeesData;
                            console.log(`Added ${employeesData.length} employees from ${endpoint}`);
                            break;
                        }
                    } catch (error) {
                        console.log(`Error fetching employees from ${endpoint}:`, error);
                    }
                }
            } catch (error) {
                console.log('Error in employee fetching process:', error);
            }

            // Last resort: If we still have no documents or employees, try to extract them from the project object itself
            if (extendedProject.documents.length === 0 && (selectedProject as any).documents) {
                console.log('Using documents from project object');
                extendedProject.documents = Array.isArray((selectedProject as any).documents)
                    ? (selectedProject as any).documents.map((doc: any) => ({ ...doc, dossierType: doc.dossierType || 'global' }))
                    : [];
            }

            if (extendedProject.employees.length === 0 && (selectedProject as any).employees) {
                console.log('Using employees from project object');
                extendedProject.employees = Array.isArray((selectedProject as any).employees) ? (selectedProject as any).employees : [];
            }

            // Add some mock data for testing if nothing was found
            if (extendedProject.documents.length === 0) {
                console.log('Adding mock document for testing');
                extendedProject.documents = [
                    { name: 'Document test', description: 'Document ajouté pour test', dossierType: 'global' }
                ];
            }

            if (extendedProject.employees.length === 0) {
                console.log('Adding mock employee for testing');
                extendedProject.employees = [
                    { name: 'Employé test', role: 'Testeur', email: 'test@example.com' }
                ];
            }

            console.log('Final PDF data:', {
                documentsCount: extendedProject.documents.length,
                employeesCount: extendedProject.employees.length,
                documents: extendedProject.documents,
                employees: extendedProject.employees
            });

            // Generate PDF with the extended project data
            await generateProjectPDF(extendedProject);
            toast.success('PDF généré avec succès');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erreur lors de la génération du PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    if (loading) {
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
                        onClick={() => navigate('/projects/preparation')}
                        className="px-6 py-3 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-lg hover:shadow-xl"
                    >
                        Retour à la liste
                    </button>
                </motion.div>
            </div>
        );
    }

    // For read-only sections
    const ReadOnlyView = ({ children }: { children: React.ReactNode }) => (
        <div className="opacity-80 pointer-events-none">
            {children}
        </div>
    );

    // Determine if a section should be locked based on user role
    const shouldLockSection = (sectionName: string) => {
        if (isRespRH) {
            return sectionName !== "Dossier RH";
        }
        if (isChefDeBase) {
            return sectionName !== "Dossier Technique";
        }
        return false;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <PageMeta
                title={`Détails du Projet | ${selectedProject.name}`}
                description="Détails du projet pétrolier"
            />
            <PageBreadcrumb pageTitle="Détails du Projet" />

            {/* Project Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-8"
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {selectedProject.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                {selectedProject.projectNumber}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleExportPDF}
                                disabled={exportingPdf}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportingPdf ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Génération...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                        <span>Exporter PDF</span>
                                    </>
                                )}
                            </button>
                            {!isRespRH && !isChefDeBase && (
                                <button
                                    onClick={() => navigate(`/projects/${id}/edit`)}
                                    className="px-6 py-3 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                    <span>Modifier</span>
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/projects/preparation')}
                                className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                                <span>Retour</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                {selectedProject.clientName}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date de début</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                {new Date(selectedProject.startDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${selectedProject.status === 'En cours' ? 'bg-green-100 text-green-800' :
                                selectedProject.status === 'Clôturé' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {selectedProject.status}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Project Sections */}
            <div className="max-w-7xl mx-auto space-y-6">
                {id && (
                    <>
                        <Section
                            title="Configuration des KPIs"
                            icon={<ChartBarIcon className="h-6 w-6 text-white" />}
                            color="bg-indigo-500"
                            isLocked={shouldLockSection("Configuration des KPIs")}
                        >
                            {shouldLockSection("Configuration des KPIs") ? (
                                <ReadOnlyView>
                                    <KpiConfiguration projectId={id} />
                                </ReadOnlyView>
                            ) : (
                                <KpiConfiguration projectId={id} />
                            )}
                        </Section>

                        <Section
                            title="Documents"
                            icon={<DocumentIcon className="h-6 w-6 text-white" />}
                            color="bg-blue-500"
                            isLocked={shouldLockSection("Documents")}
                        >
                            {shouldLockSection("Documents") ? (
                                <ReadOnlyView>
                                    <DocumentsGlobale projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Documents globale" users={users} />
                                </ReadOnlyView>
                            ) : (
                                <>
                                    <DocumentsGlobale projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Documents globale" users={users} />
                                </>
                            )}
                        </Section>

                        <Section
                            title="Dossier Administratif"
                            icon={<FolderIcon className="h-6 w-6 text-white" />}
                            color="bg-purple-500"
                            isLocked={shouldLockSection("Dossier Administratif")}
                        >
                            {shouldLockSection("Dossier Administratif") ? (
                                <ReadOnlyView>
                                    <DossierAdministratif projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier Administratif" users={users} />
                                </ReadOnlyView>
                            ) : (
                                <>
                                    <DossierAdministratif projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier Administratif" users={users} />
                                </>
                            )}
                        </Section>

                        <Section
                            title="Dossier Technique"
                            icon={<WrenchScrewdriverIcon className="h-6 w-6 text-white" />}
                            color="bg-green-500"
                            isLocked={shouldLockSection("Dossier Technique")}
                        >
                            {shouldLockSection("Dossier Technique") ? (
                                <ReadOnlyView>
                                    <DossierTechnique projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <WrenchScrewdriverIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier Technique" users={users} />
                                </ReadOnlyView>
                            ) : (
                                <>
                                    <DossierTechnique projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <WrenchScrewdriverIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier Technique" users={users} />
                                </>
                            )}
                        </Section>

                        <Section
                            title="Dossier RH"
                            icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                            color="bg-pink-500"
                            isLocked={shouldLockSection("Dossier RH")}
                        >
                            {shouldLockSection("Dossier RH") ? (
                                <ReadOnlyView>
                                    <DossierRH projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <UserGroupIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier RH" users={users} />
                                </ReadOnlyView>
                            ) : (
                                <>
                                    <DossierRH projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <UserGroupIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier RH" users={users} />
                                </>
                            )}
                        </Section>

                        <Section
                            title="Dossier HSE"
                            icon={<ShieldCheckIcon className="h-6 w-6 text-white" />}
                            color="bg-red-500"
                            isLocked={shouldLockSection("Dossier HSE")}
                        >
                            {shouldLockSection("Dossier HSE") ? (
                                <ReadOnlyView>
                                    <DossierHSE projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <ShieldCheckIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier HSE" users={users} />
                                </ReadOnlyView>
                            ) : (
                                <>
                                    <DossierHSE projectId={id} />
                                    <div className="flex items-center mb-4 mt-8">
                                        <ShieldCheckIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                                    </div>
                                    <Actions projectId={id} category="Dossier HSE" users={users} />
                                </>
                            )}
                        </Section>

                        <Section
                            title="Budget"
                            icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />}
                            color="bg-emerald-500"
                            isLocked={shouldLockSection("Budget")}
                        >
                            {shouldLockSection("Budget") ? (
                                <ReadOnlyView>
                                    <Budget projectId={id} />
                                </ReadOnlyView>
                            ) : (
                                <Budget projectId={id} />
                            )}
                        </Section>

                        <Section
                            title="Exigences"
                            icon={<ClipboardDocumentListIcon className="h-6 w-6 text-white" />}
                            color="bg-indigo-500"
                            isLocked={shouldLockSection("Exigences")}
                        >
                            {shouldLockSection("Exigences") ? (
                                <ReadOnlyView>
                                    <ProjectRequirements projectId={id} />
                                </ReadOnlyView>
                            ) : (
                                <ProjectRequirements projectId={id} />
                            )}
                        </Section>

                        <Section
                            title="Planification du Projet"
                            icon={<CalendarIcon className="h-6 w-6 text-white" />}
                            color="bg-blue-500"
                            isLocked={shouldLockSection("Planification du Projet")}
                        >
                            {shouldLockSection("Planification du Projet") ? (
                                <ReadOnlyView>
                                    {id && <ProjectPlanning projectId={id} />}
                                </ReadOnlyView>
                            ) : (
                                id && <ProjectPlanning projectId={id} />
                            )}
                        </Section>

                        <Section
                            title="Statut du Projet"
                            icon={<ClockIcon className="h-6 w-6 text-white" />}
                            color="bg-orange-500"
                            isLocked={shouldLockSection("Statut du Projet")}
                        >
                            {shouldLockSection("Statut du Projet") ? (
                                <ReadOnlyView>
                                    {id && <ProjectStatus projectId={id} />}
                                </ReadOnlyView>
                            ) : (
                                id && <ProjectStatus projectId={id} />
                            )}
                        </Section>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;