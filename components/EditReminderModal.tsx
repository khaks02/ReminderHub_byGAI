import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Reminder, RecurrenceRule } from '../types';
import Modal from './Modal';
import { useAppContext } from '../hooks/useAppContext';
import { Tag, Calendar, MessageSquare, Repeat, Hash, ChevronDown, Check } from 'lucide-react';

interface ReminderFormModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData: Partial<Reminder>;
    onClose: () => void;
    onSave: (data: Partial<Reminder>) => void;
}

const InputField = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
        </div>
        {children}
    </div>
);

const RecurrenceButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
    >
        {label}
    </button>
);

const EditReminderModal: React.FC<ReminderFormModalProps> = ({ isOpen, mode, initialData, onClose, onSave }) => {
    const { reminderTypes } = useAppContext();
    const [formData, setFormData] = useState<Partial<Reminder>>({});
    const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
    const [errors, setErrors] = useState<{ title?: string, date?: string }>({});
    
    useEffect(() => {
        setFormData(initialData);
        if (initialData.recurrenceRule && initialData.recurrenceRule.interval > 1) {
            setShowCustomRecurrence(true);
        } else {
            setShowCustomRecurrence(false);
        }
    }, [initialData, isOpen]);
    
    const validate = () => {
        const newErrors: { title?: string, date?: string } = {};
        if (!formData.title?.trim()) {
            newErrors.title = "Title is required.";
        }
        if (!formData.date) {
            newErrors.date = "Date is required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, date: e.target.value ? new Date(e.target.value) : undefined }))
    };

    const handleRecurrenceChange = (rule: RecurrenceRule | null) => {
        setFormData(prev => ({ ...prev, recurrenceRule: rule }));
    };

    const handleCustomRecurrenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const currentRule = formData.recurrenceRule || { frequency: 'WEEKLY', interval: 1 };
        handleRecurrenceChange({
            ...currentRule,
            [name]: name === 'interval' ? Math.max(1, parseInt(value, 10) || 1) : value,
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };
    
    const toLocalISOString = (date: Date) => {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, -1);
        return localISOTime.substring(0, 16);
    };
    
    const activeRecurrence = useMemo(() => {
        if (!formData.recurrenceRule) return 'none';
        if (showCustomRecurrence || formData.recurrenceRule.interval > 1) return 'custom';
        return formData.recurrenceRule.frequency.toLowerCase();
    }, [formData.recurrenceRule, showCustomRecurrence]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Reminder' : 'Create New Reminder'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <InputField icon={<Tag size={16} />}>
                        <input type="text" name="title" placeholder="Title" value={formData.title || ''} onChange={handleInputChange} className="w-full input-style pl-9" />
                    </InputField>
                     {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                    <InputField icon={<MessageSquare size={16} />}>
                        <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full input-style pl-9" rows={3}></textarea>
                    </InputField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <InputField icon={<Calendar size={16} />}>
                            <input type="datetime-local" name="date" value={formData.date ? toLocalISOString(formData.date) : ''} onChange={handleDateChange} className="w-full input-style pl-9" />
                        </InputField>
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>
                     <div>
                        <InputField icon={<Check size={16} />}>
                             <input
                                type="text"
                                name="type"
                                list="reminder-types"
                                placeholder="Type (e.g., Birthday)"
                                value={formData.type || ''}
                                onChange={handleInputChange}
                                className="w-full input-style pl-9"
                            />
                            <datalist id="reminder-types">
                                {reminderTypes.map(type => <option key={type} value={type} />)}
                            </datalist>
                        </InputField>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Recurrence</label>
                    <div className="flex flex-wrap items-center gap-2">
                        <RecurrenceButton label="None" isActive={activeRecurrence === 'none'} onClick={() => { handleRecurrenceChange(null); setShowCustomRecurrence(false); }} />
                        <RecurrenceButton label="Daily" isActive={activeRecurrence === 'daily'} onClick={() => { handleRecurrenceChange({ frequency: 'DAILY', interval: 1 }); setShowCustomRecurrence(false); }} />
                        <RecurrenceButton label="Weekly" isActive={activeRecurrence === 'weekly'} onClick={() => { handleRecurrenceChange({ frequency: 'WEEKLY', interval: 1 }); setShowCustomRecurrence(false); }} />
                        <RecurrenceButton label="Monthly" isActive={activeRecurrence === 'monthly'} onClick={() => { handleRecurrenceChange({ frequency: 'MONTHLY', interval: 1 }); setShowCustomRecurrence(false); }} />
                        <RecurrenceButton label="Yearly" isActive={activeRecurrence === 'yearly'} onClick={() => { handleRecurrenceChange({ frequency: 'YEARLY', interval: 1 }); setShowCustomRecurrence(false); }} />
                        <RecurrenceButton label="Custom" isActive={activeRecurrence === 'custom'} onClick={() => setShowCustomRecurrence(true)} />
                    </div>
                    {showCustomRecurrence && (
                        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center gap-3 animate-fade-in-up">
                            <span className="font-semibold">Repeat every</span>
                            <input 
                                type="number"
                                name="interval"
                                value={formData.recurrenceRule?.interval || 1}
                                onChange={handleCustomRecurrenceChange}
                                className="w-20 input-style text-center"
                                min="1"
                            />
                            <select name="frequency" value={formData.recurrenceRule?.frequency || 'WEEKLY'} onChange={handleCustomRecurrenceChange} className="input-style">
                                <option value="DAILY">Day(s)</option>
                                <option value="WEEKLY">Week(s)</option>
                                <option value="MONTHLY">Month(s)</option>
                                <option value="YEARLY">Year(s)</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark font-semibold">{mode === 'edit' ? 'Save Changes' : 'Create Reminder'}</button>
                </div>
            </form>
             <style>{`
                .input-style {
                    background-color: white;
                    border: 1px solid #D1D5DB; /* gray-300 */
                    border-radius: 0.5rem; /* rounded-md */
                    padding: 0.75rem 1rem;
                    color: #111827; /* gray-900 */
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input-style:focus {
                    outline: none;
                    border-color: hsl(210, 40%, 50%);
                    box-shadow: 0 0 0 2px hsla(210, 40%, 50%, 0.2);
                }
                .dark .input-style {
                    background-color: #334155; /* slate-700 */
                    border-color: #475569; /* slate-600 */
                    color: #F8FAFC; /* slate-50 */
                }
                .dark .input-style:focus {
                     border-color: hsl(210, 40%, 60%);
                     box-shadow: 0 0 0 2px hsla(210, 40%, 60%, 0.2);
                }
                .dark .input-style::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                }
            `}</style>
        </Modal>
    );
};

export default EditReminderModal;