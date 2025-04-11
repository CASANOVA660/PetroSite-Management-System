export interface User {
    _id: string;
    nom: string;
    prenom: string;
}

export interface Action {
    _id: string;
    title: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
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
}

export interface GlobalAction extends Action {
    isProjectAction: boolean;
    projectId: string | null;
} 