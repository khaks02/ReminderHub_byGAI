import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Zap, Bot, Utensils, Sparkles, Mail, ArrowRight } from 'lucide-react';

// Feature Card Component
const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) => (
    <div 
        className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 card-lift animate-fade-in-up"
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center justify-center w-12 h-12 mb-4 bg-primary/20 rounded-lg">
            {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
    </div>
);

// Interactive Orb Logic
const useInteractiveOrb = () => {
    const orbRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (orbRef.current) {
                orbRef.current.style.left = `${e.clientX}px`;
                orbRef.current.style.top = `${e.clientY}px`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return orbRef;
};

// Main Coming Soon Page
const ComingSoonPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const navigate = ReactRouterDOM.useNavigate();
    const [adminClickCount, setAdminClickCount] = useState(0);
    const adminClickTimer = useRef<number | null>(null);
    const orbRef = useInteractiveOrb();

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            console.log(`Subscribed with email: ${email}`);
            setSubscribed(true);
        }
    };
    
    const handleAdminLoginClick = () => {
        if (adminClickTimer.current) {
            clearTimeout(adminClickTimer.current);
        }
        const newCount = adminClickCount + 1;
        setAdminClickCount(newCount);
        if (newCount === 5) {
            navigate('/admin-login');
        }
        adminClickTimer.current = window.setTimeout(() => setAdminClickCount(0), 2000);
    };

    return (
        <>
            <div id="interactive-orb" ref={orbRef}></div>
            <div className="relative min-h-screen w-full animated-gradient text-white flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
                <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
                    <header 
                        className="mb-12 cursor-pointer animate-fade-in-up" 
                        onClick={handleAdminLoginClick}
                        title="Admin Access (click 5 times)"
                        style={{ animationDelay: '100ms' }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold flex items-center justify-center gap-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            <Sparkles className="text-primary-light" />
                            myreminder
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
                            The future of your day is here. Your personal AI, reimagined.
                        </p>
                    </header>

                    <main className="w-full">
                        <div className="mb-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <h2 className="text-2xl font-semibold mb-4">Be the first to experience the future.</h2>
                            {subscribed ? (
                                <p className="text-green-400 font-semibold text-lg animate-pop-in">
                                    Awesome! We'll be in touch soon.
                                </p>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-lg mx-auto">
                                    <div className="relative w-full">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your.email@example.com"
                                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition placeholder:text-gray-400"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="group w-full sm:w-auto px-6 py-3 bg-primary font-semibold rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 flex items-center justify-center gap-2"
                                    >
                                        <span>Notify Me</span>
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <FeatureCard
                                delay="500ms"
                                icon={<Bot size={24} className="text-primary-light" />}
                                title="AI-Powered Reminders"
                                description="Add reminders in plain English. Our AI understands dates, times, and context effortlessly."
                            />
                            <FeatureCard
                                delay="600ms"
                                icon={<Zap size={24} className="text-yellow-400" />}
                                title="Intelligent Actions"
                                description="Get smart suggestions for every reminder, from buying gifts to booking services, all in one place."
                            />
                            <FeatureCard
                                delay="700ms"
                                icon={<Utensils size={24} className="text-orange-400" />}
                                title="Recipe Discovery"
                                description="Find daily meal plans, search by ingredients, and get groceries delivered."
                            />
                        </div>
                    </main>

                    <footer className="mt-16 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                        &copy; {new Date().getFullYear()} myreminder. All rights reserved.
                    </footer>
                </div>
            </div>
        </>
    );
};

export default ComingSoonPage;