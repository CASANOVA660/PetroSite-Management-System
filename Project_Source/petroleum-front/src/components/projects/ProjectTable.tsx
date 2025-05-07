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
                                    Client
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-start text-sm"
                                >
                                    Date de Création
                                </TableCell>
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
                                    <TableCell colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <p className="text-lg">Aucun projet trouvé</p>
                                            <p className="text-sm text-gray-400">Cliquez sur 'Ajouter Projet' pour commencer</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow
                                        key={project._id}
                                        className="transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                    >
                                        <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            <span className="font-medium">{project.projectNumber}</span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {project.clientName}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {formatDate(project.createdAt)}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge size="sm" color={getStatusColor(project.status)}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <button
                                                onClick={() => onViewProject(project._id)}
                                                className="p-2 text-gray-500 hover:text-[#F28C38] transition-colors rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20"
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