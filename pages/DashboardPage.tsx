
import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { analyzeReminder } from '../services/geminiService';
import ReminderCard from '../components/ReminderCard';
import ChatInput from '../components/ChatInput';
import Toast from '../components/Toast';
import EditReminderModal from '../components/EditReminderModal';
import CompletionPromptModal from '../components/CompletionPromptModal';
import VendorModal from '../components/VendorModal';
import { Reminder, VendorProductCartItem, CartItemType } from '../types';
import { ChevronLeft, ChevronRight, Zap, PlusCircle, XCircle, Calendar, Mail, Facebook, Instagram } from 'lucide-react';
import { INITIAL_SUGGESTIONS } from '../constants';
import { NavLink } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const { reminders, addReminder, addToCart, deleteReminder, updateReminder, completeReminder, reminderTypes, addReminderType } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [completionCandidate, setCompletionCandidate] = useState<Reminder | null>(null);
    const [vendorModal, setVendorModal] = useState<{
        isOpen: boolean;
        vendor: string;
        productQuery?: string;
        reminderContext?: { id: string, title: string };
    }>({ isOpen: false, vendor: '' });
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS.map(s => ({...s, id: `sug-${Math.random()}`})));
    
    const activeReminders = reminders.filter(r => !r.isCompleted);

    const remindersByDate = useMemo(() => {
        const map = new Map<string, Reminder[]>();
        reminders.forEach(reminder => {
            const key = reminder.date.toISOString().split('T')[0];
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(reminder);
        });
        return map;
    }, [reminders]);

    const handleNewReminder = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const newReminderData = await analyzeReminder(prompt);
            if (newReminderData.type && !reminderTypes.some(t => t.toLowerCase() === newReminderData.type.toLowerCase())) {
                addReminderType(newReminderData.type);
            }
            const reminder = { ...newReminderData, id: `rem-${Date.now()}` };
            addReminder(reminder);
            setToast({ message: "Reminder created successfully!", type: 'success' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            setToast({ message: `Error: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [addReminder, addReminderType, reminderTypes]);

    const handleVendorSelect = (vendor: string, productQuery: string, reminder: Reminder) => {
        setVendorModal({ 
            isOpen: true, 
            vendor, 
            productQuery,
            reminderContext: { id: reminder.id, title: reminder.title },
        });
    };

    const handleAddToCartFromVendor = (item: Omit<VendorProductCartItem, 'id' | 'type'>) => {
        const newCartItem: VendorProductCartItem = {
            ...item,
            id: `vendor-${item.vendor}-${Date.now()}`,
            type: CartItemType.VENDOR_PRODUCT,
            reminderId: vendorModal.reminderContext?.id,
            reminderTitle: vendorModal.reminderContext?.title,
        };
        addToCart(newCartItem);
        setToast({ message: `${item.productName} added to cart!`, type: 'success' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this reminder?")) {
            deleteReminder(id);
            setToast({ message: "Reminder deleted.", type: 'success' });
        }
    };
    
    const handleSnooze = (id: string, days: number) => {
        const reminder = reminders.find(r => r.id === id);
        if(reminder) {
            const newDate = new Date(reminder.date);
            newDate.setDate(newDate.getDate() + days);
            updateReminder(id, { date: newDate });
            setToast({ message: "Reminder snoozed for 1 day.", type: 'success' });
        }
    };
    
    const handleUpdateReminder = (id: string, updates: Partial<Reminder>) => {
        if (updates.type && !reminderTypes.some(t => t.toLowerCase() === updates.type!.toLowerCase())) {
            addReminderType(updates.type);
        }
        updateReminder(id, updates);
        setEditingReminder(null);
        setToast({ message: "Reminder updated successfully!", type: 'success' });
    };

    const handleComplete = (reminder: Reminder) => {
        if (reminder.recurrenceRule) {
            completeReminder(reminder.id);
            setToast({ message: `'${reminder.title}' completed and rescheduled.`, type: 'success' });
        } else {
            setCompletionCandidate(reminder);
        }
    };

    const handleConfirmCompletion = () => {
        if (completionCandidate) {
            completeReminder(completionCandidate.id);
            setToast({ message: `'${completionCandidate.title}' marked as complete.`, type: 'success' });
            setCompletionCandidate(null);
        }
    };

    const handleConfirmAndEdit = () => {
         if (completionCandidate) {
            setEditingReminder(completionCandidate);
            setCompletionCandidate(null);
        }
    };

    const handleDateChange = (amount: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    const handleAddSuggestion = (suggestion: Omit<Reminder, 'id'>) => {
        const newReminder: Reminder = { ...suggestion, id: `rem-${Date.now()}` };
        addReminder(newReminder);
        setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
        setToast({ message: 'Reminder added from suggestion!', type: 'success' });
    };
    
    const handleDismissSuggestion = (id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setToast({ message: 'Suggestion dismissed.', type: 'success' });
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(<div key={`pad-prev-${i}`} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"></div>);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const dayReminders = remindersByDate.get(dateKey) || [];
            const isToday = date.toDateString() === new Date().toDateString();
            
            days.push(
                <div key={dateKey} className="border-r border-b border-gray-200 dark:border-slate-700 p-2 min-h-28 relative">
                    <span className={`font-semibold ${isToday ? 'bg-primary text-white rounded-full flex items-center justify-center w-7 h-7' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                        {dayReminders.map(r => (
                            <div key={r.id} onClick={() => setEditingReminder(r)} className={`text-xs p-1 rounded-md cursor-pointer truncate ${r.isCompleted ? 'bg-green-100 dark:bg-green-900/50 line-through text-gray-500' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                                {r.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        const remainingCells = 7 - (days.length % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                days.push(<div key={`pad-next-${i}`} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"></div>);
            }
        }

        return (
             <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                    <div key={dayName} className="text-center font-bold p-2 border-b border-r border-gray-200 dark:border-slate-700">{dayName}</div>
                ))}
                {days}
            </div>
        );
    };


    return (
        <div className="container mx-auto">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
             {editingReminder && (
                <EditReminderModal
                    reminder={editingReminder}
                    onClose={() => setEditingReminder(null)}
                    onSave={handleUpdateReminder}
                />
             )}
             {completionCandidate && (
                <CompletionPromptModal
                    isOpen={!!completionCandidate}
                    onClose={() => setCompletionCandidate(null)}
                    reminderTitle={completionCandidate.title}
                    onConfirmCompletion={handleConfirmCompletion}
                    onConfirmAndEdit={handleConfirmAndEdit}
                />
             )}
             {vendorModal.isOpen && (
                <VendorModal
                    isOpen={vendorModal.isOpen}
                    onClose={() => setVendorModal({isOpen: false, vendor: ''})}
                    vendor={vendorModal.vendor}
                    productQuery={vendorModal.productQuery}
                    onAddToCart={handleAddToCartFromVendor}
                />
            )}
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Here's your daily overview. Add a reminder below.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Calendar View */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                         <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Today</button>
                            <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronLeft/></button>
                            <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronRight/></button>
                         </div>
                    </div>
                    {renderMonthView()}
                </div>
                 {/* AI Suggestions View */}
                <div className="lg:col-span-1">
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 h-full">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Zap size={22} className="mr-2 text-yellow-500"/>
                            Suggested New Reminders
                        </h2>
                        {suggestions.length > 0 ? (
                            <div className="space-y-3">
                            {suggestions.map(sug => (
                                <div key={sug.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{sug.title} <span className="text-xs font-normal text-gray-500">on {sug.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sug.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleAddSuggestion(sug)} title="Add Reminder" className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full">
                                            <PlusCircle size={18}/>
                                        </button>
                                        <button onClick={() => handleDismissSuggestion(sug.id)} title="Dismiss" className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <XCircle size={18}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No new suggestions from your connected accounts.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="my-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 grid grid-cols-4 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full" title="Google Calendar"><Calendar className="w-6 h-6 text-blue-500" /></div>
                        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/50 rounded-full" title="Outlook Calendar"><Mail className="w-6 h-6 text-cyan-500" /></div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full" title="Facebook Events"><Facebook className="w-6 h-6 text-indigo-600" /></div>
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-full" title="Instagram"><Instagram className="w-6 h-6 text-pink-500" /></div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-semibold mb-2">Get the Full Picture</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Connect your Google, Outlook, and social media calendars to see all your events in one place and receive smarter AI suggestions.
                        </p>
                        <NavLink to="/settings" className="inline-block bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-dark transition-colors">
                            Connect Accounts
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                 <ChatInput onNewReminder={handleNewReminder} isLoading={isLoading} />
                 {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold mb-4">Your Upcoming Reminders</h2>
                {activeReminders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeReminders.map(reminder => (
                            <ReminderCard 
                                key={reminder.id} 
                                reminder={reminder} 
                                onVendorSelect={handleVendorSelect}
                                onEdit={setEditingReminder}
                                onDelete={handleDelete}
                                onSnooze={handleSnooze}
                                onComplete={handleComplete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400">You have no upcoming reminders. Try adding one with AI!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
