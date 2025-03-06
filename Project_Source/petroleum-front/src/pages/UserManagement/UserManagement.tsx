import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { createUser, fetchUsers, deleteUser, updateUser, clearMessages } from "../../store/slices/userSlice";
import { PlusIcon, TrashBinIcon } from "../../icons";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { socket } from '../../utils/socket';

interface User {
    _id: string;
    nom: string;
    email: string;
    role: string;
    telephone?: string;
    departement?: string;
    estActif: boolean;
}

interface UserFormData {
    nom: string;
    email: string;
    role: string;
    departement?: string;
}

export default function UserManagement() {
    const dispatch = useAppDispatch();
    const { users, loading, error, success } = useAppSelector((state) => state.users);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        nom: '',
        email: '',
        role: 'User',
        departement: ''
    });

    useEffect(() => {
        dispatch(fetchUsers());

        socket.on('userStatusUpdate', (data: { userId: string; estActif: boolean }) => {
            // Refresh the users list when status changes
            dispatch(fetchUsers());
        });

        return () => {
            socket.off('userStatusUpdate');
        };
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            setFormData({ nom: '', email: '', role: 'User', departement: '' });
            setShowForm(false);
            dispatch(fetchUsers());

            const timer = setTimeout(() => {
                dispatch(clearMessages());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [success, dispatch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createUser(formData));
    };

    const handleDelete = (userId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            dispatch(deleteUser(userId));
        }
    };

    return (
        <div className="w-full">
            <PageMeta
                title="Gestion des Utilisateurs | Petroleum Dashboard"
                description="Page de gestion des utilisateurs du système"
            />
            <PageBreadcrumb pageTitle="Gestion des Utilisateurs" />

            <div className="p-4 md:p-6 2xl:p-10">
                {error && (
                    <Alert variant="error" title="Erreur" message={error} showLink={false} />
                )}
                {success && (
                    <Alert variant="success" title="Succès" message={success} showLink={false} />
                )}

                <div className="flex justify-end mb-6">
                    <Button
                        variant="primary"
                        className="flex items-center gap-2"
                        onClick={() => setShowForm(true)}
                        size="sm"
                    >

                        <span>Nouvel Utilisateur + </span>
                    </Button>
                </div>

                {showForm && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mb-6">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
                                Créer un Nouvel Utilisateur
                            </h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                        Nom Complet
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/[0.05] dark:text-white dark:placeholder:text-white/60"
                                        placeholder="Entrez le nom complet"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/[0.05] dark:text-white dark:placeholder:text-white/60"
                                        placeholder="Entrez l'email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                        Rôle
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/[0.05] dark:text-white"
                                    >
                                        <option value="User">Utilisateur</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                        Département
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.departement}
                                        onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/[0.05] dark:text-white dark:placeholder:text-white/60"
                                        placeholder="Entrez le département"
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Chargement...' : 'Créer'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                        className="w-full"
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="max-w-full overflow-x-auto">
                        <div className="min-w-[1102px]">
                            <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <TableRow>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Utilisateur
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Email
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Département
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                        >
                                            Status
                                        </TableCell>
                                        <TableCell
                                            isHeader
                                            className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
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
                                                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                            {user.nom}
                                                        </span>
                                                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {user.departement || '-'}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${user.estActif
                                                    ? 'bg-[#34D399]/10 text-[#34D399]'   // Yellow Pending
                                                    : 'bg-[#F43F5E]/10 text-[#F43F5E]'  // Yellow from BasicTable
                                                    }`}>
                                                    {user.estActif ? 'Actif' : 'Inactif'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
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
            </div>
        </div>
    );
} 