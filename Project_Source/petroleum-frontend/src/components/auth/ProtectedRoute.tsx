import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiresManager?: boolean;
}

const ProtectedRoute = ({ children, requiresManager = false }: ProtectedRouteProps) => {
    const { user, token } = useAppSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/authentication/login" />;
    }

    if (requiresManager && user?.role !== 'Manager') {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute; 