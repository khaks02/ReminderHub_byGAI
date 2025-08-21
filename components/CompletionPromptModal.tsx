import React from 'react';
import Modal from './Modal';

interface CompletionPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    reminderTitle: string;
    onConfirmCompletion: () => void;
    onConfirmAndEdit: () => void;
}

const CompletionPromptModal: React.FC<CompletionPromptModalProps> = ({ isOpen, onClose, reminderTitle, onConfirmCompletion, onConfirmAndEdit }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Reminder">
            <div className="text-center">
                <p className="text-lg mb-2">You've completed:</p>
                <p className="font-bold text-xl mb-6">"{reminderTitle}"</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Would you like to schedule this reminder again for a future date?
                </p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={onConfirmCompletion} 
                        className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition"
                    >
                        Just Complete
                    </button>
                    <button 
                        onClick={onConfirmAndEdit} 
                        className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
                    >
                        Schedule Again
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CompletionPromptModal;