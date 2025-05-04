import { ProtectedRoute } from '../components/ProtectedRoute';
import ProjectPreparation from '../pages/Projects/ProjectPreparation';
import { Chat } from '../pages/Chat';

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
];

export default routes; 