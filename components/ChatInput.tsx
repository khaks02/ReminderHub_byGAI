

import React, { useState } from 'react';
import { Loader, Plus } from 'lucide-react';

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
        <form onSubmit={handleSubmit} className="relative group">
            <input
                id="ai-reminder"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add a reminder... (e.g., call mom tomorrow)"
                className="w-full pl-4 pr-12 py-2.5 rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:outline-none transition placeholder:text-sm"
                disabled={isLoading}
            />
            <button
                type="submit"
                className="absolute inset-y-0 right-1.5 my-1.5 flex items-center justify-center w-9 h-9 text-white bg-primary rounded-full hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 disabled:scale-100 group-focus-within:scale-105 group-focus-within:shadow-lg group-focus-within:shadow-primary/50 hover:scale-110 active:scale-95"
                disabled={isLoading || !input.trim()}
                aria-label="Add Reminder"
            >
                {isLoading ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
        </form>
    );
};

export default ChatInput;