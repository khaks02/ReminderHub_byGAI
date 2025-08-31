

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import * as authService from '../services/authService';
// FIX: Corrected the Supabase subscription type import. The exported member is `Subscription`, not `AuthSubscription`.
import type { Subscription } from '@supabase/supabase-js';
import { USE_MOCK_DATA } from '../config';

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
        // If in mock mode, set up a mock user and skip Supabase initialization.
        if (USE_MOCK_DATA) {
            setCurrentUser({
                id: 'mock-user-123',
                name: 'Kool Sharma',
                email: 'kool.sharma@example.com',
                avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Kool%20Sharma`,
            });
            setLoading(false);
            return; // Exit early to prevent real auth calls
        }
        
        const checkUser = async () => {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        };
        
        checkUser();

        const subscription: Subscription = authService.onAuthStateChange(setCurrentUser);

        // Cleanup subscription on unmount
        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);
    
    const uploadAvatar = async (file: File) => {
        if (!currentUser) throw new Error("User must be logged in to upload an avatar.");
        const newAvatarUrl = await authService.uploadAvatar(file, currentUser.id);
        setCurrentUser(prevUser => prevUser ? { ...prevUser, avatarUrl: newAvatarUrl } : null);
    };

    const value: AuthContextType = USE_MOCK_DATA ? {
        currentUser,
        loading,
        login: async () => { console.log('[MockAuth] login called.'); },
        signup: async () => { console.log('[MockAuth] signup called.'); return null; },
        logout: async () => { 
            console.log('[MockAuth] logout called.');
            setCurrentUser(null);
        },
        uploadAvatar: async () => { console.log('[MockAuth] uploadAvatar called.'); },
        linkAccount: async () => { console.log('[MockAuth] linkAccount called.'); },
        unlinkAccount: async () => { console.log('[MockAuth] unlinkAccount called.'); },
    } : {
        currentUser,
        loading,
        login: authService.login,
        signup: authService.signup,
        logout: authService.logout,
        uploadAvatar,
        linkAccount: authService.linkAccount,
        unlinkAccount: authService.unlinkAccount,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};