export interface Equipment {
    _id: string;
    nom: string;
    reference: string;
    matricule: string;
    dimensions: {
        height: number;
        width: number;
        length: number;
        weight: number;
        volume: number;
    };
    operatingConditions: {
        temperature: string;
        pressure: string;
    };
    location: string;
    status: 'disponible' | 'disponible_needs_repair' | 'on_repair' | 'disponible_bon_etat' | 'working_non_disponible';
    createdAt: string;
    updatedAt: string;
}

export interface EquipmentHistoryEntry {
    _id: string;
    equipmentId: string;
    type: 'placement' | 'operation' | 'maintenance';
    description: string;
    fromDate: string;
    toDate?: string;
    location?: string;
    responsiblePerson?: {
        name: string;
        email?: string;
        phone?: string;
    };
    createdAt: string;
}

export const equipmentStatusLabels: Record<Equipment['status'], string> = {
    'disponible': 'Disponible',
    'disponible_needs_repair': 'Disponible (nécessite réparation)',
    'on_repair': 'En réparation',
    'disponible_bon_etat': 'Disponible (bon état)',
    'working_non_disponible': 'En opération (non disponible)'
};

export const equipmentStatusColors: Record<Equipment['status'], string> = {
    'disponible': 'bg-blue-100 text-blue-800',
    'disponible_needs_repair': 'bg-yellow-100 text-yellow-800',
    'on_repair': 'bg-red-100 text-red-800',
    'disponible_bon_etat': 'bg-green-100 text-green-800',
    'working_non_disponible': 'bg-purple-100 text-purple-800'
}; 