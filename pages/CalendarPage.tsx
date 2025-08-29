
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Reminder, VendorProductCartItem, CartItemType, VendorSuggestion, Recipe, IngredientsCartItem } from '../types';
import ReminderCard from '../components/ReminderCard';
import EditReminderModal from '../components/EditReminderModal';
import CompletionPromptModal from '../components/CompletionPromptModal';
import VendorModal from '../components/VendorModal';
import Toast from '../components/Toast';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CalendarPage: React.FC = () => {
    const { reminders, addReminder, addToCart, deleteReminder, updateReminder, completeReminder, reminderTypes, addReminderType } = useAppContext();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reminderModalState, setReminderModalState] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; initialData: Partial<Reminder>; }>({ isOpen: false, mode: 'create', initialData: {} });
    const [completionCandidate, setCompletionCandidate] = useState<Reminder | null>(null);
    const [vendorModal, setVendorModal] = useState<{ isOpen: boolean; vendorSuggestion: VendorSuggestion | null; reminderContext?: { id: string, title: string }; }>({ isOpen: false, vendorSuggestion: null });

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

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
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
                    recurrenceRule: data.recurrenceRule,
                    is_completed: false,
                };
                await addReminder(newReminder);
                setToast({ message: "Reminder created!", type: 'success' });
            }
            setReminderModalState({ isOpen: false, mode: 'create', initialData: {} });
        } catch (err) {
            setToast({ message: `Failed to save reminder: ${err instanceof Error ? err.message : ''}`, type: 'error' });
        }
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

    const handleAddIngredientsToCart = (recipe: Recipe, reminder?: Reminder) => {
        const newCartItem: IngredientsCartItem = {
            id: `recipe-ing-${recipe.id}-${Date.now()}`,
            type: CartItemType.INGREDIENTS_LIST,
            recipe,
            reminderId: reminder?.id,
            reminderTitle: reminder?.title,
        };
        addToCart(newCartItem);
        setToast({ message: `Ingredients for ${recipe.name} added to cart!`, type: 'success' });
    };

    const handleDateChange = (amount: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            days.push(<div key={`pad-prev-${i}`} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"></div>);
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateKey = toDateKey(date);
            const dayReminders = remindersByDate.get(dateKey) || [];
            const isToday = toDateKey(new Date()) === dateKey;
            const isSelected = toDateKey(selectedDate) === dateKey;
            
            days.push(
                <div 
                    key={dateKey} 
                    className={`border-r border-b border-gray-200 dark:border-slate-700 p-2 min-h-[120px] relative group transition-colors cursor-pointer flex flex-col ${isSelected ? 'ring-2 ring-primary/80 bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
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
        
        const totalCells = days.length;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            days.push(<div key={`pad-next-${i}`} className="border-r border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"></div>);
        }

        return (
             <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                    <div key={dayName} className="text-center font-bold p-2 border-b border-r border-gray-200 dark:border-slate-700 text-sm">{dayName}</div>
                ))}
                {days}
            </div>
        );
    };

    return (
        <div className="container mx-auto">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
             {reminderModalState.isOpen && (
                <EditReminderModal
                    isOpen={reminderModalState.isOpen}
                    mode={reminderModalState.mode}
                    initialData={reminderModalState.initialData}
                    onClose={() => setReminderModalState({ ...reminderModalState, isOpen: false })}
                    onSave={handleSaveReminder}
                    onDelete={(id) => handleDelete(id)}
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
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400">Your reminders at a glance.</p>
                </div>
                <button
                    onClick={() => setReminderModalState({ isOpen: true, mode: 'create', initialData: { date: selectedDate } })}
                    className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Reminder</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
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
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 h-full border border-gray-200 dark:border-slate-700 sticky top-20">
                         <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-slate-700 pb-3">
                            Agenda for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                         </h2>
                        <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                             {remindersForSelectedDay.length > 0 ? (
                                remindersForSelectedDay.map(reminder => (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        onVendorSelect={handleVendorSelect}
                                        onEdit={(r) => setReminderModalState({ isOpen: true, mode: 'edit', initialData: r })}
                                        onDelete={handleDelete}
                                        onSnooze={handleSnooze}
                                        onComplete={handleComplete}
                                        onShowToast={showToast}
                                        onAddIngredients={(recipe) => handleAddIngredientsToCart(recipe, reminder)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                     <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No Reminders</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">You're all clear for this day!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
