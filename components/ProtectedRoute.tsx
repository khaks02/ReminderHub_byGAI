import React from 'react';
// FIX: Switched from a namespace import to direct named imports to resolve module resolution errors.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows us to send them back after they log in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;