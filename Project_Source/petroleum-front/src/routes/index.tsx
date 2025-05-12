import { ProtectedRoute } from '../components/ProtectedRoute';
import ProjectPreparation from '../pages/Projects/ProjectPreparation';
import { Chat } from '../pages/Chat';
import { ReunionPage } from '../pages/Reunion/ReunionPage';

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
        path: '/reunions',
        element: (
            <ProtectedRoute>
                <ReunionPage />
            </ProtectedRoute>
        ),
    },
];

export default routes; 