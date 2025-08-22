
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On initial app load, check for a persisted user session
        const checkLoggedIn = async () => {
            try {
                const user = await authService.getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error("Session check failed", error);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = useCallback(async (
        method: 'email' | 'google' | 'facebook', 
        credentials?: { email?: string; password?: string }
    ) => {
        try {
            setLoading(true);
            const user = await authService.login(method, credentials);
            setCurrentUser(user);
        } catch (error) {
            // Re-throw the error so the UI component can handle it
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);
    
    const logout = useCallback(async () => {
        try {
            await authService.logout();
            setCurrentUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    }, []);


    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
