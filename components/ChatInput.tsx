
import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';

interface ChatInputProps {
    onNewReminder: (prompt: string) => Promise<void>;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onNewReminder, isLoading }) => {
    const [input, setInput] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        await onNewReminder(input);
        setInput('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            <label htmlFor="ai-reminder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add a new reminder with AI
            </label>
            <div className="relative">
                <input
                    id="ai-reminder"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 'Remind me to call mom tomorrow evening'"
                    className="w-full pl-4 pr-12 py-3 rounded-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:outline-none transition"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-white bg-primary rounded-r-full hover:bg-primary-dark transition-colors disabled:bg-gray-400"
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? <Loader className="animate-spin" /> : <Send />}
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
