import { User } from './action';

export interface GlobalAction {
    _id: string;
    title: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    responsibleForRealization: User;
    responsibleForFollowUp: User;
    category: string;
    projectId?: { _id: string; name: string };
    projectCategory?: string;
    manager: User;
    createdAt: string;
    updatedAt: string;
} 