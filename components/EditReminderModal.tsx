import React, { useState, useEffect, useRef } from 'react';
import { Reminder } from '../types';
import Modal from './Modal';
import { useAppContext } from '../hooks/useAppContext';

interface EditReminderModalProps {
    reminder: Reminder;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Reminder>) => void;
}

const EditReminderModal: React.FC<EditReminderModalProps> = ({ reminder, onClose, onSave }) => {
    const { reminderTypes } = useAppContext();
    const [formData, setFormData] = useState<Partial<Reminder>>({ ...reminder });
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const typeInputContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setFormData({ ...reminder });
    }, [reminder]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeInputContainerRef.current && !typeInputContainerRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isTypeDropdownOpen) setIsTypeDropdownOpen(true);
        if (!hasTyped) setHasTyped(true);
        handleInputChange(e);
    };

    const handleTypeInputFocus = () => {
        setIsTypeDropdownOpen(true);
        setHasTyped(false);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, date: new Date(e.target.value)}))
    };
    
    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        const currentRule = formData.recurrenceRule || { frequency: 'WEEKLY', interval: 1 };
        
        if (name === 'frequency' && value === 'NONE') {
            const { recurrenceRule, ...rest } = formData;
            setFormData({ ...rest, recurrenceRule: null });
            return;
        }

        setFormData(prev => ({
            ...prev,
            recurrenceRule: {
                ...currentRule,
                [name]: name === 'interval' ? parseInt(value, 10) : value,
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(reminder.id, formData);
    };

    const toLocalISOString = (date: Date) => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
        return localISOTime.substring(0, 16);
    };
    
    const filterText = hasTyped ? (formData.type || '') : '';
    const filteredTypes = reminderTypes.filter(type =>
          type.toLowerCase().includes(filterText.toLowerCase())
      );

    return (
        <Modal isOpen={true} onClose={onClose} title="Edit Reminder">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium">Title</label>
                    <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleInputChange} className="mt-1 w-full input-style" />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium">Description</label>
                    <textarea name="description" id="description" value={formData.description || ''} onChange={handleInputChange} className="mt-1 w-full input-style" rows={3}></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium">Date & Time</label>
                        <input type="datetime-local" name="date" id="date" value={formData.date ? toLocalISOString(formData.date) : ''} onChange={handleDateChange} className="mt-1 w-full input-style" />
                    </div>
                     <div className="relative" ref={typeInputContainerRef}>
                        <label htmlFor="type" className="block text-sm font-medium">Type</label>
                        <input
                            type="text"
                            name="type"
                            id="type"
                            value={formData.type || ''}
                            onChange={handleTypeInputChange}
                            onFocus={handleTypeInputFocus}
                            placeholder="e.g., Birthday or add new"
                            autoComplete="off"
                            className="mt-1 w-full input-style"
                        />
                         {isTypeDropdownOpen && (
                            <div className="absolute z-20 w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {filteredTypes.length > 0 ? (
                                    filteredTypes.map(type => (
                                        <div
                                            key={type}
                                            className="px-4 py-2 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20"
                                            onClick={() => {
                                                handleInputChange({ target: { name: 'type', value: type } } as any);
                                                setIsTypeDropdownOpen(false);
                                            }}
                                        >
                                            {type}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-gray-500">No matches found. Type to add.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Recurrence</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                        <select name="frequency" value={formData.recurrenceRule?.frequency || 'NONE'} onChange={handleRecurrenceChange} className="w-full input-style">
                            <option value="NONE">Does not repeat</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                        {formData.recurrenceRule && (
                             <input 
                                type="number"
                                name="interval"
                                value={formData.recurrenceRule.interval || 1}
                                onChange={handleRecurrenceChange}
                                className="w-full input-style"
                                min="1"
                             />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">Save Changes</button>
                </div>
            </form>
             <style>{`
                .input-style {
                    background-color: white;
                    border: 1px solid #D1D5DB; /* gray-300 */
                    border-radius: 0.375rem; /* rounded-md */
                    padding: 0.5rem 0.75rem;
                    color: #111827; /* gray-900 */
                }
                .dark .input-style {
                    background-color: #1E293B; /* slate-800 */
                    border-color: #475569; /* slate-600 */
                    color: #F8FAFC; /* slate-50 */
                }
                /* For date picker icon */
                .dark .input-style::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                }
            `}</style>
        </Modal>
    );
};

export default EditReminderModal;