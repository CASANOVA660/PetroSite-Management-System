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
import { ChevronDownIcon, ChevronUpIcon, DocumentIcon, FolderIcon, UserGroupIcon, ShieldCheckIcon, CalendarIcon, ClipboardDocumentListIcon, ClockIcon, ChartBarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { clearProjectActions } from '../../store/slices/actionSlice';


interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-[#F28C38] rounded-lg overflow-hidden">
            <div
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-3">
                    {icon}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                </div>
                {isOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
            </div>
            {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-800">
                    {children}
                </div>
            )}
        </div>
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
            </div>
        );
    }

    if (error || !selectedProject) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Projet non trouvé
                </h2>
                <button
                    onClick={() => navigate('/projects/preparation')}
                    className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title={`Détails du Projet | ${selectedProject.name}`}
                description="Détails du projet pétrolier"
            />
            <PageBreadcrumb pageTitle="Détails du Projet" />

            <div className="space-y-6">
                {/* Project Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {selectedProject.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {selectedProject.projectNumber}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate(`/projects/${id}/edit`)}
                                className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]"
                            >
                                Modifier
                            </button>
                            <button
                                onClick={() => navigate('/projects/preparation')}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProject.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date de début</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(selectedProject.startDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedProject.status === 'En cours' ? 'bg-green-100 text-green-800' :
                                selectedProject.status === 'Fermé' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {selectedProject.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Project Sections */}
                <div className="space-y-6">
                    {id && (
                        <>
                            <Section title="Documents" icon={<DocumentIcon className="h-6 w-6 text-[#F28C38]" />}>
                                <DocumentsGlobale projectId={id} />
                                <div className="mt-4">
                                    <Actions projectId={id} category="Documents globale" users={users} />
                                </div>
                            </Section>

                            <Section title="Dossier Administratif" icon={<FolderIcon className="h-6 w-6 text-[#F28C38]" />}>
                                <DossierAdministratif projectId={id} />
                                <div className="mt-4">
                                    <Actions projectId={id} category="Dossier Administratif" users={users} />
                                </div>
                            </Section>

                            <Section title="Dossier Technique" icon={<WrenchScrewdriverIcon className="h-6 w-6 text-[#F28C38]" />}>
                                <DossierTechnique projectId={id} />
                                <div className="mt-4">
                                    <Actions projectId={id} category="Dossier Technique" users={users} />
                                </div>
                            </Section>

                            <Section title="Dossier RH" icon={<UserGroupIcon className="h-6 w-6 text-[#F28C38]" />}>
                                <DossierRH projectId={id} />
                                <div className="mt-4">
                                    <Actions projectId={id} category="Dossier RH" users={users} />
                                </div>
                            </Section>

                            <Section title="Dossier HSE" icon={<ShieldCheckIcon className="h-6 w-6 text-[#F28C38]" />}>
                                <DossierHSE projectId={id} />
                                <div className="mt-4">
                                    <Actions projectId={id} category="Dossier HSE" users={users} />
                                </div>
                            </Section>
                        </>
                    )}

                    <Section title="Planning" icon={<CalendarIcon className="h-6 w-6 text-[#F28C38]" />}>
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

                    <Section title="Exigences" icon={<ClipboardDocumentListIcon className="h-6 w-6 text-[#F28C38]" />}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Exigences réglementaires
                                    </label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]" rows={3} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Exigences PIP
                                    </label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]" rows={3} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Exigences client indirectes
                                    </label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]" rows={3} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Normes techniques applicables
                                    </label>
                                    <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]" rows={3} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]">
                                    Ouvrir une Action
                                </button>
                            </div>
                        </div>
                    </Section>

                    <Section title="Traçabilité" icon={<ClockIcon className="h-6 w-6 text-[#F28C38]" />}>
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Faisabilité
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                Ajout d'un document
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                03/10/2025
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Oui
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end">
                                <button className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]">
                                    Ouvrir une Action
                                </button>
                            </div>
                        </div>
                    </Section>

                    <Section title="Statut du Projet" icon={<ChartBarIcon className="h-6 w-6 text-[#F28C38]" />}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Statut
                                </label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]">
                                    <option value="En cours">En cours</option>
                                    <option value="Clôturé">Clôturé</option>
                                    <option value="Annulé">Annulé</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Note
                                </label>
                                <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F28C38] focus:ring-[#F28C38]" rows={3} />
                            </div>
                            <div className="flex justify-end">
                                <button className="px-4 py-2 bg-[#F28C38] text-white rounded-md hover:bg-[#E67E2E]">
                                    Mettre à jour
                                </button>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </>
    );
};

export default ProjectDetails;