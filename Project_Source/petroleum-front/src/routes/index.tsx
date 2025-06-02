import { ProtectedRoute } from '../components/ProtectedRoute';
import ProjectPreparation from '../pages/Projects/ProjectPreparation';
import { Chat } from '../pages/Chat';
import { ReunionPage } from '../pages/Reunion/ReunionPage';
import { RAGChat } from '../pages/RAGChat';

const routes = [
    {
        path: '/projects/preparation',
        element: (
            <ProtectedRoute>
                <ProjectPreparation />
            </ProtectedRoute>
        ),
    },
    {
        path: '/chat',
        element: (
            <ProtectedRoute>
                <Chat />
            </ProtectedRoute>
        ),
    },
    {
        path: '/rag-chat',
        element: (
            <ProtectedRoute>
                <RAGChat />
            </ProtectedRoute>
        ),
    },
    {
        path: '/reunions',
        element: (
            <ProtectedRoute>
                <ReunionPage />
            </ProtectedRoute>
        ),
    },
];

export default routes; 