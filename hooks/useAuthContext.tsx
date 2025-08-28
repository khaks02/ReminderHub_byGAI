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
        const checkUser = async () => {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        };
        checkUser();

        const subscription = authService.onAuthStateChange(setCurrentUser);

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []);

    const login = useCallback(authService.login, []);
    const signup = useCallback(authService.signup, []);
    const logout = useCallback(authService.logout, []);
    
    const uploadAvatar = async (file: File) => {
        if (!currentUser) throw new Error("User must be logged in to upload an avatar.");
        const newAvatarUrl = await authService.uploadAvatar(file, currentUser.id);
        setCurrentUser(prevUser => prevUser ? { ...prevUser, avatarUrl: newAvatarUrl } : null);
    };

    const linkAccount = useCallback(authService.linkAccount, []);
    const unlinkAccount = useCallback(authService.unlinkAccount, []);


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