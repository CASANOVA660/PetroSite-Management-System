import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';

interface AuthCheckProps {
    children: (user: any) => React.ReactNode;
}

export const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children(user)}</>;
}; 