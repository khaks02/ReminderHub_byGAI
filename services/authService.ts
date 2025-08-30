import { User } from '../types';
import { supabase } from './supabaseClient';
// FIX: Auth-related types are imported from `@supabase/gotrue-js` to resolve export errors.
// The `AuthSubscription` type is aliased as `Subscription` for consistency.
import type { User as SupabaseUser, Provider, AuthResponse, AuthSubscription as Subscription } from '@supabase/gotrue-js';


// Helper to map the Supabase user object to our application's User type.
const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || 'No email provided',
        avatarUrl: supabaseUser.user_metadata?.avatar_url,
        identities: supabaseUser.identities,
    };
};

// Subscribes to Supabase's auth state changes and calls the provided callback.
export const onAuthStateChange = (callback: (user: User | null) => void): Subscription => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = mapSupabaseUser(session?.user ?? null);
        callback(currentUser);
    });
    return subscription;
};

// Handles the sign up process.
export const signup = async ({ email, password, fullName }: { email?: string; password?: string; fullName?: string; }): Promise<User | null> => {
    if (!email || !password || !fullName) {
        throw new Error("Full name, email, and password are required for sign up.");
    }
    const { data, error }: AuthResponse = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign up failed, no user returned.");

    // The user is created, but may need to confirm their email.
    // The onAuthStateChange listener will handle the session.
    return mapSupabaseUser(data.user);
};


// Handles the login process.
export const login = async (
    method: 'email' | 'google' | 'facebook',
    credentials?: { email?: string; password?: string }
): Promise<User | void> => {
    if (method === 'email') {
        if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required.");
        }
        const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Login failed, no user returned.");
        
        const user = mapSupabaseUser(data.user);
        if (!user) throw new Error("Could not map user data.");
        return user;
    }

    if (method === 'google' || method === 'facebook') {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: method as Provider,
            options: {
                skipBrowserRedirect: true,
            }
        });

        if (error) {
            throw new Error(error.message);
        }
        
        if (data.url) {
            // Open the URL in a new tab to avoid iframe restrictions.
            window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
             throw new Error('OAuth login failed: No URL returned from Supabase.');
        }

        // OAuth flow redirects in a new tab, so we don't return a user here.
        // The onAuthStateChange listener will pick up the session upon redirect.
        return;
    }

    throw new Error('Unsupported login method.');
};

// Handles the logout process.
export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("[AuthService] Logout failed:", error);
        throw error;
    }
};

// Fetches the current user session from Supabase.
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return null;
    }
    return mapSupabaseUser(session.user ?? null);
};

// Handles linking an OAuth provider to the current user.
export const linkAccount = async (provider: 'google'): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            // Request readonly access to the user's calendar events
            scopes: 'https_://www.googleapis.com/auth/calendar.events.readonly',
            skipBrowserRedirect: true,
        },
    });
    if (error) {
        throw new Error(error.message);
    }
    
    if (data.url) {
        // Open the URL in a new tab to avoid iframe restrictions.
        window.open(data.url, '_blank', 'noopener,noreferrer');
    } else {
        throw new Error('OAuth account linking failed: No URL returned from Supabase.');
    }
    // OAuth flow redirects in new tab. The onAuthStateChange listener will handle the updated session.
};

// Placeholder for unlinking an OAuth provider.
export const unlinkAccount = async (provider: 'google'): Promise<void> => {
    // Unlinking a provider securely requires an Edge Function with admin privileges
    // to call `supabase.auth.admin.unlinkIdentity`. This is a placeholder to show the flow.
    console.warn(`[AuthService] Unlinking ${provider} is not implemented on the client-side for security reasons.`);
    alert('Disconnecting accounts is a feature coming soon!');
    return Promise.resolve();
};


// Handles avatar upload to Supabase Storage.
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    if (!file) throw new Error('No file provided for upload.');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error('[AuthService] Supabase avatar upload error:', uploadError);
        throw new Error('Failed to upload avatar.');
    }

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    if (!publicUrl) {
        throw new Error('Could not get public URL for avatar.');
    }

    const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
            avatar_url: publicUrl,
        }
    });
    
    if (updateUserError) {
        console.error('[AuthService] Supabase error updating user metadata with avatar URL:', updateUserError);
        throw new Error('Failed to update user profile with new avatar.');
    }

    return publicUrl;
};