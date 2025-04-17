export interface User {
    _id: string;
    nom: string;
    prenom: string;
}

export interface Action {
    _id: string;
    title: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    responsibleForRealization: string;
    responsibleForFollowUp: string;
    category: string;
    project: string | null;
    projectId?: string | null;
    manager: string;
    createdAt: string;
    updatedAt: string;
    responsible: User;
    needsValidation?: boolean;
}

export interface GlobalAction extends Action {
    isProjectAction: boolean;
    projectId: string | null;
}

export interface GlobalActionFormData {
    title: string;
    content: string;
    category: string;
    projectId: string;
    projectCategory: string;
    responsibleForRealization: string;
    responsibleForFollowUp: string;
    startDate: string;
    endDate: string;
    needsValidation: boolean;
} 