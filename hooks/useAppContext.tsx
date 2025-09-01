





import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Reminder, Service, CartItem, AppContextType, CartItemType, ServiceCartItem, PreparedDishCartItem, Recipe, ReminderType, RecurrenceRule, Order, VendorProductCartItem, AutoReminder, UserPreferences, FollowUpReminder } from '../types';
import { scheduleNotificationsForReminder, cancelNotificationsForReminder, requestNotificationPermission } from '../services/notificationService';
import { extractFollowUpReminder } from '../services/geminiService';
import { useAuth } from './useAuthContext';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';
import { USE_MOCK_DATA } from '../config';
import { mockDataService } from '../services/mockDataService';
import { Json } from '../services/supabaseClient';


const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const calculateNextOccurrence = (currentDate: Date, rule: RecurrenceRule): Date => {
    const newDate = new Date(currentDate);
    const { frequency, interval } = rule;
    switch (frequency) {
        case 'DAILY': newDate.setDate(newDate.getDate() + interval); break;
        case 'WEEKLY': newDate.setDate(newDate.getDate() + 7 * interval); break;
        case 'MONTHLY': newDate.setMonth(newDate.getMonth() + interval); break;
        case 'YEARLY': newDate.setFullYear(newDate.getFullYear() + interval); break;
    }
    return newDate;
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [reminderTypes, setReminderTypes] = useState<ReminderType[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (userId) {
            setLoadingData(true);
            
            if (USE_MOCK_DATA) {
                setReminders(mockDataService.getReminders());
                setReminderTypes(mockDataService.getReminderTypes());
                setOrders(mockDataService.getOrders());
                setSavedRecipes(mockDataService.getSavedRecipes());
                setCart(mockDataService.getCart());
                setPreferences(mockDataService.getPreferences());
                setLoadingData(false);
                return;
            }

            const fetchData = async () => {
                try {
                    const [remindersRes, typesRes, ordersRes, savedRecipesRes, cartRes, preferencesRes] = await Promise.all([
                        supabase.from('reminders').select('*').eq('user_id', userId),
                        supabase.from('reminder_types').select('name').eq('user_id', userId),
                        supabase.from('orders').select('*').eq('user_id', userId).order('date', { ascending: false }),
                        supabase.from('saved_recipes').select('recipe_data').eq('user_id', userId),
                        supabase.from('cart').select('items').eq('user_id', userId).single(),
                        supabase.from('user_preferences').select('*').eq('user_id', userId).single()
                    ]);

                    if (remindersRes.error) throw remindersRes.error;
                    const fetchedReminders = ((remindersRes.data as any) || []).map((r: any) => ({...r, date: new Date(r.date)}));
                    setReminders(fetchedReminders.sort((a, b) => a.date.getTime() - b.date.getTime()));

                    if (typesRes.error) throw typesRes.error;
                    setReminderTypes(((typesRes.data as any) || []).map((t: any) => t.name));

                    if (ordersRes.error) throw ordersRes.error;
                    const fetchedOrders = ((ordersRes.data as any) || []).map((o: any) => ({ ...o, date: new Date(o.date) }));
                    setOrders(fetchedOrders);

                    if (savedRecipesRes.error) throw savedRecipesRes.error;
                    setSavedRecipes(((savedRecipesRes.data as any) || []).map((r: any) => r.recipe_data as Recipe));

                    if (cartRes.error && cartRes.error.code !== 'PGRST116') throw cartRes.error; // Ignore "no rows" error
                    // FIX: Cast cartRes to 'any' to access the 'data' property, as its type was incorrectly inferred as 'never'.
                    setCart((((cartRes as any).data)?.items as CartItem[]) || []);
                    
                    if (preferencesRes.error && preferencesRes.error.code !== 'PGRST116') throw preferencesRes.error;
                    if (!preferencesRes.data) {
                        const { data: newPreferences, error: newPrefError } = await supabase.from('user_preferences').insert({ user_id: userId } as any).select().single();
                        if (newPrefError) throw newPrefError;
                        setPreferences(newPreferences as any);
                    } else {
                        setPreferences(preferencesRes.data as any);
                    }
                } catch (error) {
                    console.error("[AppContext] Error fetching initial user data from Supabase:", (error as any).message || error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
            
            const channel = supabase.channel(`public:reminders:user_id=eq.${userId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, async () => {
                     const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId);
                     if (error) console.error('[AppContext] Realtime error refetching reminders:', error);
                     else {
                         const updatedReminders = ((data as any) || []).map((r: any) => ({ ...r, date: new Date(r.date) }));
                         setReminders(updatedReminders.sort((a, b) => a.date.getTime() - b.date.getTime()));
                     }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };

        } else {
            setReminders([]);
            setCart([]);
            setReminderTypes([]);
            setOrders([]);
            setSavedRecipes([]);
            setPreferences(null);
            setLoadingData(false);
        }
    }, [userId]);
    
    useEffect(() => {
        if (userId && !loadingData && !USE_MOCK_DATA) {
            const saveCart = async () => {
                // FIX: Cast the entire payload object to 'any' to resolve the type mismatch where the expected parameter was 'never'.
                const { error } = await supabase.from('cart').upsert({ user_id: userId, items: cart } as any, { onConflict: 'user_id' });
                if (error) console.error('[AppContext] Error saving cart to Supabase:', (error as any).message || error);
            };
            saveCart();
        }
    }, [cart, userId, loadingData]);


    const autoGeneratedReminders = useMemo(() => 
        reminders.filter((r): r is AutoReminder => !!r.source), 
        [reminders]
    );

    useEffect(() => {
        requestNotificationPermission();
        reminders.forEach(scheduleNotificationsForReminder);
        return () => {
            reminders.forEach(r => cancelNotificationsForReminder(r.id));
        };
    }, [reminders]);


    const addReminder = async (reminder: Omit<Reminder, 'id' | 'user_id'>) => {
        if (!userId) throw new Error("User not authenticated.");
        if (USE_MOCK_DATA) {
            await mockDataService.addReminder(reminder);
            setReminders([...mockDataService.getReminders()]);
            return;
        }
        const { data, error } = await supabase.from('reminders').insert({ ...reminder, user_id: userId, date: reminder.date.toISOString() } as any).select().single();
        if (error) throw new Error(`Failed to add reminder: ${error.message}`);
        if (!data) throw new Error('Failed to add reminder: no data returned.');
        scheduleNotificationsForReminder({ ...(data as any), date: new Date((data as any).date) } as Reminder);
    };

    const deleteReminder = async (id: string) => {
        if (!userId) return;
        if (USE_MOCK_DATA) {
            mockDataService.deleteReminder(id);
            setReminders([...mockDataService.getReminders()]);
            return;
        }
        const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
        if (error) { console.error('[AppContext] Error deleting reminder:', error); return; }
        cancelNotificationsForReminder(id);
    };

    const updateReminder = async (id: string, updates: Partial<Reminder>) => {
        if (!userId) throw new Error("User not authenticated.");
         if (USE_MOCK_DATA) {
            await mockDataService.updateReminder(id, updates);
            setReminders([...mockDataService.getReminders()]);
            return;
        }
        const { date, ...restUpdates } = updates;
        const dbUpdates = {
            ...restUpdates,
            ...(date && { date: date.toISOString() }),
        };
        // FIX: Cast the update payload to 'any' to work around the incorrect type inference to 'never'.
        const { data, error } = await supabase.from('reminders').update(dbUpdates as any).eq('id', id).eq('user_id', userId).select().single();
        if (error) throw new Error(`Failed to update reminder: ${error.message}`);
        if (!data) throw new Error('Failed to update reminder: no data returned.');
        scheduleNotificationsForReminder({ ...(data as any), date: new Date((data as any).date) } as Reminder);
    };

    const completeReminder = (id: string) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        cancelNotificationsForReminder(id);

        const promise = reminder.recurrence_rule
            ? updateReminder(id, { date: calculateNextOccurrence(reminder.date, reminder.recurrence_rule), is_completed: false })
            : updateReminder(id, { is_completed: true });

        promise.catch(err => console.error("[AppContext] Failed to complete reminder:", err));
    };

    const addReminderType = async (newType: ReminderType) => {
        const upperCaseNew = newType.toUpperCase().trim();
        if (!upperCaseNew || reminderTypes.map(t => t.toUpperCase().trim()).includes(upperCaseNew)) return;

        if (USE_MOCK_DATA) {
            mockDataService.addReminderType(newType);
            setReminderTypes([...mockDataService.getReminderTypes()]);
            return;
        }

        setReminderTypes(prev => [...prev, newType.trim()].sort());

        if (!userId) return;
        const { error } = await supabase.from('reminder_types').insert({ user_id: userId, name: newType.trim() } as any);
        if (error) console.error('[AppContext] Error saving new reminder type to Supabase:', error);
    };
    
    const addHolidaysBatch = async (holidays: { holidayName: string, date: string }[], country: string): Promise<number> => {
        if (!currentUser) return 0;

        if (USE_MOCK_DATA) {
            const count = await mockDataService.addHolidaysBatch(holidays, country);
            setReminders([...mockDataService.getReminders()]);
            return count;
        }
        
        const newReminders: Omit<Reminder, 'id' | 'user_id'>[] = [];
        holidays.forEach(holiday => {
            const holidayDate = new Date(`${holiday.date}T12:00:00`); 
            const reminderExists = reminders.some(r => 
                r.title.toLowerCase() === holiday.holidayName.toLowerCase() && 
                r.date.toDateString() === holidayDate.toDateString()
            );

            if (!reminderExists) {
                newReminders.push({
                    title: holiday.holidayName,
                    date: holidayDate,
                    type: 'Holiday',
                    description: `Public holiday in ${country}.`,
                    is_completed: false,
                });
            }
        });

        if (newReminders.length > 0) {
            const remindersForDb = newReminders.map(r => ({...r, user_id: currentUser.id, date: r.date.toISOString()}));
            const { data, error } = await supabase.from('reminders').insert(remindersForDb as any).select();
            if (error) { console.error('[AppContext] Error adding holidays batch to Supabase:', error); return 0; }
            
            const addedReminders = ((data as any) || []).map((r: any) => ({...r, date: new Date(r.date)}));
            addedReminders.forEach(scheduleNotificationsForReminder);
            return addedReminders.length;
        }
        return 0;
    };


    const addToCart = (itemToAdd: Service | CartItem) => {
        let newCartItem: CartItem;

        // Logic to handle both Service (deprecated) and CartItem types
        if ('provider' in itemToAdd) { // It's a Service
             newCartItem = { id: `cart-${Date.now()}`, type: CartItemType.SERVICE, item: itemToAdd, quantity: 1 };
        } else {
            newCartItem = { ...itemToAdd, id: itemToAdd.id || `cart-${Date.now()}` };
        }

        setCart(prevCart => {
             // More robust duplicate checking and quantity incrementing
             if (newCartItem.type === CartItemType.PREPARED_DISH) {
                const existing = prevCart.find(i => i.type === CartItemType.PREPARED_DISH && i.recipe.id === newCartItem.recipe.id) as PreparedDishCartItem | undefined;
                if (existing) {
                    return prevCart.map(i => i.id === existing.id ? { ...i, quantity: existing.quantity + 1 } : i);
                }
            } else if (newCartItem.type === CartItemType.VENDOR_PRODUCT) {
                 const existing = prevCart.find(i => i.type === CartItemType.VENDOR_PRODUCT && i.productName === newCartItem.productName && i.vendor === newCartItem.vendor) as VendorProductCartItem | undefined;
                 if (existing) {
                    return prevCart.map(i => i.id === existing.id ? { ...i, quantity: (i as VendorProductCartItem).quantity + 1 } : i);
                }
            } else if (newCartItem.type === CartItemType.SERVICE) {
                const existing = prevCart.find(i => i.type === CartItemType.SERVICE && i.item.id === newCartItem.item.id) as ServiceCartItem | undefined;
                 if (existing) {
                    return prevCart.map(i => i.id === existing.id ? { ...i, quantity: (i as ServiceCartItem).quantity + 1 } : i);
                }
            }
            return [...prevCart, newCartItem];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
        setCart(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } as CartItem : item));
    };


    const clearCart = () => {
        setCart([]);
    };
    
    const cartCount = cart.reduce((count, item) => {
        return count + (('quantity' in item && typeof item.quantity === 'number') ? item.quantity : 1);
    }, 0);

    const getItemNameForOrder = (item: CartItem): string => {
         switch (item.type) {
            case CartItemType.SERVICE: return item.item.name;
            case CartItemType.PREPARED_DISH: return item.recipe.name;
            case CartItemType.INGREDIENTS_LIST: return `Ingredients for ${item.recipe.name}`;
            case CartItemType.CHEF_SERVICE: return `Chef for ${item.recipe.name}`;
            case CartItemType.VENDOR_PRODUCT: return item.productName;
            default: return "Unknown Item";
        }
    }

    const analyzeOrderForFollowUps = async (order: Order) => {
        const followUpPromises = order.items.map(item => extractFollowUpReminder(getItemNameForOrder(item), order.date));
        const results = await Promise.all(followUpPromises);
        const validFollowUps = results.filter((followUp): followUp is { title: string; date: Date } => !!followUp);

        if (validFollowUps.length > 0) {
            for (const followUp of validFollowUps) {
                try {
                    await addReminder({
                        title: followUp.title,
                        date: followUp.date,
                        type: 'Renewal',
                        description: `Automatically added from order #${order.id.slice(-6)}`,
                        is_completed: false,
                        source: 'Purchase',
                    });
                } catch (err) { console.error("[AppContext] Failed to add follow-up reminder:", err); }
            }
            if (USE_MOCK_DATA) return;
            const serializableFollowUps = validFollowUps.map(f => ({ ...f, date: f.date.toISOString() }));
            const { error } = await supabase.from('orders').update({ followUpReminders: serializableFollowUps as any } as any).eq('id', order.id);
            if(error) console.error("[AppContext] Error updating order with follow-up reminders:", error);
        }
    };


    const checkout = async () => {
        if (cart.length === 0 || !currentUser) return;
         if (USE_MOCK_DATA) {
            mockDataService.checkout();
            setOrders([...mockDataService.getOrders()]);
            setCart([]);
            return;
        }

        const total = cart.reduce((acc, item) => {
            let itemPrice = 0;
            switch (item.type) {
                case CartItemType.SERVICE: itemPrice = item.item.price * item.quantity; break;
                case CartItemType.PREPARED_DISH: itemPrice = item.recipe.price * item.quantity; break;
                case CartItemType.CHEF_SERVICE: itemPrice = item.price; break;
                case CartItemType.VENDOR_PRODUCT: itemPrice = item.price * item.quantity; break;
            }
            return acc + itemPrice;
        }, 0);

        const firstItemWithReminder = cart.find(item => item.reminderId && item.reminderTitle);
        
        const newOrder: Omit<Order, 'id'> = {
            date: new Date(),
            items: cart,
            total,
            reminderId: firstItemWithReminder?.reminderId,
            reminderTitle: firstItemWithReminder?.reminderTitle,
            user_id: currentUser.id
        };
        
        const { data, error } = await supabase.from('orders').insert({ ...newOrder, date: newOrder.date.toISOString(), items: newOrder.items as any } as any).select().single();
        if (error) { console.error('[AppContext] Error creating order in Supabase:', error); return; }
        
        if (!data) { console.error('[AppContext] Error creating order: no data returned.'); return; }
        const createdOrder: Order = { ...(data as any), date: new Date((data as any).date) };
        setOrders(prev => [createdOrder, ...prev]);
        clearCart();
        analyzeOrderForFollowUps(createdOrder);
    };
    
    const saveRecipe = async (recipe: Recipe) => {
        if (!currentUser || savedRecipes.some(r => r.id === recipe.id)) return;

        if (USE_MOCK_DATA) {
            mockDataService.saveRecipe(recipe);
            setSavedRecipes([...mockDataService.getSavedRecipes()]);
            return;
        }
        
        setSavedRecipes(prev => [recipe, ...prev]);
        
        const { error } = await supabase.from('saved_recipes').insert({ user_id: currentUser.id, recipe_id: recipe.id, recipe_data: recipe as any } as any);
        if (error) console.error('[AppContext] Error saving recipe to Supabase:', error);
    };

    const unsaveRecipe = async (recipeId: string) => {
        if (!currentUser) return;
        
        if (USE_MOCK_DATA) {
            mockDataService.unsaveRecipe(recipeId);
            setSavedRecipes([...mockDataService.getSavedRecipes()]);
            return;
        }

        setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
        
        const { error } = await supabase.from('saved_recipes').delete().eq('user_id', currentUser.id).eq('recipe_id', recipeId);
        if (error) console.error('[AppContext] Error unsaving recipe from Supabase:', error);
    };

    const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'user_id'>>) => {
        if (!currentUser || !preferences) return;

        if (USE_MOCK_DATA) {
            await mockDataService.updatePreferences(updates);
            setPreferences({ ...mockDataService.getPreferences() });
            return;
        }

        const updatedPrefs = { ...preferences, ...updates };
        setPreferences(updatedPrefs);

        // FIX: Cast the upsert payload to 'any' to work around the incorrect type inference to 'never'.
        const { data, error } = await supabase.from('user_preferences').upsert(updatedPrefs as any).select().single();
        if (error) console.error('[AppContext] Error updating user preferences in Supabase:', error);
        else setPreferences(data as any);
    };

    const completeOnboarding = async () => {
        if (!currentUser) return;
        await updatePreferences({ has_completed_tutorial: true });
    };

    const value: AppContextType = {
        reminders, addReminder, deleteReminder, updateReminder, completeReminder,
        reminderTypes, addReminderType, addHolidaysBatch,
        cart, cartCount, addToCart, removeFromCart, clearCart, updateCartItem,
        orders, checkout,
        autoGeneratedReminders,
        savedRecipes, saveRecipe, unsaveRecipe,
        preferences, updatePreferences, completeOnboarding,
    };

    // This effect is for mock mode only, to keep cart in sync if it's changed.
    useEffect(() => {
        if (USE_MOCK_DATA) {
            mockDataService.cart = cart;
        }
    }, [cart]);

    return (
        <AppContext.Provider value={value}>
            {!loadingData ? children : (
                <div className="w-full h-full flex justify-center items-center">
                    <Spinner size="12" />
                </div>
            )}
        </AppContext.Provider>
    );
};