import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../hooks/useAuthContext';
import { analyzeReminder, getHolidays, getDashboardSuggestions } from '../services/geminiService';
import ReminderCard from '../components/ReminderCard';
import ChatInput from '../components/ChatInput';
import Toast from '../components/Toast';
import EditReminderModal from '../components/EditReminderModal';
import CompletionPromptModal from '../components/CompletionPromptModal';
import VendorModal from '../components/VendorModal';
import HolidayImportModal from '../components/HolidayImportModal';
import { Reminder, VendorProductCartItem, CartItemType, VendorSuggestion } from '../types';
import { ChevronLeft, ChevronRight, Zap, PlusCircle, XCircle, Calendar, DownloadCloud, Utensils, ShoppingCart, Plus } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import Spinner from '../components/Spinner';

// Helper to get a consistent YYYY-MM-DD key from a date, respecting local timezone.
const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DashboardPage: React.FC = () => {
    const { reminders, addReminder, addToCart, deleteReminder, updateReminder, completeReminder, reminderTypes, addReminderType, addHolidaysBatch, cartCount } = useAppContext();
    const { currentUser } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();
    const [isLoading, setIsLoading] = useState(false);
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
    const [dashboardAI, setDashboardAI] = useState<{suggestions: any[], dailyBriefing: string | null}>({ suggestions: [], dailyBriefing: null });
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    
    // State for animations and UI
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
    const [completingId, setCompletingId] = useState<string | null>(null);
    const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
    const prevRemindersRef = useRef<Reminder[]>(reminders);

    // Detect new reminders for animation
     useEffect(() => {
        if (prevRemindersRef.current.length < reminders.length) {
            const prevIds = new Set(prevRemindersRef.current.map(r => r.id));
            const newReminder = reminders.find(r => !prevIds.has(r.id));
            if (newReminder) {
                setNewlyAddedId(newReminder.id);
                const timer = setTimeout(() => setNewlyAddedId(null), 500); // Animation duration
                return () => clearTimeout(timer);
            }
        }
        prevRemindersRef.current = reminders;
    }, [reminders]);


    useEffect(() => {
        let isMounted = true;
        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                const { suggestions: newSuggestions, dailyBriefing } = await getDashboardSuggestions(reminders);
                if (isMounted) {
                    setDashboardAI({
                        suggestions: newSuggestions.map(s => ({...s, id: `sug-${Math.random()}`})),
                        dailyBriefing: dailyBriefing
                    });
                }
            } catch (e) {
                console.error("[DashboardPage] Failed to load AI suggestions:", e);
                if (isMounted) {
                    setToast({ message: "Could not load AI suggestions.", type: 'error' });
                }
            } finally {
                if (isMounted) {
                    setLoadingSuggestions(false);
                }
            }
        };
        fetchSuggestions();
        return () => { isMounted = false; };
    }, [reminders]);

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
        return (remindersByDate.get(key) || []).filter(r => !r.is_completed);
    }, [selectedDate, remindersByDate]);

    const handleNewReminder = useCallback(async (prompt: string) => {
        setIsLoading(true);
        try {
            const newReminderData = await analyzeReminder(prompt);
            
            setReminderModalState({
                isOpen: true,
                mode: 'create',
                initialData: {
                    ...newReminderData,
                    description: newReminderData.description || (newReminderData.title ? '' : prompt),
                    title: newReminderData.title || '',
                    date: newReminderData.date || selectedDate, // Pre-fill with selected date if AI doesn't find one
                }
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setToast({ message: `Error: ${errorMessage}`, type: 'error' });
            // Fallback: Open modal with just the original prompt in description
            setReminderModalState({
                isOpen: true,
                mode: 'create',
                initialData: { description: prompt, date: selectedDate }
            });
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);
    
    const handleOpenCreateModal = () => {
        setReminderModalState({
            isOpen: true,
            mode: 'create',
            initialData: { date: selectedDate }
        });
    };

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
    
    const handleSnooze = async (id: string, days: number) => {
        const reminder = reminders.find(r => r.id === id);
        if(reminder) {
            try {
                const newDate = new Date(reminder.date);
                newDate.setDate(newDate.getDate() + days);
                await updateReminder(id, { date: newDate });
                setToast({ message: "Reminder snoozed for 1 day.", type: 'success' });
            } catch (err) {
                setToast({ message: `Error snoozing reminder: ${err instanceof Error ? err.message : ''}`, type: 'error' });
            }
        }
    };
    
    const handleSaveReminder = async (data: Partial<Reminder>) => {
        const { mode, initialData } = reminderModalState;

        try {
            if (data.type && !reminderTypes.some(t => t.toLowerCase() === data.type!.toLowerCase())) {
                addReminderType(data.type);
            }

            if (mode === 'edit' && initialData.id) {
                await updateReminder(initialData.id, data);
                setToast({ message: "Reminder updated!", type: 'success' });
            } else {
                const newReminder: Omit<Reminder, 'id' | 'user_id'> = {
                    title: data.title || 'Untitled Reminder',
                    date: data.date || new Date(),
                    type: data.type || 'General',
                    description: data.description || '',
                    recurrence_rule: data.recurrence_rule,
                    is_completed: false,
                };
                await addReminder(newReminder);
                setToast({ message: "Reminder created!", type: 'success' });
            }
            
            setReminderModalState({ isOpen: false, mode: 'create', initialData: {} });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Could not save reminder. Please check the details and try again.";
            setToast({ message: `Failed to save reminder: ${errorMessage}`, type: 'error' });
        }
    };

    const handleStartCompleteAnimation = (reminder: Reminder) => {
        setCompletingId(reminder.id);
        setTimeout(() => {
            if (reminder.recurrence_rule) {
                completeReminder(reminder.id);
                setToast({ message: `'${reminder.title}' completed and rescheduled.`, type: 'success' });
            } else {
                setCompletionCandidate(reminder);
            }
            // The item will be removed from the list, so we don't need to reset completingId for it
        }, 400); // Corresponds to animation duration
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

    const handleAddSuggestion = async (suggestion: any) => {
        try {
            const { id, ...reminderData } = suggestion;
            await addReminder(reminderData);
            
            setDashboardAI(prev => ({ ...prev, suggestions: prev.suggestions.filter(s => s.id !== id) }));
            setToast({ message: 'Reminder added from suggestion!', type: 'success' });
        } catch (err) {
            setToast({ message: `Failed to add suggestion: ${err instanceof Error ? err.message : ''}`, type: 'error' });
        }
    };
    
    const handleDismissSuggestion = (id: string) => {
        setDashboardAI(prev => ({ ...prev, suggestions: prev.suggestions.filter(s => s.id !== id) }));
        setToast({ message: 'Suggestion dismissed.', type: 'success' });
    };
    
    const handleImportHolidays = async (year: number, country: string, region: string) => {
        try {
            const holidays = await getHolidays(year, country, region);
            if (holidays.length === 0) {
                setToast({ message: `No holidays found for ${country}.`, type: 'error' });
                return;
            }
            const addedCount = await addHolidaysBatch(holidays, country);
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

    const handleToggleExpansion = (reminderId: string) => {
        setExpandedReminderId(currentId => (currentId === reminderId ? null : reminderId));
    };
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const days = [];
        // Add padding for days from the previous month
        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            days.push(<div key={`pad-prev-${i}`} className="border-r border-b border-accent-light dark:border-accent-dark bg-gray-50 dark:bg-slate-800/50"></div>);
        }

        // Add days of the current month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateKey = toDateKey(date);
            const dayReminders = remindersByDate.get(dateKey) || [];
            const isToday = toDateKey(new Date()) === dateKey;
            const isSelected = toDateKey(selectedDate) === dateKey;
            
            days.push(
                <div 
                    key={dateKey} 
                    className={`border-r border-b border-accent-light dark:border-accent-dark p-2 min-h-[120px] relative group transition-colors cursor-pointer flex flex-col ${isSelected ? 'ring-2 ring-primary/80 bg-primary/10 dark:bg-primary/20' : 'hover:bg-subtle-light dark:hover:bg-subtle-dark'}`}
                    onClick={() => setSelectedDate(date)}
                >
                    <span className={`font-semibold text-sm ${isToday ? 'bg-primary text-white rounded-full flex items-center justify-center w-6 h-6' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto flex-grow">
                        {dayReminders.slice(0, 3).map(r => (
                            <div 
                                key={r.id}
                                className={`text-xs p-1 rounded-md cursor-pointer truncate ${
                                    r.is_completed ? 'bg-green-100 dark:bg-green-900/50 line-through text-gray-500' : 
                                    r.type === 'Holiday' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200' : 
                                    'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                                }`}
                            >
                                {r.title}
                            </div>
                        ))}
                         {dayReminders.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">
                                +{dayReminders.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        // Add padding for days from the next month to complete the grid
        const totalCells = days.length;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            days.push(<div key={`pad-next-${i}`} className="border-r border-b border-accent-light dark:border-accent-dark bg-gray-50 dark:bg-slate-800/50"></div>);
        }

        return (
             <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                    <div key={dayName} className="text-center font-bold p-2 border-b border-r border-accent-light dark:border-accent-dark text-sm">{dayName}</div>
                ))}
                {days}
            </div>
        );
    };

    const QuickActionButton = ({ icon, label, onClick, badge }: { icon: React.ReactNode, label: string, onClick: () => void, badge?: number }) => (
        <button onClick={onClick} className="relative flex flex-col items-center justify-center gap-2 p-4 w-full h-24 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-primary dark:hover:border-primary transition-all duration-200 card-lift">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">{icon}</div>
            <span className="text-sm font-semibold">{label}</span>
            {badge && badge > 0 && (
                <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{badge}</span>
            )}
        </button>
    );

    return (
        <div className="container mx-auto p-4 md:p-8 pb-24 md:pb-8">
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
                    onDelete={(id) => handleDelete(id)}
                    onComplete={handleStartCompleteAnimation}
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
            
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-content-light dark:text-content-dark">{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'User'}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton icon={<Plus size={20}/>} label="Add Reminder" onClick={handleOpenCreateModal} />
                <QuickActionButton icon={<Utensils size={20}/>} label="Find Recipes" onClick={() => navigate('/recipes')} />
                <QuickActionButton icon={<DownloadCloud size={20}/>} label="Import Holidays" onClick={() => setIsHolidayModalOpen(true)} />
                <QuickActionButton icon={<ShoppingCart size={20}/>} label="View Cart" onClick={() => navigate('/cart')} badge={cartCount} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-accent-dark card-lift">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-accent-dark">
                        <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-3 py-1 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Today</button>
                            <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronLeft/></button>
                            <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><ChevronRight/></button>
                        </div>
                    </div>
                    {renderMonthView()}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-subtle-light dark:bg-subtle-dark rounded-lg h-full flex flex-col card-lift overflow-hidden">
                        <div className="p-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-accent-dark">
                            <h2 className="text-xl font-bold">
                                Agenda for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                            </h2>
                        </div>
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="px-6 pt-4 flex-shrink-0">
                                <ChatInput onNewReminder={handleNewReminder} isLoading={isLoading} />
                            </div>
                            <div className="overflow-y-auto px-6 pt-4 pb-6 flex-grow">
                                 {remindersForSelectedDay.length > 0 ? (
                                    <div className="space-y-4">
                                        {remindersForSelectedDay.map((reminder) => (
                                            <ReminderCard
                                                key={reminder.id}
                                                reminder={reminder}
                                                onVendorSelect={handleVendorSelect}
                                                onEdit={(r) => setReminderModalState({ isOpen: true, mode: 'edit', initialData: r })}
                                                onDelete={handleDelete}
                                                onSnooze={handleSnooze}
                                                onComplete={handleStartCompleteAnimation}
                                                onShowToast={showToast}
                                                isNew={reminder.id === newlyAddedId}
                                                isCompleting={reminder.id === completingId}
                                                isExpanded={expandedReminderId === reminder.id}
                                                onToggleExpansion={() => handleToggleExpansion(reminder.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-accent-dark h-full flex flex-col justify-center items-center rounded-lg bg-white dark:bg-slate-800/50">
                                        <Calendar size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">A clear day ahead!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xs">
                                            Add a new task using the AI assistant or the 'Add Reminder' button.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="my-8">
                 <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-sm p-6 card-lift">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Zap size={22} className="mr-2 text-yellow-500"/>
                        AI Assistant
                    </h2>
                    {loadingSuggestions ? (
                        <div className="flex flex-col justify-center items-center h-48">
                            <Spinner />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-200/80">Brewing up some brilliant suggestions...</p>
                        </div>
                    ) : (
                        <>
                            {dashboardAI.dailyBriefing && (
                                <div className="mb-4 p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-700/60">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">{dashboardAI.dailyBriefing}</p>
                                </div>
                            )}
                            <h3 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-300">Suggestions for You</h3>
                            {dashboardAI.suggestions.length > 0 ? (
                                <div className="space-y-3">
                                {dashboardAI.suggestions.map(sug => (
                                    <div key={sug.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-lg card-lift border border-white/20 dark:border-slate-700/50">
                                        <div>
                                            <p className="font-semibold">{sug.title} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">on {sug.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span></p>
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
                                <p className="text-center text-gray-500 dark:text-gray-300 py-4 text-sm">No new suggestions at the moment.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;