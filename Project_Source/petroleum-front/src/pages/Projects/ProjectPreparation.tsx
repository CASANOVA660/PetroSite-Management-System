import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MagnifyingGlassIcon, PlusIcon, ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import ProjectTable from '../../components/projects/ProjectTable';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { fetchProjects, deleteProject } from '../../store/slices/projectSlice';
import { RootState, AppDispatch } from '../../store';
import Button from '../../components/ui/button/Button';
import { toast } from 'react-hot-toast';
import { Modal } from '../../components/ui/modal';

interface ProjectPreparationProps {
    operationView?: boolean;
}

const ProjectPreparation: React.FC<ProjectPreparationProps> = ({ operationView = false }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { projects, loading, error } = useSelector((state: RootState) => state.projects);
    const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    console.log('ProjectPreparation projects state:', projects);

    useEffect(() => {
        console.log('Fetching projects...');
        dispatch(fetchProjects());
    }, [dispatch]);

    // Filter projects based on whether we're in operation view or preparation view
    useEffect(() => {
        if (projects && projects.length > 0) {
            if (operationView) {
                // For operation view, show projects with 'Clôturé' or 'En opération' status
                setFilteredProjects(projects.filter(p => p.status === 'Clôturé' || p.status === 'En opération'));
            } else {
                // For preparation view, show all projects regardless of status
                setFilteredProjects(projects);
            }
        } else {
            setFilteredProjects([]);
        }
    }, [projects, operationView]);

    const handleViewProject = (id: string) => {
        navigate(operationView ? `/projects/${id}/operation` : `/projects/${id}`);
    };

    const handleSearch = () => {
        navigate('/projects/search');
    };

    const handleAddProject = () => {
        navigate('/projects/add');
    };

    const handleDeleteClick = (id: string) => {
        // Find the project to get its name
        const project = projects.find(p => p._id === id);
        if (project && project.status === 'En opération') {
            toast.error('Impossible de supprimer un projet en opération');
            return;
        }

        setProjectToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            await dispatch(deleteProject(projectToDelete)).unwrap();
            setDeleteModalOpen(false);
            setProjectToDelete(null);
        } catch (error: any) {
            console.error('Error deleting project:', error);
            toast.error(typeof error === 'string' ? error : 'Erreur lors de la suppression du projet');
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setProjectToDelete(null);
    };

    const getStats = () => {
        const total = filteredProjects.length;
        const inProgress = filteredProjects.filter(p => p.status === 'En cours').length;
        const completed = filteredProjects.filter(p => p.status === 'Clôturé').length;
        const cancelled = filteredProjects.filter(p => p.status === 'Annulé').length;
        const pending = filteredProjects.filter(p => p.status === 'En attente').length;

        return { total, inProgress, completed, cancelled, pending };
    };

    const stats = getStats();

    const pageTitle = operationView ? "Opérations des Projets" : "Préparation des Projets";
    const tableTitle = operationView ? "Projets Prêts pour Opération" : "Liste des Projets";

    // Check if there are upcoming projects that haven't started yet
    const upcomingProjects = operationView ? filteredProjects.filter(p => {
        const startDate = new Date(p.startDate);
        const today = new Date();
        return startDate > today;
    }) : [];

    return (
        <>
            <PageMeta
                title={`${pageTitle} | PetroConnect`}
                description="Gérez vos projets pétroliers avec PetroConnect"
            />
            <PageBreadcrumb pageTitle={pageTitle} />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={cancelDelete}
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirmer la suppression</h2>
                    <p className="mb-6 text-gray-700 dark:text-gray-300">
                        Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={cancelDelete}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6">
                {/* Header with Action Buttons */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {pageTitle}
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSearch}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] transition-all duration-200"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                            Rechercher
                        </button>
                        {!operationView && (
                            <Button
                                onClick={handleAddProject}
                                className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all duration-200"
                            >
                                <PlusIcon className="h-5 w-5" />
                                <span>Ajouter un projet</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Upcoming Projects Notice */}
                {operationView && upcomingProjects.length > 0 && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Projets à venir</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {upcomingProjects.map(project => (
                                            <li key={project._id}>
                                                {project.name} - Commence le {new Date(project.startDate).toLocaleDateString()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projets</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>

                    {operationView ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prêts pour Opération</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Annulés</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.cancelled}</p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Table */}
                <ComponentCard title={tableTitle} className="shadow-lg">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-64 text-red-500">
                            {error}
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {operationView
                                    ? "Aucun projet prêt pour opération"
                                    : "Aucun projet en préparation"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-2">
                                {operationView
                                    ? "Il n'y a actuellement aucun projet avec le statut 'Clôturé'"
                                    : "Commencez par ajouter un nouveau projet"}
                            </p>
                            {!operationView && (
                                <Button
                                    onClick={handleAddProject}
                                    className="mt-4 bg-orange-600 hover:bg-orange-700"
                                >
                                    Ajouter un projet
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ProjectTable
                            projects={filteredProjects}
                            onViewProject={handleViewProject}
                            onDeleteProject={!operationView ? handleDeleteClick : undefined}
                            isOperationView={operationView}
                        />
                    )}
                </ComponentCard>
            </div>
        </>
    );
};

export default ProjectPreparation; 