import { ProtectedRoute } from '../components/ProtectedRoute';
import ProjectPreparation from '../pages/Projects/ProjectPreparation';

const routes = [
    {
        path: '/projects/preparation',
        element: (
            <ProtectedRoute>
                <ProjectPreparation />
            </ProtectedRoute>
        ),
    },
];

export default routes; 