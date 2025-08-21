import React from 'react';
import Modal from './Modal';

const btnPrimary = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark font-semibold transition-colors";
const btnSecondary = "inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-600 text-content-light dark:text-content-dark hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold transition-colors";


const CompletionPromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    reminderTitle: string;
    onConfirmCompletion: () => void;
    onConfirmAndEdit: () => void;
}> = ({ isOpen, onClose, reminderTitle, onConfirmCompletion, onConfirmAndEdit }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Complete Reminder" maxWidth="md">
            <div className="text-center">
                <p className="text-lg mb-2">You've completed:</p>
                <p className="font-bold text-xl mb-6 text-primary dark:text-primary-light">"{reminderTitle}"</p>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Would you like to schedule this reminder again for a future date?
                </p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={onConfirmCompletion} 
                        className={btnSecondary}
                    >
                        Just Complete
                    </button>
                    <button 
                        onClick={onConfirmAndEdit} 
                        className={btnPrimary}
                    >
                        Schedule Again
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CompletionPromptModal;