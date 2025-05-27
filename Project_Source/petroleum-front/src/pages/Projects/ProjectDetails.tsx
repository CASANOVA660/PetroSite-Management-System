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
    LightBulbIcon
} from '@heroicons/react/24/outline';
import { clearProjectActions } from '../../store/slices/actionSlice';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectPlanning from '../../components/planning/ProjectPlanning';

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    color: string;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, color }) => {
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
                                onClick={() => navigate(`/projects/${id}/edit`)}
                                className="px-6 py-3 bg-[#F28C38] text-white rounded-lg hover:bg-[#E67E2E] transition-colors shadow-lg hover:shadow-xl flex items-center space-x-2"
                            >
                                <PencilIcon className="h-5 w-5" />
                                <span>Modifier</span>
                            </button>
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
                                selectedProject.status === 'Fermé' ? 'bg-gray-100 text-gray-800' :
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
                        <Section title="Configuration des KPIs" icon={<ChartBarIcon className="h-6 w-6 text-white" />} color="bg-indigo-500">
                            <KpiConfiguration />
                        </Section>

                        <Section title="Documents" icon={<DocumentIcon className="h-6 w-6 text-white" />} color="bg-blue-500">
                            <DocumentsGlobale projectId={id} />
                            <div className="flex items-center mb-4 mt-8">
                                <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                            </div>
                            <Actions projectId={id} category="Documents globale" users={users} />
                        </Section>

                        <Section title="Dossier Administratif" icon={<FolderIcon className="h-6 w-6 text-white" />} color="bg-purple-500">
                            <DossierAdministratif projectId={id} />
                            <div className="flex items-center mb-4 mt-8">
                                <FolderIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                            </div>
                            <Actions projectId={id} category="Dossier Administratif" users={users} />
                        </Section>

                        <Section title="Dossier Technique" icon={<WrenchScrewdriverIcon className="h-6 w-6 text-white" />} color="bg-green-500">
                            <DossierTechnique projectId={id} />
                            <div className="flex items-center mb-4 mt-8">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                            </div>
                            <Actions projectId={id} category="Dossier Technique" users={users} />
                        </Section>

                        <Section title="Dossier RH" icon={<UserGroupIcon className="h-6 w-6 text-white" />} color="bg-pink-500">
                            <DossierRH projectId={id} />
                            <div className="flex items-center mb-4 mt-8">
                                <UserGroupIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                            </div>
                            <Actions projectId={id} category="Dossier RH" users={users} />
                        </Section>

                        <Section title="Dossier HSE" icon={<ShieldCheckIcon className="h-6 w-6 text-white" />} color="bg-red-500">
                            <DossierHSE projectId={id} />
                            <div className="flex items-center mb-4 mt-8">
                                <ShieldCheckIcon className="h-6 w-6 text-[#F28C38] mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h4>
                            </div>
                            <Actions projectId={id} category="Dossier HSE" users={users} />
                        </Section>

                        <Section title="Budget" icon={<CurrencyDollarIcon className="h-6 w-6 text-white" />} color="bg-emerald-500">
                            <Budget projectId={id} />
                        </Section>

                        <Section title="Exigences" icon={<ClipboardDocumentListIcon className="h-6 w-6 text-white" />} color="bg-indigo-500">
                            <ProjectRequirements projectId={id} />
                        </Section>
                    </>
                )}

                <Section title="Planning" icon={<CalendarIcon className="h-6 w-6 text-white" />} color="bg-yellow-500">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <select className="rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]">
                                    <option>À faire</option>
                                    <option>En cours</option>
                                    <option>Terminé</option>
                                    <option>Validé</option>
                                </select>
                                <button className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]">
                                    Mettre à jour
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]">
                                Ouvrir une Action
                            </button>
                        </div>
                    </div>
                </Section>

                <Section title="Planification du Projet" icon={<CalendarIcon className="h-6 w-6 text-white" />} color="bg-blue-500">
                    {id && <ProjectPlanning projectId={id} />}
                </Section>
            </div>
        </div>
    );
};

export default ProjectDetails;