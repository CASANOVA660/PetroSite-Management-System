import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MagnifyingGlassIcon, PlusIcon, ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import ProjectTable from '../../components/projects/ProjectTable';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { fetchProjects } from '../../store/slices/projectSlice';
import { RootState, AppDispatch } from '../../store';
import Button from '../../components/ui/button/Button';

const ProjectPreparation: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { projects, loading, error } = useSelector((state: RootState) => state.projects);

    console.log('ProjectPreparation projects state:', projects);

    useEffect(() => {
        console.log('Fetching projects...');
        dispatch(fetchProjects());
    }, [dispatch]);

    const handleViewProject = (id: string) => {
        navigate(`/projects/${id}`);
    };

    const handleSearch = () => {
        navigate('/projects/search');
    };

    const handleAddProject = () => {
        navigate('/projects/add');
    };

    const getStats = () => {
        const total = projects.length;
        const inProgress = projects.filter(p => p.status === 'En cours').length;
        const completed = projects.filter(p => p.status === 'Fermé').length;
        const cancelled = projects.filter(p => p.status === 'Annulé').length;

        return { total, inProgress, completed, cancelled };
    };

    const stats = getStats();

    return (
        <>
            <PageMeta
                title="Préparation des Projets | PetroConnect"
                description="Gérez vos projets pétroliers avec PetroConnect"
            />
            <PageBreadcrumb pageTitle="Préparation des Projets" />

            <div className="space-y-6">
                {/* Header with Action Buttons */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Préparation des Projets
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleSearch}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38] transition-all duration-200"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                            Rechercher
                        </button>
                        <Button
                            onClick={handleAddProject}
                            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all duration-200"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Ajouter un projet</span>
                        </Button>
                    </div>
                </div>

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

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Cours</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.inProgress}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complétés</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

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
                <ComponentCard title="Liste des Projets" className="shadow-lg">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center h-64 text-red-500">
                            {error}
                        </div>
                    ) : (
                        <ProjectTable
                            projects={projects as any}
                            onViewProject={handleViewProject}
                        />
                    )}
                </ComponentCard>
            </div>
        </>
    );
};

export default ProjectPreparation; 