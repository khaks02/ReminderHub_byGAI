


import React from 'react';
// FIX: Using a namespace import and re-destructuring to work around potential module resolution issues.
import * as ReactRouterDOM from 'react-router-dom';
const { Navigate, useLocation } = ReactRouterDOM;
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