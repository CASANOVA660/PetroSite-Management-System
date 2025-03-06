import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "../../../icons";

interface User {
    _id: string;
    nom: string;
    email: string;
    role: string;
    telephone?: string;
    departement?: string;
    estActif: boolean;
}

interface UserTableListProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
}

const UserTableList: React.FC<UserTableListProps> = ({ users, onEdit, onDelete }) => {
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
                                    Utilisateur
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Email
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Département
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-theme-xs"
                                >
                                    Status
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
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center">
                                                <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
                                                    {user.nom.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block font-medium text-gray-800 dark:text-gray-300">
                                                    {user.nom}
                                                </span>
                                                <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 text-start text-theme-sm">
                                        {user.email}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 text-start text-theme-sm">
                                        {user.departement || '-'}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-start text-theme-sm">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${user.estActif
                                            ? 'bg-success/10 text-success'
                                            : 'bg-warning/10 text-warning'
                                            }`}>
                                            {user.estActif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 text-theme-sm">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(user._id)}
                                                className="text-gray-500 hover:text-danger dark:text-gray-400 dark:hover:text-danger"
                                            >
                                                <TrashBinIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default UserTableList;