
import { User } from '../types';

const MOCK_USER: User = {
    id: 'user-123-alex',
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
};

const USER_SESSION_KEY = 'reminderhub_user_session';

// --- MOCK API ---
// This simulates calls to a backend authentication service.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const login = async (
    method: 'email' | 'google' | 'facebook', 
    credentials?: { email?: string; password?: string }
): Promise<User> => {
    await delay(1000); // Simulate network latency

    if (method === 'email') {
        if (credentials?.email?.toLowerCase() === MOCK_USER.email && credentials?.password === 'password123') {
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(MOCK_USER));
            return MOCK_USER;
        } else {
            throw new Error("Invalid email or password.");
        }
    }
    
    if (method === 'google' || method === 'facebook') {
        // In a real app, this would involve a popup and OAuth flow.
        // We'll simulate a successful login.
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(MOCK_USER));
        return MOCK_USER;
    }

    throw new Error('Unsupported login method.');
};

export const logout = async (): Promise<void> => {
    await delay(300);
    localStorage.removeItem(USER_SESSION_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
    await delay(500); // Simulate checking session validity
    try {
        const sessionData = localStorage.getItem(USER_SESSION_KEY);
        if (sessionData) {
            return JSON.parse(sessionData) as User;
        }
        return null;
    } catch (error) {
        console.error("Failed to parse user session", error);
        return null;
    }
};
