import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { EyeIcon, ArrowRightCircleIcon, TrashIcon } from "@heroicons/react/24/solid";

interface Project {
    _id: string;
    projectNumber: string;
    name: string;
    clientName: string;
    createdAt: string;
    startDate: string;
    endDate: string;
    status: 'En cours' | 'Clôturé' | 'Annulé' | 'En attente' | 'En opération';
    budget?: number;
    location?: string;
}

interface ProjectTableProps {
    projects: Project[];
    onViewProject: (id: string) => void;
    onDeleteProject?: (id: string) => void;
    isOperationView?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects = [], onViewProject, onDeleteProject, isOperationView = false }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date non définie';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Date invalide';
            }
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date invalide';
        }
    };

    const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
        switch (status) {
            case 'En cours':
                return 'success';
            case 'Clôturé':
                return 'info';
            case 'En opération':
                return 'info';
            case 'Annulé':
                return 'error';
            case 'En attente':
                return 'warning';
            default:
                return 'warning';
        }
    };

    // Calculate remaining days for projects in operation view
    const calculateRemainingDays = (endDate: string) => {
        if (!endDate) return { days: 0, isOverdue: false };

        const end = new Date(endDate);
        const today = new Date();

        // Clear time portion for accurate day calculation
        end.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { days: diffDays, isOverdue: diffDays < 0 };
    };

    // Add a function to determine row styling based on project status
    const getRowStyle = (status: string, isOperationView: boolean): string => {
        return 'hover:bg-gray-50 dark:hover:bg-gray-900/50';
    };

    // Add a helper function to check if a project is in the future
    const isProjectFuture = (project: any): boolean => {
        if (!project.startDate) return false;
        const startDate = new Date(project.startDate);
        const today = new Date();

        // Reset hours to compare just dates
        startDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return startDate > today;
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                    <Table>
                        <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Numéro Projet
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Nom
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Client
                                </TableCell>
                                {isOperationView ? (
                                    <>
                                        <TableCell
                                            isHeader
                                            className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                        >
                                            Date de début
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                        >
                                            Date de fin
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                        >
                                            Jours restants
                                        </TableCell>
                                    </>
                                ) : (
                                    <TableCell
                                        isHeader
                                        className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                    >
                                        Date de Création
                                    </TableCell>
                                )}
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Statut
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isOperationView ? 8 : 6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p className="text-lg">Aucun projet trouvé</p>
                                            <p className="text-sm text-gray-400">
                                                {isOperationView
                                                    ? "Il n'y a actuellement aucun projet en opération"
                                                    : "Cliquez sur 'Ajouter Projet' pour commencer"}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => {
                                    const remaining = isOperationView ? calculateRemainingDays(project.endDate) : null;

                                    return (
                                        <TableRow
                                            key={project._id}
                                            className={`transition-colors duration-200 ${getRowStyle(project.status, isOperationView)}`}
                                        >
                                            <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">{project.projectNumber}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {project.name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {project.clientName}
                                            </TableCell>
                                            {isOperationView ? (
                                                <>
                                                    <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                        {formatDate(project.startDate)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                        {formatDate(project.endDate)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        {remaining && (
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${remaining.isOverdue
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                : remaining.days <= 7
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                }`}>
                                                                {remaining.isOverdue
                                                                    ? `Dépassé de ${Math.abs(remaining.days)} jours`
                                                                    : `${remaining.days} jours`}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                    {formatDate(project.createdAt)}
                                                </TableCell>
                                            )}
                                            <TableCell className="px-6 py-4">
                                                <Badge size="sm" color={getStatusColor(project.status)}>
                                                    {project.status}
                                                    {project.status === 'Clôturé' && isOperationView && isProjectFuture(project) && " (À venir)"}
                                                    {project.status === 'Clôturé' && isOperationView && !isProjectFuture(project) && " (Actif)"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onViewProject(project._id)}
                                                        className="p-2 text-gray-500 hover:text-[#F28C38] transition-colors rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                        title="Voir les détails"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>

                                                    {!isOperationView && project.status === 'En attente' && (
                                                        <button
                                                            className="p-2 text-gray-500 hover:text-green-600 transition-colors rounded-full hover:bg-green-50 dark:hover:bg-green-900/20"
                                                            title="Démarrer le projet"
                                                        >
                                                            <ArrowRightCircleIcon className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {!isOperationView && project.status !== 'En opération' && onDeleteProject && (
                                                        <button
                                                            onClick={() => onDeleteProject(project._id)}
                                                            className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Supprimer le projet"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default ProjectTable; 