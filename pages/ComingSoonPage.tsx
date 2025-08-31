import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Zap, Bot, Utensils, Sparkles, Mail } from 'lucide-react';

const CountdownUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <span className="text-4xl md:text-6xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="text-xs md:text-sm uppercase tracking-widest">{label}</span>
    </div>
);

const Feature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-white/10 rounded-full">{icon}</div>
        <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-gray-300">{description}</p>
        </div>
    </div>
);

const ComingSoonPage: React.FC = () => {
    const calculateTimeLeft = () => {
        const launchDate = new Date();
        launchDate.setDate(launchDate.getDate() + 30); // Set launch 30 days from now
        const difference = +launchDate - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    // Admin login easter egg state
    const navigate = ReactRouterDOM.useNavigate();
    const [adminClickCount, setAdminClickCount] = useState(0);
    const adminClickTimer = useRef<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });
    
    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if(email) {
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

        adminClickTimer.current = window.setTimeout(() => {
            setAdminClickCount(0);
        }, 2000); // Reset after 2 seconds of inactivity
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
            <div className="w-full max-w-5xl mx-auto text-center">
                <header 
                    className="mb-8 cursor-pointer" 
                    onClick={handleAdminLoginClick}
                    title="Admin Access"
                    aria-label="Click 5 times for admin login"
                >
                    <h1 className="text-5xl md:text-7xl font-bold flex items-center justify-center gap-4">
                        <Sparkles className="text-primary-light" />
                        myreminder
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mt-4">Your life, intelligently organized.</p>
                </header>

                <main className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-8">We're launching soon!</h2>
                    
                    <div className="flex justify-center gap-4 md:gap-8 mb-12">
                        {timeLeft.days !== undefined ? (
                            <>
                                <CountdownUnit value={timeLeft.days} label="Days" />
                                <CountdownUnit value={timeLeft.hours} label="Hours" />
                                <CountdownUnit value={timeLeft.minutes} label="Minutes" />
                                <CountdownUnit value={timeLeft.seconds} label="Seconds" />
                            </>
                        ) : (
                            <span className="text-2xl font-bold">Time's up! Stay tuned!</span>
                        )}
                    </div>

                    <div className="p-8 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl mb-12">
                        <h3 className="text-2xl font-semibold mb-6">What's Coming?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <Feature 
                                icon={<Bot size={24} className="text-primary-light" />}
                                title="AI-Powered Reminders"
                                description="Add reminders in plain English. Our AI understands dates, times, and context effortlessly."
                            />
                            <Feature 
                                icon={<Zap size={24} className="text-yellow-400" />}
                                title="Intelligent Actions"
                                description="Get smart suggestions for every reminder, from buying gifts to booking services, all in one place."
                            />
                            <Feature 
                                icon={<Utensils size={24} className="text-orange-400" />}
                                title="Recipe Discovery"
                                description="Find daily meal plans, search for recipes by ingredients, and get groceries delivered."
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Be the first to know when we launch!</h3>
                        {subscribed ? (
                             <p className="text-green-400 font-semibold text-lg animate-fade-in-up">Thank you! We'll notify you at launch.</p>
                        ) : (
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-lg mx-auto">
                                <div className="relative w-full">
                                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                     <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-primary font-semibold rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0">
                                    Notify Me
                                </button>
                            </form>
                        )}
                    </div>
                </main>

                <footer className="text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} myreminder. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default ComingSoonPage;