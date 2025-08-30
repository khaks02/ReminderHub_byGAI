

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import * as authService from '../services/authService';
// FIX: Corrected the Supabase subscription type import. The exported member is `Subscription`, not `AuthSubscription`.
import type { Subscription } from '@supabase/supabase-js';

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


    const value: AuthContextType = {
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
