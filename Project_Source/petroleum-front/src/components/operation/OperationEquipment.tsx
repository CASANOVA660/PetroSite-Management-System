import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import axios from '../../utils/axios';
import {
    WrenchScrewdriverIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    AdjustmentsHorizontalIcon,
    ChevronRightIcon,
    ArrowPathIcon,
    UserCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Equipment as EquipmentType } from '../../types/equipment';

// Define equipment interface for our component
interface Equipment {
    _id: string;
    name: string;
    type: string;
    serialNumber?: string;
    status: 'available' | 'inUse' | 'maintenance' | 'reserved';
    location?: string;
    maintenanceDate?: string;
    image?: string;
    description?: string;
    assignedTo?: string;
}

// Define the interface for equipment from the API
interface ProjectEquipment {
    _id: string;
    equipmentId: string | EquipmentType;
    description: string;
    dossierType: string;
}

interface OperationEquipmentProps {
    projectId: string;
    initialEquipment?: Equipment[];
}

const OperationEquipment: React.FC<OperationEquipmentProps> = ({ projectId, initialEquipment = [] }) => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'inUse' | 'maintenance' | 'reserved'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [projectEquipment, setProjectEquipment] = useState<ProjectEquipment[]>([]);

    // Load equipment from Dossier Technique
    useEffect(() => {
        if (projectId) {
            fetchProjectEquipment();
        }
    }, [projectId]);

    // Map API equipment to our component format
    useEffect(() => {
        if (projectEquipment.length > 0) {
            // Map the API equipment to our component format
            const mappedEquipment = projectEquipment.map(item => {
                const equipData = typeof item.equipmentId === 'string'
                    ? { _id: item.equipmentId, nom: 'Unknown', reference: '', status: 'disponible' }
                    : item.equipmentId;

                // Map the API status to our component status
                let mappedStatus: Equipment['status'] = 'available';
                if (typeof equipData !== 'string') {
                    switch (equipData.status) {
                        case 'disponible':
                        case 'disponible_bon_etat':
                            mappedStatus = 'available';
                            break;
                        case 'working_non_disponible':
                            mappedStatus = 'inUse';
                            break;
                        case 'on_repair':
                            mappedStatus = 'maintenance';
                            break;
                        case 'disponible_needs_repair':
                            mappedStatus = 'reserved';
                            break;
                    }
                }

                // Check if we have a stored status in localStorage
                const actualEquipmentId = typeof item.equipmentId === 'string' ? item.equipmentId : item.equipmentId._id;
                try {
                    const equipmentStatusKey = `equipment_status_${actualEquipmentId}`;
                    const storedStatus = localStorage.getItem(equipmentStatusKey);
                    if (storedStatus === 'inUse' || storedStatus === 'available' ||
                        storedStatus === 'maintenance' || storedStatus === 'reserved') {
                        mappedStatus = storedStatus as Equipment['status'];
                    }
                } catch (e) {
                    console.error('Error retrieving equipment status:', e);
                }

                return {
                    _id: item._id,
                    name: equipData.nom,
                    type: 'Équipement Technique', // Default type
                    serialNumber: equipData.reference,
                    status: mappedStatus,
                    location: typeof equipData !== 'string' && 'location' in equipData ? equipData.location : 'Site principal',
                    description: item.description || 'Aucune description fournie',
                    maintenanceDate: new Date().toISOString(), // Default maintenance date
                };
            });

            setEquipment(mappedEquipment);

            // Extract unique equipment types
            const types = [...new Set(mappedEquipment.map(eq => eq.type))];
            setEquipmentTypes(types);

            setLoading(false);
        } else if (initialEquipment && initialEquipment.length > 0) {
            // If we have initialEquipment, use it
            setEquipment(initialEquipment);

            // Extract unique equipment types
            const types = [...new Set(initialEquipment.map(eq => eq.type))];
            setEquipmentTypes(types);

            setLoading(false);
        } else if (projectEquipment.length === 0 && !loading) {
            // If no equipment found in API and not loading, use mock data
            const mockEquipment: Equipment[] = [
                {
                    _id: 'eq1',
                    name: 'Foreuse FD-3000',
                    type: 'Forage',
                    serialNumber: 'FD3000-123456',
                    status: 'inUse',
                    location: 'Site A',
                    maintenanceDate: '2023-12-15',
                    description: 'Foreuse à haute performance pour puits profonds'
                },
                {
                    _id: 'eq2',
                    name: 'Pompe P-500',
                    type: 'Pompage',
                    serialNumber: 'P500-789012',
                    status: 'available',
                    location: 'Entrepôt',
                    maintenanceDate: '2023-11-20',
                    description: 'Pompe industrielle pour extraction de fluides'
                },
                {
                    _id: 'eq3',
                    name: 'Compresseur C-1000',
                    type: 'Compression',
                    serialNumber: 'C1000-345678',
                    status: 'maintenance',
                    location: 'Atelier',
                    maintenanceDate: '2023-10-05',
                    description: 'Compresseur haute pression'
                },
                {
                    _id: 'eq4',
                    name: 'Générateur G-2000',
                    type: 'Électricité',
                    serialNumber: 'G2000-901234',
                    status: 'reserved',
                    location: 'Site B',
                    maintenanceDate: '2024-01-10',
                    description: 'Générateur industriel diesel 2000 kW'
                },
                {
                    _id: 'eq5',
                    name: 'Séparateur S-100',
                    type: 'Séparation',
                    serialNumber: 'S100-567890',
                    status: 'inUse',
                    location: 'Site A',
                    maintenanceDate: '2023-12-01',
                    description: 'Séparateur pour fluides multiphases'
                }
            ];

            setEquipment(mockEquipment);

            // Extract unique equipment types
            const types = [...new Set(mockEquipment.map(eq => eq.type))];
            setEquipmentTypes(types);
        }
    }, [projectEquipment, initialEquipment, loading]);

    // Fetch equipment from API
    const fetchProjectEquipment = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/projects/${projectId}/equipment/Dossier Technique`);
            setProjectEquipment(response.data.data || []);
        } catch (error) {
            console.error('Error fetching project equipment:', error);
            toast.error('Erreur lors du chargement des équipements du projet');
            // In case of error, we'll fall back to mock data in the useEffect
            setProjectEquipment([]);
        } finally {
            setLoading(false);
            // Check localStorage after loading equipment
            setTimeout(checkLocalStorageForEquipmentStatus, 500);
        }
    };

    // Filter equipment based on search term and filters
    useEffect(() => {
        let filtered = [...equipment];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(eq =>
                eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                eq.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(eq => eq.status === statusFilter);
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(eq => eq.type === typeFilter);
        }

        setFilteredEquipment(filtered);
    }, [equipment, searchTerm, statusFilter, typeFilter]);

    // Function to check localStorage for equipment status
    const checkLocalStorageForEquipmentStatus = () => {
        if (equipment.length > 0 && projectEquipment.length > 0) {
            let needsUpdate = false;
            const updatedEquipment = equipment.map(eq => {
                // Find the corresponding project equipment
                const projectEquip = projectEquipment.find(pe => pe._id === eq._id);
                if (!projectEquip) return eq;

                // Get the actual equipment ID
                const actualEquipmentId = typeof projectEquip.equipmentId === 'string'
                    ? projectEquip.equipmentId
                    : projectEquip.equipmentId._id;

                // Check localStorage for status
                try {
                    const equipmentStatusKey = `equipment_status_${actualEquipmentId}`;
                    const storedStatus = localStorage.getItem(equipmentStatusKey);
                    if (storedStatus === 'inUse' || storedStatus === 'available' ||
                        storedStatus === 'maintenance' || storedStatus === 'reserved') {
                        if (eq.status !== storedStatus) {
                            needsUpdate = true;
                            return { ...eq, status: storedStatus as Equipment['status'] };
                        }
                    }
                } catch (e) {
                    console.error('Error retrieving equipment status:', e);
                }

                return eq;
            });

            if (needsUpdate) {
                setEquipment(updatedEquipment);

                // Apply current filters
                let filtered = [...updatedEquipment];
                if (searchTerm) {
                    filtered = filtered.filter(eq =>
                        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        eq.type.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
                if (statusFilter !== 'all') {
                    filtered = filtered.filter(eq => eq.status === statusFilter);
                }
                if (typeFilter !== 'all') {
                    filtered = filtered.filter(eq => eq.type === typeFilter);
                }
                setFilteredEquipment(filtered);
            }
        }
    };

    // Call this function after fetching equipment
    useEffect(() => {
        if (equipment.length > 0 && projectEquipment.length > 0) {
            checkLocalStorageForEquipmentStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectEquipment]);

    // Status badge styling
    const getStatusBadge = (status: Equipment['status']) => {
        switch (status) {
            case 'available':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Disponible</span>;
            case 'inUse':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">En utilisation</span>;
            case 'maintenance':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">En maintenance</span>;
            case 'reserved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Réservé</span>;
            default:
                return null;
        }
    };

    // Get statistics
    const getStats = () => {
        const total = equipment.length;
        const available = equipment.filter(eq => eq.status === 'available').length;
        const inUse = equipment.filter(eq => eq.status === 'inUse').length;
        const maintenance = equipment.filter(eq => eq.status === 'maintenance').length;

        return { total, available, inUse, maintenance };
    };

    const stats = getStats();

    // Map frontend status to backend status
    const mapStatusToBackend = (frontendStatus: string): string => {
        switch (frontendStatus) {
            case 'available':
                return 'AVAILABLE';
            case 'inUse':
                return 'IN_USE';
            case 'maintenance':
                return 'MAINTENANCE';
            case 'reserved':
                return 'REPAIR';
            default:
                return frontendStatus;
        }
    };

    // Handle equipment reservation
    const handleReserveEquipment = async (equipmentId: string) => {
        try {
            // Find the equipment in our local state
            const equipmentToReserve = equipment.find(eq => eq._id === equipmentId);
            if (!equipmentToReserve) {
                toast.error('Équipement non trouvé');
                return;
            }

            // Find the corresponding project equipment to get the actual equipment ID
            const projectEquip = projectEquipment.find(pe => pe._id === equipmentId);
            if (!projectEquip) {
                toast.error('Équipement non trouvé dans les données du projet');
                return;
            }

            // Get the actual equipment ID
            const actualEquipmentId = typeof projectEquip.equipmentId === 'string'
                ? projectEquip.equipmentId
                : projectEquip.equipmentId._id;

            console.log('Reserving equipment with ID:', actualEquipmentId);

            // Get current user from localStorage
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const userId = user?._id;

            if (!userId) {
                toast.error('Utilisateur non authentifié');
                return;
            }

            // FIRST update the UI immediately
            const updatedEquipment = equipment.map(eq =>
                eq._id === equipmentId
                    ? { ...eq, status: 'inUse' as 'inUse' }
                    : eq
            );
            setEquipment(updatedEquipment);
            setFilteredEquipment(updatedEquipment.filter(eq => {
                // Apply current filters
                if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
                if (typeFilter !== 'all' && eq.type !== typeFilter) return false;
                if (searchTerm && !eq.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !(eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
                    !eq.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            }));

            // Force re-render
            setExpandedEquipment(null);
            setTimeout(() => setExpandedEquipment(equipmentId), 10);

            toast.success('Équipement réservé avec succès');

            // THEN make the API calls
            await axios.put(`/equipment/${actualEquipmentId}`, {
                status: 'working_non_disponible',
                statusReason: `Réservé pour le projet ${projectId}`,
                updatedBy: userId
            });

            // Store the equipment status in localStorage to persist across refreshes
            try {
                const equipmentStatusKey = `equipment_status_${actualEquipmentId}`;
                localStorage.setItem(equipmentStatusKey, 'inUse');
            } catch (e) {
                console.error('Error storing equipment status:', e);
            }

            // Get project name for history entry
            let projectName = projectId;
            try {
                // Try to get project name from localStorage
                const projectsString = localStorage.getItem('projects');
                if (projectsString) {
                    const projects = JSON.parse(projectsString);
                    const project = projects.find((p: any) => p._id === projectId);
                    if (project && project.name) {
                        projectName = project.name;
                    }
                }

                // If not found, try to get from sessionStorage
                if (projectName === projectId) {
                    const projectData = sessionStorage.getItem(`project_${projectId}`);
                    if (projectData) {
                        const project = JSON.parse(projectData);
                        if (project && project.name) {
                            projectName = project.name;
                        }
                    }
                }
            } catch (e) {
                console.error('Error getting project name:', e);
            }

            await axios.post(`/equipment/${actualEquipmentId}/history`, {
                type: 'operation',
                equipmentId: actualEquipmentId,
                description: `Équipement réservé pour le projet ${projectName}`,
                fromDate: new Date().toISOString(),
                location: equipmentToReserve.location || 'Site principal',
                responsiblePerson: {
                    name: user?.nom || 'Utilisateur actuel',
                    userId: userId
                },
                createdBy: userId,
                reason: `Réservé pour le projet ${projectName}`
            });

            // No need to fetch from server again as we already updated the UI
        } catch (error) {
            console.error('Error reserving equipment:', error);
            toast.error('Erreur lors de la réservation de l\'équipement');
        }
    };

    // Handle equipment release
    const handleReleaseEquipment = async (equipmentId: string) => {
        try {
            // Find the equipment in our local state
            const equipmentToRelease = equipment.find(eq => eq._id === equipmentId);
            if (!equipmentToRelease) {
                toast.error('Équipement non trouvé');
                return;
            }

            // Find the corresponding project equipment to get the actual equipment ID
            const projectEquip = projectEquipment.find(pe => pe._id === equipmentId);
            if (!projectEquip) {
                toast.error('Équipement non trouvé dans les données du projet');
                return;
            }

            // Get the actual equipment ID
            const actualEquipmentId = typeof projectEquip.equipmentId === 'string'
                ? projectEquip.equipmentId
                : projectEquip.equipmentId._id;

            console.log('Releasing equipment with ID:', actualEquipmentId);

            // Get current user from localStorage
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            const userId = user?._id;

            if (!userId) {
                toast.error('Utilisateur non authentifié');
                return;
            }

            // FIRST update the UI immediately
            const updatedEquipment = equipment.map(eq =>
                eq._id === equipmentId
                    ? { ...eq, status: 'available' as 'available' }
                    : eq
            );
            setEquipment(updatedEquipment);
            setFilteredEquipment(updatedEquipment.filter(eq => {
                // Apply current filters
                if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
                if (typeFilter !== 'all' && eq.type !== typeFilter) return false;
                if (searchTerm && !eq.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !(eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
                    !eq.type.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            }));

            // Force re-render
            setExpandedEquipment(null);
            setTimeout(() => setExpandedEquipment(equipmentId), 10);

            toast.success('Équipement libéré avec succès');

            // THEN make the API calls
            await axios.put(`/equipment/${actualEquipmentId}`, {
                status: 'disponible',
                statusReason: `Libéré du projet ${projectId}`,
                updatedBy: userId
            });

            // Remove the equipment status from localStorage
            try {
                const equipmentStatusKey = `equipment_status_${actualEquipmentId}`;
                localStorage.removeItem(equipmentStatusKey);
            } catch (e) {
                console.error('Error removing equipment status:', e);
            }

            // Get project name for history entry
            let projectName = projectId;
            try {
                // Try to get project name from localStorage
                const projectsString = localStorage.getItem('projects');
                if (projectsString) {
                    const projects = JSON.parse(projectsString);
                    const project = projects.find((p: any) => p._id === projectId);
                    if (project && project.name) {
                        projectName = project.name;
                    }
                }

                // If not found, try to get from sessionStorage
                if (projectName === projectId) {
                    const projectData = sessionStorage.getItem(`project_${projectId}`);
                    if (projectData) {
                        const project = JSON.parse(projectData);
                        if (project && project.name) {
                            projectName = project.name;
                        }
                    }
                }
            } catch (e) {
                console.error('Error getting project name:', e);
            }

            await axios.post(`/equipment/${actualEquipmentId}/history`, {
                type: 'operation',
                equipmentId: actualEquipmentId,
                description: `Équipement libéré du projet ${projectName}`,
                fromDate: new Date().toISOString(),
                toDate: new Date().toISOString(), // End date is now
                location: equipmentToRelease.location || 'Site principal',
                responsiblePerson: {
                    name: user?.nom || 'Utilisateur actuel',
                    userId: userId
                },
                createdBy: userId,
                reason: `Libéré du projet ${projectName}`
            });

            // No need to fetch from server again as we already updated the UI
        } catch (error) {
            console.error('Error releasing equipment:', error);
            toast.error('Erreur lors de la libération de l\'équipement');
        }
    };

    // Format date for display
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return 'Non définie';
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'Date invalide';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
                <WrenchScrewdriverIcon className="h-7 w-7 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Équipement de l'opération</h2>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total des équipements</p>
                            <p className="text-2xl font-semibold text-gray-800 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                            <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Disponibles</p>
                            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.available}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                            <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">En utilisation</p>
                            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.inUse}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                            <ClockIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">En maintenance</p>
                            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.maintenance}</p>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 gap-4 mb-6">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Rechercher un équipement..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="available">Disponible</option>
                        <option value="inUse">En utilisation</option>
                        <option value="maintenance">En maintenance</option>
                        <option value="reserved">Réservé</option>
                    </select>
                    <select
                        className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Tous les types</option>
                        {equipmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Equipment List */}
            {loading ? (
                <div className="flex justify-center items-center h-60">
                    <ArrowPathIcon className="h-10 w-10 text-indigo-500 animate-spin" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Chargement des équipements...</span>
                </div>
            ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucun équipement trouvé</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Essayez de modifier vos filtres ou d'ajouter de nouveaux équipements.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEquipment.map(eq => (
                        <motion.div
                            key={eq._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                                onClick={() => setExpandedEquipment(expandedEquipment === eq._id ? null : eq._id)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            {eq.image ? (
                                                <img src={eq.image} alt={eq.name} className="h-12 w-12 rounded-md object-cover" />
                                            ) : (
                                                <div className="h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                    <WrenchScrewdriverIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{eq.name}</h3>
                                            <div className="flex space-x-2 mt-1">
                                                {getStatusBadge(eq.status)}
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{eq.type}</span>
                                                {eq.serialNumber && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                        Réf: {eq.serialNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRightIcon
                                        className={`h-5 w-5 text-gray-400 transition-transform ${expandedEquipment === eq._id ? 'rotate-90' : ''}`}
                                    />
                                </div>
                            </div>

                            {expandedEquipment === eq._id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-600"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Détails</h4>
                                            <div className="mt-2 space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Localisation</p>
                                                    <p className="text-sm text-gray-900 dark:text-white">{eq.location || 'Non spécifiée'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Prochaine maintenance</p>
                                                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(eq.maintenanceDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Assigné à</p>
                                                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                                                        {eq.assignedTo ? (
                                                            <>
                                                                <UserCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                                {eq.assignedTo}
                                                            </>
                                                        ) : (
                                                            'Non assigné'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{eq.description || 'Aucune description disponible'}</p>

                                            <div className="mt-4 flex space-x-3">
                                                {eq.status === 'available' && (
                                                    <button
                                                        onClick={() => handleReserveEquipment(eq._id)}
                                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                    >
                                                        Réserver
                                                    </button>
                                                )}
                                                {eq.status === 'inUse' && (
                                                    <button
                                                        onClick={() => handleReleaseEquipment(eq._id)}
                                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                    >
                                                        Libérer
                                                    </button>
                                                )}
                                                <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600">
                                                    Voir historique
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OperationEquipment;