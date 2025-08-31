import React from 'react';
// FIX: Switched to a namespace import for react-router-dom to resolve module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { currentUser } = useAuth();
    const location = ReactRouterDOM.useLocation();

    if (!currentUser) {
        // Redirect them to the /admin-login page, but save the current location they were
        // trying to go to. This allows us to send them back after they log in.
        return <ReactRouterDOM.Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;