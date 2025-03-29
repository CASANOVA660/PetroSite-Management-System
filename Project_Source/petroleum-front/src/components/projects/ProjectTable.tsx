import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { EyeIcon } from "@heroicons/react/24/solid";

interface Project {
    _id: string;
    projectNumber: string;
    clientName: string;
    createdAt: string;
    status: 'En cours' | 'Fermé' | 'Annulé';
}

interface ProjectTableProps {
    projects: Project[];
    onViewProject: (id: string) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects = [], onViewProject }) => {
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

    const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
        switch (status) {
            case 'En cours':
                return 'warning';
            case 'Fermé':
                return 'success';
            case 'Annulé':
                return 'error';
            default:
                return 'error';
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1102px]">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Numéro Projet
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Client
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Date de Création
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Statut
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-4 text-center text-gray-500">
                                        Aucun projet trouvé. Cliquez sur 'Ajouter Projet' pour commencer.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project._id}>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {project.projectNumber}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {project.clientName}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {formatDate(project.createdAt)}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            <Badge size="sm" color={getStatusColor(project.status)}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <button
                                                onClick={() => onViewProject(project._id)}
                                                className="text-gray-500 hover:text-[#F28C38] transition-colors"
                                                title="Voir les détails"
                                            >
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default ProjectTable; 