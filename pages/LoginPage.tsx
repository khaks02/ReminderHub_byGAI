import React, { useState } from 'react';
// FIX: Switched to a namespace import for react-router-dom to resolve module resolution errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';
import { Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import Spinner from '../components/Spinner';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.187-8.164l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.617,44,30.45,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);
const FacebookIcon = () => (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M22,12c0-5.523-4.477-10-10-10S2,6.477,2,12c0,4.99,3.657,9.128,8.438,9.878V15.89H8.219v-3.766h2.219v-2.83c0-2.193,1.313-3.414,3.3-3.414c0.941,0,1.938,0.166,1.938,0.166v3.194h-1.594c-1.079,0-1.422,0.672-1.422,1.362v1.654h3.547l-0.527,3.766h-3.02V21.878C18.343,21.128,22,16.99,22,12z"></path>
    </svg>
);


const LoginPage: React.FC = () => {
    const { login, signup, loading } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();
    const location = ReactRouterDOM.useLocation();

    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const from = location.state?.from?.pathname || "/app/";
    const approvedTesterEmail = "kshitij.khandelwal@outlook.com";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password || (isSignUp && !fullName)) {
            setError("All fields are required.");
            return;
        }
        try {
            if (isSignUp) {
                await signup({ email, password, fullName });
                // Supabase sends a confirmation email, inform the user
                alert("Sign up successful! Please check your email to confirm your account.");
                setIsSignUp(false); // Switch back to login form
            } else {
                await login('email', { email, password });
                navigate(from, { replace: true });
            }
        } catch (err) {
            console.error('[LoginPage] Authentication error:', err);
            setError(err instanceof Error ? err.message : "An unknown authentication error occurred.");
        }
    };
    
    const handleOAuthLogin = async (method: 'google' | 'facebook') => {
        setError(null);
        try {
            await login(method);
            navigate(from, { replace: true });
        } catch (err) {
             console.error('[LoginPage] Authentication error:', err);
             setError(err instanceof Error ? err.message : "An unknown login error occurred.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bkg-light dark:bg-bkg-dark p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary">myreminder</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {isSignUp ? 'Create your account' : 'Admin Test Login'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md text-sm text-center">{error}</p>}
                        
                        {isSignUp && (
                             <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Alex Doe"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                             <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                             <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                                    required
                                    disabled={loading}
                                    autoComplete="email"
                                />
                                {email.toLowerCase() === approvedTesterEmail && (
                                     <div className="absolute top-[-2px] right-0 text-xs bg-green-500 text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                                         <CheckCircle size={12} /> Admin Test Access
                                     </div>
                                )}
                             </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition"
                                    required
                                    disabled={loading}
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                             <button
                                type="submit"
                                className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? <Spinner size="5" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                            </button>
                        </div>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleOAuthLogin('google')}
                            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            <GoogleIcon />
                            <span className="text-sm font-medium">Google</span>
                        </button>
                         <button
                            onClick={() => handleOAuthLogin('facebook')}
                            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            <FacebookIcon />
                            <span className="text-sm font-medium">Facebook</span>
                        </button>
                    </div>

                     <div className="text-center mt-6">
                        <button onClick={() => { setIsSignUp(s => !s); setError(null); }} className="text-sm text-primary hover:underline">
                            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;