export interface User {
    _id: string;
    nom: string;
    prenom: string;
}

export interface Action {
    _id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    responsible: User;

    projectId: string;
    category: string;
} 