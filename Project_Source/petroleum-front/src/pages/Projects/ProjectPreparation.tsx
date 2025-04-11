import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
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
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F28C38]"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                            Rechercher
                        </button>
                        <Button
                            onClick={handleAddProject}
                            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Ajouter un projet</span>
                        </Button>
                    </div>
                </div>

                {/* Projects Table */}
                <ComponentCard title="Liste des Projets">
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