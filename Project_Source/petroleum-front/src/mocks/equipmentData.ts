import { Equipment, EquipmentHistoryEntry } from '../types/equipment';

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate a random date within the last year
const generateDate = (monthsAgo = 12) => {
    const date = new Date();
    date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsAgo));
    return date.toISOString();
};

// Mock equipment data
export const mockEquipment: Equipment[] = [
    {
        _id: 'eq-001',
        nom: 'Pompe centrifuge industrielle',
        reference: 'PC-5000-XT',
        matricule: 'MAT-PC5000-001',
        dimensions: {
            height: 120, // cm
            width: 80,   // cm
            length: 160, // cm
            weight: 450, // kg
            volume: 1.5, // m³
        },
        operatingConditions: {
            temperature: '-20°C à +80°C',
            pressure: 'Max 25 bars',
        },
        location: 'Zone A - Unité de production',
        status: 'working_non_disponible',
        createdAt: generateDate(10),
        updatedAt: generateDate(2),
    },
    {
        _id: 'eq-002',
        nom: 'Compresseur à vis',
        reference: 'CV-8750-HD',
        matricule: 'MAT-CV8750-002',
        dimensions: {
            height: 180, // cm
            width: 90,   // cm
            length: 200, // cm
            weight: 870, // kg
            volume: 3.2, // m³
        },
        operatingConditions: {
            temperature: '0°C à +60°C',
            pressure: 'Max 40 bars',
        },
        location: 'Zone B - Salle des machines',
        status: 'disponible',
        createdAt: generateDate(8),
        updatedAt: generateDate(5),
    },
    {
        _id: 'eq-003',
        nom: 'Séparateur gaz-liquide',
        reference: 'SGL-3200',
        matricule: 'MAT-SGL3200-003',
        dimensions: {
            height: 250, // cm
            width: 150,  // cm
            length: 150, // cm
            weight: 1200, // kg
            volume: 5.6, // m³
        },
        operatingConditions: {
            temperature: '-10°C à +70°C',
            pressure: 'Max 30 bars',
        },
        location: 'Zone C - Traitement du gaz',
        status: 'on_repair',
        createdAt: generateDate(15),
        updatedAt: generateDate(1),
    },
    {
        _id: 'eq-004',
        nom: 'Échangeur de chaleur à plaques',
        reference: 'ECP-6500',
        matricule: 'MAT-ECP6500-004',
        dimensions: {
            height: 110, // cm
            width: 70,   // cm
            length: 90,  // cm
            weight: 320, // kg
            volume: 0.7, // m³
        },
        operatingConditions: {
            temperature: '-30°C à +120°C',
            pressure: 'Max 20 bars',
        },
        location: 'Zone A - Unité de production',
        status: 'disponible_needs_repair',
        createdAt: generateDate(7),
        updatedAt: generateDate(3),
    },
    {
        _id: 'eq-005',
        nom: 'Générateur diesel de secours',
        reference: 'GDS-9800',
        matricule: 'MAT-GDS9800-005',
        dimensions: {
            height: 190, // cm
            width: 100,  // cm
            length: 230, // cm
            weight: 1500, // kg
            volume: 4.4, // m³
        },
        operatingConditions: {
            temperature: '-5°C à +45°C',
            pressure: 'N/A',
        },
        location: 'Zone D - Alimentation électrique',
        status: 'working_non_disponible',
        createdAt: generateDate(12),
        updatedAt: generateDate(6),
    },
    {
        _id: 'eq-006',
        nom: 'Unité de filtration d\'eau',
        reference: 'UFE-4300',
        matricule: 'MAT-UFE4300-006',
        dimensions: {
            height: 210, // cm
            width: 95,   // cm
            length: 160, // cm
            weight: 550, // kg
            volume: 3.2, // m³
        },
        operatingConditions: {
            temperature: '+5°C à +40°C',
            pressure: 'Max 15 bars',
        },
        location: 'Zone E - Traitement des fluides',
        status: 'disponible',
        createdAt: generateDate(14),
        updatedAt: generateDate(4),
    },
    {
        _id: 'eq-007',
        nom: 'Vanne de contrôle haute pression',
        reference: 'VHP-2100',
        matricule: 'MAT-VHP2100-007',
        dimensions: {
            height: 45,  // cm
            width: 30,   // cm
            length: 50,  // cm
            weight: 85,  // kg
            volume: 0.07, // m³
        },
        operatingConditions: {
            temperature: '-40°C à +200°C',
            pressure: 'Max 100 bars',
        },
        location: 'Zone C - Traitement du gaz',
        status: 'disponible_bon_etat',
        createdAt: generateDate(9),
        updatedAt: generateDate(2),
    },
    {
        _id: 'eq-008',
        nom: 'Tour de refroidissement',
        reference: 'TR-7600-XL',
        matricule: 'MAT-TR7600-008',
        dimensions: {
            height: 380, // cm
            width: 220,  // cm
            length: 220, // cm
            weight: 3200, // kg
            volume: 18.4, // m³
        },
        operatingConditions: {
            temperature: '0°C à +50°C',
            pressure: 'Max 4 bars',
        },
        location: 'Zone F - Refroidissement',
        status: 'disponible_needs_repair',
        createdAt: generateDate(18),
        updatedAt: generateDate(7),
    },
    {
        _id: 'eq-009',
        nom: 'Moteur électrique antidéflagrant',
        reference: 'MEA-3300',
        matricule: 'MAT-MEA3300-009',
        dimensions: {
            height: 85,  // cm
            width: 65,   // cm
            length: 110, // cm
            weight: 425, // kg
            volume: 0.6, // m³
        },
        operatingConditions: {
            temperature: '-15°C à +70°C',
            pressure: 'N/A',
        },
        location: 'Zone B - Salle des machines',
        status: 'on_repair',
        createdAt: generateDate(16),
        updatedAt: generateDate(1),
    },
    {
        _id: 'eq-010',
        nom: 'Cuve de stockage chimique',
        reference: 'CSC-8400',
        matricule: 'MAT-CSC8400-010',
        dimensions: {
            height: 270, // cm
            width: 200,  // cm
            length: 200, // cm
            weight: 750, // kg (vide)
            volume: 10.8, // m³
        },
        operatingConditions: {
            temperature: '-5°C à +35°C',
            pressure: 'Max 2 bars',
        },
        location: 'Zone E - Traitement des fluides',
        status: 'working_non_disponible',
        createdAt: generateDate(20),
        updatedAt: generateDate(5),
    },
    {
        _id: 'eq-011',
        nom: 'Analyseur de gaz portable',
        reference: 'AGP-1200',
        matricule: 'MAT-AGP1200-011',
        dimensions: {
            height: 25,  // cm
            width: 18,   // cm
            length: 12,  // cm
            weight: 2.8, // kg
            volume: 0.005, // m³
        },
        operatingConditions: {
            temperature: '-10°C à +50°C',
            pressure: 'N/A',
        },
        location: 'Zone G - Laboratoire',
        status: 'disponible',
        createdAt: generateDate(11),
        updatedAt: generateDate(3),
    },
    {
        _id: 'eq-012',
        nom: 'Pompe à boue haute densité',
        reference: 'PBH-5600',
        matricule: 'MAT-PBH5600-012',
        dimensions: {
            height: 140, // cm
            width: 95,   // cm
            length: 180, // cm
            weight: 780, // kg
            volume: 2.4, // m³
        },
        operatingConditions: {
            temperature: '+5°C à +60°C',
            pressure: 'Max 18 bars',
        },
        location: 'Zone H - Forage',
        status: 'disponible_needs_repair',
        createdAt: generateDate(13),
        updatedAt: generateDate(4),
    },
];

// Mock equipment history data
export const mockEquipmentHistory: Record<string, EquipmentHistoryEntry[]> = {
    'eq-001': [
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-001',
            type: 'operation',
            description: 'Équipement en cours d\'utilisation sur le site de production principale - Projet SAREP',
            fromDate: generateDate(1),
            toDate: undefined,
            responsiblePerson: {
                name: 'Mohammed Tazi',
                email: 'm.tazi@petroconnect.com',
                phone: '+212 661-789012',
            },
            createdAt: generateDate(1),
        },
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-001',
            type: 'maintenance',
            description: 'Maintenance préventive - remplacement des joints d\'étanchéité',
            fromDate: generateDate(4),
            toDate: generateDate(3.8),
            responsiblePerson: {
                name: 'Ahmed Benali',
                email: 'a.benali@petroconnect.com',
                phone: '+212 661-234567',
            },
            createdAt: generateDate(4),
        },
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-001',
            type: 'placement',
            description: 'Déplacement vers Zone A',
            fromDate: generateDate(6),
            toDate: undefined,
            location: 'Zone A - Unité de production',
            responsiblePerson: {
                name: 'Karim Alaoui',
                email: 'k.alaoui@petroconnect.com'
            },
            createdAt: generateDate(6),
        },
    ],
    'eq-003': [
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-003',
            type: 'maintenance',
            description: 'Réparation majeure - défaillance du système d\'étanchéité',
            fromDate: generateDate(1.5),
            toDate: undefined,
            responsiblePerson: {
                name: 'Rachid Tazi',
                email: 'r.tazi@petroconnect.com',
                phone: '+212 662-345678',
            },
            createdAt: generateDate(1.5),
        },
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-003',
            type: 'operation',
            description: 'Mise en service pour projet SAMIR-Phase 2',
            fromDate: generateDate(8),
            toDate: generateDate(2),
            responsiblePerson: {
                name: 'Youssef Chraibi',
                email: 'y.chraibi@petroconnect.com'
            },
            createdAt: generateDate(8),
        },
    ],
    'eq-005': [
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-005',
            type: 'operation',
            description: 'Fourniture électrique d\'urgence pour le site de forage Hassi-Berkane',
            fromDate: generateDate(1.2),
            toDate: undefined,
            responsiblePerson: {
                name: 'Nadia Lahlou',
                email: 'n.lahlou@petroconnect.com',
                phone: '+212 662-234567',
            },
            createdAt: generateDate(1.2),
        }
    ],
    'eq-008': [
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-008',
            type: 'maintenance',
            description: 'Inspection - corrosion détectée sur les buses de pulvérisation',
            fromDate: generateDate(7.2),
            toDate: generateDate(7),
            responsiblePerson: {
                name: 'Hassan Mansouri',
                email: 'h.mansouri@petroconnect.com',
            },
            createdAt: generateDate(7.2),
        },
    ],
    'eq-010': [
        {
            _id: `hist-${generateId()}`,
            equipmentId: 'eq-010',
            type: 'operation',
            description: 'Stockage de produits chimiques pour le traitement des boues - Site Ras El Aïn',
            fromDate: generateDate(0.5),
            toDate: undefined,
            responsiblePerson: {
                name: 'Samir Bakkali',
                email: 's.bakkali@petroconnect.com',
                phone: '+212 663-456789',
            },
            createdAt: generateDate(0.5),
        }
    ]
};

// Function to update the Redux store with mock data
export const injectMockEquipmentData = (dispatch: any) => {
    // Import these actions where you need to use this function
    // import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

    return {
        equipment: mockEquipment,
        selectedEquipment: null,
        equipmentHistory: {
            placement: [],
            operation: [],
            maintenance: []
        },
        loading: false,
        error: null
    };
}; 