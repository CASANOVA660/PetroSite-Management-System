import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/signin" />;
    }

    if (roles && user?.role && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
    }

    return <>{children}</>;
}; 