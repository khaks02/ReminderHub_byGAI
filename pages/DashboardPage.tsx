

import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { analyzeReminder, getHolidays } from '../services/geminiService';
import ReminderCard from '../components/ReminderCard';
import ChatInput from '../components/ChatInput';
import Toast from '../components/Toast';
import EditReminderModal from '../components/EditReminderModal';
import CompletionPromptModal from '../components/CompletionPromptModal';
import VendorModal from '../components/VendorModal';
import HolidayImportModal from '../components/HolidayImportModal';
import { Reminder, VendorProductCartItem, CartItemType, VendorSuggestion } from '../types';
import { ChevronLeft, ChevronRight, Zap, PlusCircle, XCircle, Calendar, Mail, Facebook, Instagram, DownloadCloud } from 'lucide-react';
import { INITIAL_SUGGESTIONS } from '../constants';
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink } = ReactRouterDOM;

// Helper to get a consistent YYYY-MM-DD key from a date, respecting local timezone.
const toDateKey = (date: Date) => date.toLocaleDateString('en-CA');

const DashboardPage: React.FC = () => {
    const { reminders, addReminder, addToCart, deleteReminder, updateReminder, completeReminder, reminderTypes, addReminderType, addHolidaysBatch } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reminderModalState, setReminderModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        initialData: Partial<Reminder>;
    }>({ isOpen: false, mode: 'create', initialData: {} });
    const [completionCandidate, setCompletionCandidate] = useState<Reminder | null>(null);
    const [vendorModal, setVendorModal] = useState<{
        isOpen: boolean;
        vendorSuggestion: VendorSuggestion | null;
        reminderContext?: { id: string, title: string };
    }>({ isOpen: false, vendorSuggestion: null });
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS.map(s => ({...s, id: `sug-${Math.random()}`})));
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    
    const remindersByDate = useMemo(() => {
        const map = new Map<string, Reminder[]>();
        reminders.forEach(reminder => {
            if (reminder.date) {
                const key = toDateKey(new Date(reminder.date));
                if (!map.has(key)) {
                    map.set(key, []);
                }
                map.get(key)!.push(reminder);
            }
        });
        return map;
    }, [reminders]);

    const remindersForSelectedDay = useMemo(() => {
        const key = toDateKey(selectedDate);
        return (remindersByDate.get(key) || []).filter(r => !r.isCompleted);
    }, [selectedDate, remindersByDate]);


    const handleNewReminder = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const newReminderData = await analyzeReminder(prompt);
            
            if (!newReminderData.title || !newReminderData.date) {
                setReminderModalState({
                    isOpen: true,
                    mode: 'create',
                    initialData: {
                        ...newReminderData,
                        description: newReminderData.description || (newReminderData.title ? '' : prompt),
                        title: newReminderData.title || ''
                    }
                });
            } else {
                if (newReminderData.type && !reminderTypes.some(t => t.toLowerCase() === newReminderData.type.toLowerCase())) {
                    addReminderType(newReminderData.type);
                }
                const reminder = { ...newReminderData, id: `rem-${Date.now()}` } as Reminder;
                addReminder(reminder);
                setToast({ message: "Reminder created successfully!", type: 'success' });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            setToast({ message: `Error: ${errorMessage}`, type: 'error' });
            setReminderModalState({
                isOpen: true,
                mode: 'create',
                initialData: { title: prompt }
            });
        } finally {
            setIsLoading(false);
        }
    }, [addReminder, addReminderType, reminderTypes]);


    const handleVendorSelect = (vendor: VendorSuggestion, reminder: Reminder) => {
        setVendorModal({ 
            isOpen: true, 
            vendorSuggestion: vendor,
            reminderContext: { id: reminder.id, title: reminder.title },
        });
    };

    const handleAddToCartFromVendor = (item: Omit<VendorProductCartItem, 'id' | 'type' | 'customerCare'>) => {
        const newCartItem: VendorProductCartItem = {
            ...item,
            id: `vendor-${item.vendor}-${Date.now()}`,
            type: CartItemType.VENDOR_PRODUCT,
            reminderId: vendorModal.reminderContext?.id,
            reminderTitle: vendorModal.reminderContext?.title,
            customerCare: vendorModal.vendorSuggestion?.customerCare,
        };
        addToCart(newCartItem);
        setToast({ message: `${item.productName} added to cart!`, type: 'success' });
    };

    const handleDelete = (id: string) => {
        deleteReminder(id);
        setToast({ message: "Reminder deleted.", type: 'success' });
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
    
    const handleSaveReminder = (data: Partial<Reminder>) => {
        const { mode, initialData } = reminderModalState;

        if (data.type && !reminderTypes.some(t => t.toLowerCase() === data.type!.toLowerCase())) {
            addReminderType(data.type);
        }

        if (mode === 'edit' && initialData.id) {
            updateReminder(initialData.id, data);
            setToast({ message: "Reminder updated!", type: 'success' });
        } else {
            const newReminder: Reminder = {
                id: `rem-${Date.now()}`,
                title: data.title || 'Untitled Reminder',
                date: data.date || new Date(),
                type: data.type || 'General',
                description: data.description || '',
                recurrenceRule: data.recurrenceRule,
                isCompleted: false,
            };
            addReminder(newReminder);
            setToast({ message: "Reminder created!", type: 'success' });
        }
        
        setReminderModalState({ isOpen: false, mode: 'create', initialData: {} });
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
            setReminderModalState({ isOpen: true, mode: 'edit', initialData: completionCandidate });
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
    
    const handleImportHolidays = async (year: number, country: string, region: string) => {
        try {
            const holidays = await getHolidays(year, country, region);
            if (holidays.length === 0) {
                setToast({ message: `No holidays found for ${country}.`, type: 'error' });
                return;
            }
            const addedCount = addHolidaysBatch(holidays, country);
            setToast({ message: `Successfully imported ${addedCount} new holiday(s)!`, type: 'success' });
            
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
             setToast({ message: `Error: ${errorMessage}`, type: 'error' });
             // Re-throw to keep modal open and show error
             throw error;
        }
    };
    
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
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
            const dateKey = toDateKey(date);
            const dayReminders = remindersByDate.get(dateKey) || [];
            const isToday = dateKey === toDateKey(new Date());
            const isSelected = dateKey === toDateKey(selectedDate);
            
            days.push(
                <div 
                    key={dateKey} 
                    className={`border-r border-b border-gray-200 dark:border-slate-700 p-2 min-h-28 relative group transition-colors cursor-pointer ${isSelected ? 'ring-2 ring-primary/80 bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    onClick={() => {
                        setSelectedDate(date);
                        if (dayReminders.length === 0) {
                            setReminderModalState({
                                isOpen: true,
                                mode: 'create',
                                initialData: { date: date },
                            });
                        }
                    }}
                >
                    <span className={`font-semibold ${isToday ? 'bg-primary text-white rounded-full flex items-center justify-center w-7 h-7' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                        {dayReminders.map(r => (
                            <div 
                                key={r.id}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent cell's onClick from firing
                                    setReminderModalState({ isOpen: true, mode: 'edit', initialData: r });
                                }}
                                className={`text-xs p-1 rounded-md cursor-pointer truncate ${
                                    r.isCompleted ? 'bg-green-100 dark:bg-green-900/50 line-through text-gray-500' : 
                                    r.type === 'Holiday' ? 'bg-purple-100 dark:bg-purple-900/50' : 
                                    'bg-blue-100 dark:bg-blue-900/50'
                                }`}
                            >
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
             {isHolidayModalOpen && (
                 <HolidayImportModal
                    isOpen={isHolidayModalOpen}
                    onClose={() => setIsHolidayModalOpen(false)}
                    onImport={handleImportHolidays}
                 />
             )}
             {reminderModalState.isOpen && (
                <EditReminderModal
                    isOpen={reminderModalState.isOpen}
                    mode={reminderModalState.mode}
                    initialData={reminderModalState.initialData}
                    onClose={() => setReminderModalState({ ...reminderModalState, isOpen: false })}
                    onSave={handleSaveReminder}
                    onDelete={(id) => {
                        if (window.confirm("Are you sure?")) {
                            handleDelete(id);
                        }
                    }}
                    onComplete={handleComplete}
                    onSnooze={handleSnooze}
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
                    onClose={() => setVendorModal({isOpen: false, vendorSuggestion: null})}
                    vendorSuggestion={vendorModal.vendorSuggestion}
                    onAddToCart={handleAddToCartFromVendor}
                />
            )}
            <h1 className="text-3xl font-bold mb-2">Reminders</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Here's your daily overview. Add a reminder below.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Calendar View */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                         <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setIsHolidayModalOpen(true)} className="px-3 py-1 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                <DownloadCloud size={16} /> Import Holidays
                             </button>
                             <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-3 py-1 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Today</button>
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                        Reminders for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                     <button 
                        onClick={() => setReminderModalState({ isOpen: true, mode: 'create', initialData: { date: selectedDate }})}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                        <PlusCircle size={16} /> Add Reminder
                    </button>
                </div>

                {remindersForSelectedDay.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {remindersForSelectedDay.map(reminder => (
                            <ReminderCard 
                                key={reminder.id} 
                                reminder={reminder} 
                                onVendorSelect={handleVendorSelect}
                                onEdit={(r) => setReminderModalState({ isOpen: true, mode: 'edit', initialData: r })}
                                onDelete={handleDelete}
                                onSnooze={handleSnooze}
                                onComplete={handleComplete}
                                onShowToast={showToast}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">It's a quiet day... too quiet.</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Looks like there's nothing on the agenda. A perfect day to plan something amazing (or just relax)!</p>
                        <button 
                            onClick={() => setReminderModalState({ isOpen: true, mode: 'create', initialData: { date: selectedDate }})}
                            className="mt-4 inline-flex items-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-md hover:bg-primary-dark transition-colors"
                        >
                            <PlusCircle size={18}/>
                            Add a Reminder
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;