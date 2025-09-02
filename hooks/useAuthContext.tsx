import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import * as authService from '../services/authService';
import type { Subscription } from '@supabase/supabase-js';
import { USE_MOCK_DATA } from '../config';
import * as mockDataService from '../services/mockDataService';

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
        if (USE_MOCK_DATA) {
            setCurrentUser(mockDataService.getMockUser());
            setLoading(false);
            return;
        }

        const checkUser = async () => {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        };
        
        checkUser();

        const subscription: Subscription = authService.onAuthStateChange(setCurrentUser);

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);
    
    const login = async (method: 'email' | 'google' | 'facebook', credentials?: { email?: string; password?: string }) => {
        if (USE_MOCK_DATA) {
             setCurrentUser(mockDataService.getMockUser());
             return mockDataService.getMockUser();
        }
        return authService.login(method, credentials);
    };
    
    const signup = async (credentials: { email?: string; password?: string, fullName?: string; }) => {
        if (USE_MOCK_DATA) {
            alert("Signup is disabled in demo mode.");
            return mockDataService.getMockUser();
        }
        return authService.signup(credentials);
    };

    const logout = async () => {
         if (USE_MOCK_DATA) {
            setCurrentUser(null);
            return;
        }
        await authService.logout();
    };

    const uploadAvatar = async (file: File) => {
        if (USE_MOCK_DATA) {
            alert("Avatar upload is disabled in demo mode.");
            return;
        }
        if (!currentUser) throw new Error("User must be logged in to upload an avatar.");
        const newAvatarUrl = await authService.uploadAvatar(file, currentUser.id);
        setCurrentUser(prevUser => prevUser ? { ...prevUser, avatarUrl: newAvatarUrl } : null);
    };

    const linkAccount = async (provider: 'google') => {
        if (USE_MOCK_DATA) {
            alert("Account linking is disabled in demo mode.");
            return;
        }
        await authService.linkAccount(provider);
    };

    const unlinkAccount = async (provider: 'google') => {
        if (USE_MOCK_DATA) {
            alert("Account unlinking is disabled in demo mode.");
            return;
        }
        await authService.unlinkAccount(provider);
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        signup,
        logout,
        uploadAvatar,
        linkAccount,
        unlinkAccount,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
