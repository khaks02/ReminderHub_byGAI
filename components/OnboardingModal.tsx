
import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../hooks/useAuthContext';
import { Bot, Zap, Utensils, Settings, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onFinish: () => void;
}

const steps = [
    {
        icon: <img src="https://api.dicebear.com/8.x/bottts-neutral/svg?seed=ReminderHub" alt="App Mascot" className="w-24 h-24 mx-auto mb-4" />,
        title: "Welcome to ReminderHub AI!",
        description: "Let's take a quick tour to see how you can supercharge your productivity."
    },
    {
        icon: <Bot size={64} className="text-primary" />,
        title: "AI-Powered Reminders",
        description: "Add reminders using everyday language. Just type 'Call mom tomorrow at 7pm' and let our AI handle the scheduling and details."
    },
    {
        icon: <Zap size={64} className="text-yellow-500" />,
        title: "Intelligent Actions",
        description: "Every reminder is a starting point. Expand it to discover AI-powered actions like finding gifts, booking services, or getting recipe ideas."
    },
    {
        icon: <Utensils size={64} className="text-orange-500" />,
        title: "Recipe Discovery",
        description: "Explore daily meal plans, search for any dish, get ingredients, or even order it online, all from the 'Today's Recipes' page."
    },
    {
        icon: <Settings size={64} className="text-slate-500" />,
        title: "Personalize Your Experience",
        description: "Make the app yours. Connect your calendars, set dietary preferences, and manage your profile in the Settings."
    },
    {
        icon: <CheckCircle size={64} className="text-green-500" />,
        title: "You're All Set!",
        description: "You're ready to explore. Enjoy your smarter, more organized day with ReminderHub AI."
    }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinish }) => {
    const { currentUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    // Replace placeholder with the user's name if available.
    const title = steps[currentStep].title.replace("!", `, ${currentUser?.name || 'User'}!`);

    return (
        <Modal isOpen={isOpen} onClose={onFinish} title="Quick Start Guide" maxWidth="md">
            <div className="text-center p-4">
                <div className="flex items-center justify-center h-24 mb-6">
                    {steps[currentStep].icon}
                </div>
                <h2 className="text-2xl font-bold mb-3">{title}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8 min-h-[40px]">
                    {steps[currentStep].description}
                </p>

                {/* Progress Dots */}
                <div className="flex justify-center items-center gap-2 mb-8">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${currentStep === index ? 'bg-primary scale-125' : 'bg-slate-300 dark:bg-slate-600'}`}
                        />
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600 font-semibold transition-colors hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-semibold transition-colors hover:bg-primary-dark"
                    >
                        {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
