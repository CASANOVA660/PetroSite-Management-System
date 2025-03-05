import { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Checkbox,
    FormControlLabel,
    Alert,
    Divider,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import IconifyIcon from 'components/base/IconifyIcon';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

interface UserFormData {
    nom: string;
    email: string;
    role: string;
    telephone?: string;
    departement?: string;
}

interface User {
    _id: string;
    nom: string;
    email: string;
    role: string;
    telephone?: string;
    departement?: string;
}

const initialFormData: UserFormData = {
    nom: '',
    email: '',
    role: 'User',
    telephone: '',
    departement: '',
};

const API_BASE_URL = 'http://localhost:5000/api'; // Make sure this matches your backend port

const UserManagement = () => {
    const [formData, setFormData] = useState<UserFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            setSuccess('Utilisateur créé avec succès. Un email d\'activation a été envoyé.');
            setFormData(initialFormData);
            fetchUsers();
            setActiveStep(0);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setTableLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.message || 'Failed to fetch users');
        } finally {
            setTableLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/users/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete user');
                }

                fetchUsers();
                setSuccess('Utilisateur supprimé avec succès');
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const handleView = async (user: User) => {
        setSelectedUser(user);
        setViewDialogOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            nom: user.nom,
            email: user.email,
            role: user.role,
            telephone: user.telephone,
            departement: user.departement,
        });
        setEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedUser?._id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }

            fetchUsers();
            setEditDialogOpen(false);
            setSuccess('Utilisateur mis à jour avec succès');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const steps = ['Informations de base', 'Détails professionnels', 'Confirmation'];

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Nom complet"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            required
                            variant="filled"
                            error={Boolean(error && error.includes('nom'))}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            variant="filled"
                            error={Boolean(error && error.includes('email'))}
                            helperText={error && error.includes('email') ? error : ''}
                        />
                        <TextField
                            fullWidth
                            label="Téléphone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleInputChange}
                            variant="filled"
                        />
                    </Stack>
                );
            case 1:
                return (
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            select
                            label="Rôle"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            required
                            variant="filled"
                        >
                            <MenuItem value="User">Utilisateur</MenuItem>
                            <MenuItem value="Manager">Manager</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            label="Département"
                            name="departement"
                            value={formData.departement}
                            onChange={handleInputChange}
                            variant="filled"
                        />
                    </Stack>
                );
            case 2:
                return (
                    <Stack spacing={3}>
                        <Typography variant="subtitle1">Vérifiez les informations suivantes :</Typography>
                        <Box sx={{ pl: 2 }}>
                            <Typography>Nom: {formData.nom}</Typography>
                            <Typography>Email: {formData.email}</Typography>
                            <Typography>Rôle: {formData.role}</Typography>
                            <Typography>Téléphone: {formData.telephone || 'Non spécifié'}</Typography>
                            <Typography>Département: {formData.departement || 'Non spécifié'}</Typography>
                        </Box>
                        <FormControlLabel
                            control={<Checkbox />}
                            label="Envoyer un email d'activation à l'utilisateur"
                            checked
                            disabled
                        />
                    </Stack>
                );
            default:
                return null;
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'nom',
            headerName: 'Nom',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconifyIcon icon="mdi:account" />
                    <Typography>{params.value}</Typography>
                </Box>
            )
        },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'role',
            headerName: 'Rôle',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{
                    bgcolor: params.value === 'Manager' ? 'primary.main' : 'secondary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                }}>
                    {params.value}
                </Box>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            flex: 1,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<IconifyIcon icon="mdi:eye" />}
                    label="View"
                    onClick={() => handleView(params.row as User)}
                />,
                <GridActionsCellItem
                    icon={<IconifyIcon icon="mdi:pencil" />}
                    label="Edit"
                    onClick={() => handleEdit(params.row as User)}
                />,
                <GridActionsCellItem
                    icon={<IconifyIcon icon="mdi:delete" />}
                    label="Delete"
                    onClick={() => handleDelete(params.row._id)}
                    showInMenu
                />,
            ],
        },
    ];

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Gestion des Utilisateurs
            </Typography>

            {/* Create User Form */}
            <Paper sx={{ p: 4, mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Ajouter un Nouvel Utilisateur
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        {success}
                    </Alert>
                )}

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <form onSubmit={handleSubmit}>
                    <Box sx={{ mt: 4, minHeight: 250 }}>
                        {renderStepContent(activeStep)}
                    </Box>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            onClick={() => setActiveStep((prev) => prev - 1)}
                            disabled={activeStep === 0}
                        >
                            Précédent
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                startIcon={<IconifyIcon icon="mdi:account-plus" />}
                            >
                                {loading ? 'Création...' : 'Créer Utilisateur'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setActiveStep((prev) => prev + 1)}
                                variant="contained"
                            >
                                Suivant
                            </Button>
                        )}
                    </Box>
                </form>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* Users Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Liste des Utilisateurs
                </Typography>
                <DataGrid
                    rows={users}
                    columns={columns}
                    getRowId={(row) => row._id}
                    autoHeight
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 5 } },
                    }}
                    loading={tableLoading}
                    sx={{
                        '& .MuiDataGrid-cell': {
                            borderColor: 'divider',
                        },
                    }}
                />
            </Paper>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)}>
                <DialogTitle>Détails de l'Utilisateur</DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <TextField
                                label="Nom"
                                value={selectedUser.nom}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Email"
                                value={selectedUser.email}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Rôle"
                                value={selectedUser.role}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Téléphone"
                                value={selectedUser.telephone || 'Non spécifié'}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Département"
                                value={selectedUser.departement || 'Non spécifié'}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Modifier l'Utilisateur</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            label="Nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Téléphone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Département"
                            name="departement"
                            value={formData.departement}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Rôle"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            fullWidth
                        >
                            <MenuItem value="User">Utilisateur</MenuItem>
                            <MenuItem value="Manager">Manager</MenuItem>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleUpdate} variant="contained">
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserManagement; 