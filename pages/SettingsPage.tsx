
import React, { useState } from 'react';
import { Calendar, Mail, Facebook, Instagram, Inbox, MessageSquare } from 'lucide-react';

// A simple MessageCircle icon to represent generic chat apps like WhatsApp
const MessageCircle = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);


const ServiceButton = ({ icon, name, isConnected, onToggle }: { icon: React.ReactNode; name: string, isConnected: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center">
            {icon}
            <span className="ml-4 font-medium">{name}</span>
        </div>
        <button 
            onClick={onToggle}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${isConnected ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'}`}
        >
            {isConnected ? 'Disconnect' : 'Connect'}
        </button>
    </div>
);


const SettingsPage: React.FC = () => {
    const [connections, setConnections] = useState({
        google: true,
        outlook: false,
        facebook: false,
        instagram: false,
        email: true,
        sms: false,
        whatsapp: false,
    });

    const toggleConnection = (service: keyof typeof connections) => {
        setConnections(prev => ({...prev, [service]: !prev[service]}));
    };

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your connected accounts and preferences.</p>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Connect Calendars &amp; Events</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sync events from your favorite services for a unified calendar view.</p>
                <div className="space-y-4">
                    <ServiceButton 
                        icon={<Calendar className="text-blue-500" />} 
                        name="Google Calendar"
                        isConnected={connections.google}
                        onToggle={() => toggleConnection('google')}
                    />
                    <ServiceButton 
                        icon={<Mail className="text-cyan-500" />} 
                        name="Outlook Calendar"
                        isConnected={connections.outlook}
                        onToggle={() => toggleConnection('outlook')}
                    />
                    <ServiceButton 
                        icon={<Facebook className="text-blue-600" />} 
                        name="Facebook Events"
                        isConnected={connections.facebook}
                        onToggle={() => toggleConnection('facebook')}
                    />
                    <ServiceButton 
                        icon={<Instagram className="text-pink-500" />} 
                        name="Instagram"
                        isConnected={connections.instagram}
                        onToggle={() => toggleConnection('instagram')}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Connect Other Sources for AI Suggestions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Allow our AI to ethically scan for potential reminders from your emails and messages for things like bills, receipts, and recurring deliveries.</p>
                <div className="space-y-4">
                    <ServiceButton 
                        icon={<Inbox className="text-red-500" />} 
                        name="Email Inbox"
                        isConnected={connections.email}
                        onToggle={() => toggleConnection('email')}
                    />
                    <ServiceButton 
                        icon={<MessageSquare className="text-green-500" />} 
                        name="Phone SMS"
                        isConnected={connections.sms}
                        onToggle={() => toggleConnection('sms')}
                    />
                     <ServiceButton 
                        icon={<MessageCircle className="text-teal-500" />} 
                        name="WhatsApp"
                        isConnected={connections.whatsapp}
                        onToggle={() => toggleConnection('whatsapp')}
                    />
                </div>
            </div>

             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">API Keys</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400">API keys are managed via secure environment variables and are not user-configurable here.</p>
            </div>
        </div>
    );
};

export default SettingsPage;
