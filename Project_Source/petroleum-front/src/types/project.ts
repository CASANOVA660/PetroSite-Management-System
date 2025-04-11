export interface Project {
    _id: string;
    name: string;
    description: string;
    status: 'active' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    manager: string;
    team: string[];
    categories: string[];
    createdAt: string;
    updatedAt: string;
} 