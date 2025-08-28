

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Reminder, Service, CartItem, AppContextType, CartItemType, ServiceCartItem, PreparedDishCartItem, Recipe, ReminderType, RecurrenceRule, Order, VendorProductCartItem, AutoReminder, UserPreferences } from '../types';
import { scheduleNotificationsForReminder, cancelNotificationsForReminder, requestNotificationPermission } from '../services/notificationService';
import { extractFollowUpReminder } from '../services/geminiService';
import { useAuth } from './useAuthContext';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';

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
                    const fetchedReminders = remindersRes.data.map(r => ({...r, date: new Date(r.date)}));
                    setReminders(fetchedReminders.sort((a, b) => a.date.getTime() - b.date.getTime()));

                    if (typesRes.error) throw typesRes.error;
                    setReminderTypes(typesRes.data.map(t => t.name));

                    if (ordersRes.error) throw ordersRes.error;
                    const fetchedOrders = ordersRes.data.map(o => ({ ...o, date: new Date(o.date) }));
                    setOrders(fetchedOrders);

                    if (savedRecipesRes.error) throw savedRecipesRes.error;
                    setSavedRecipes(savedRecipesRes.data.map((r: any) => r.recipe_data));

                    if (cartRes.error && cartRes.error.code !== 'PGRST116') throw cartRes.error; // Ignore "no rows" error
                    setCart(cartRes.data?.items || []);
                    
                    if (preferencesRes.error && preferencesRes.error.code !== 'PGRST116') throw preferencesRes.error;
                    // If no preferences found, create a default one.
                    if (!preferencesRes.data) {
                        const { data: newPreferences, error: newPrefError } = await supabase.from('user_preferences').insert({ user_id: userId }).select().single();
                        if (newPrefError) throw newPrefError;
                        setPreferences(newPreferences);
                    } else {
                        setPreferences(preferencesRes.data);
                    }


                } catch (error) {
                    console.error("Error fetching user data from Supabase:", error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
            
            // --- Real-time Subscription ---
            const channel = supabase.channel(`public:reminders:user_id=eq.${userId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, async () => {
                     // Refetch all reminders to ensure consistency
                     const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId);
                     if (error) console.error('Error refetching reminders:', error);
                     else {
                         const updatedReminders = data.map(r => ({ ...r, date: new Date(r.date) }));
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
        if (userId && !loadingData) {
            const saveCart = async () => {
                const { error } = await supabase.from('cart').upsert({ user_id: userId, items: cart }, { onConflict: 'user_id' });
                if (error) console.error('Error saving cart:', error);
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
        
        const reminderToInsert = { ...reminder, user_id: userId };

        const { data, error } = await supabase
            .from('reminders')
            .insert(reminderToInsert)
            .select()
            .single();
        
        if (error) {
            console.error('Error adding reminder:', error);
            throw new Error(`Failed to add reminder: ${error.message}`);
        }
        
        const newReminder = { ...data, date: new Date(data.date) } as Reminder;
        scheduleNotificationsForReminder(newReminder);
    };

    const deleteReminder = async (id: string) => {
        if (!userId) return;
        const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
        if (error) { console.error('Error deleting reminder:', error); return; }
        cancelNotificationsForReminder(id);
    };

    const updateReminder = async (id: string, updates: Partial<Reminder>) => {
        if (!userId) throw new Error("User not authenticated.");
        
        const { data, error } = await supabase
            .from('reminders')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating reminder:', error);
            throw new Error(`Failed to update reminder: ${error.message}`);
        }
        
        const updatedReminder = { ...data, date: new Date(data.date) } as Reminder;
        scheduleNotificationsForReminder(updatedReminder);
    };

    const completeReminder = (id: string) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        cancelNotificationsForReminder(id);

        const promise = reminder.recurrenceRule
            ? updateReminder(id, { date: calculateNextOccurrence(reminder.date, reminder.recurrenceRule), is_completed: false })
            : updateReminder(id, { is_completed: true });

        promise.catch(err => {
            console.error("Failed to complete reminder:", err);
            // Optionally: revert UI state or show an error to the user
        });
    };

    const addReminderType = async (newType: ReminderType) => {
        if (!userId) return;
        const upperCasePrev = reminderTypes.map(t => t.toUpperCase().trim());
        const upperCaseNew = newType.toUpperCase().trim();
        if (!upperCaseNew || upperCasePrev.includes(upperCaseNew)) return;
        
        const { error } = await supabase.from('reminder_types').insert({ user_id: userId, name: newType.trim() });
        if (error) { console.error('Error adding reminder type:', error); return; }

        setReminderTypes(prev => [...prev, newType.trim()].sort());
    };
    
    const addHolidaysBatch = async (holidays: { holidayName: string, date: string }[], country: string): Promise<number> => {
        if (!userId) return 0;
        
        const newRemindersToInsert: Omit<Reminder, 'id'>[] = [];
        holidays.forEach(holiday => {
            const holidayDate = new Date(`${holiday.date}T12:00:00`); 
            const reminderExists = reminders.some(r => 
                r.title.toLowerCase() === holiday.holidayName.toLowerCase() && 
                r.date.toDateString() === holidayDate.toDateString()
            );

            if (!reminderExists) {
                newRemindersToInsert.push({
                    title: holiday.holidayName,
                    date: holidayDate,
                    type: 'Holiday',
                    description: `Public holiday in ${country}.`,
                    is_completed: false,
                    user_id: userId
                });
            }
        });

        if (newRemindersToInsert.length > 0) {
            const { data, error } = await supabase.from('reminders').insert(newRemindersToInsert).select();
            if (error) { console.error('Error adding holidays:', error); return 0; }
            
            const addedReminders = data.map(r => ({...r, date: new Date(r.date)}));
            addedReminders.forEach(scheduleNotificationsForReminder);
            return addedReminders.length;
        }
        return 0;
    };


    const addToCart = (itemToAdd: Service | CartItem) => {
        setCart(prevCart => {
            if ('provider' in itemToAdd) { 
                 const existingItem = prevCart.find(item => item.type === CartItemType.SERVICE && item.item.id === itemToAdd.id) as ServiceCartItem | undefined;
                if (existingItem) {
                    return prevCart.map(item => item.id === existingItem.id ? { ...item, quantity: (item as ServiceCartItem).quantity + 1 } : item);
                }
                const newCartItem: ServiceCartItem = {
                    id: `cart-${Date.now()}`,
                    type: CartItemType.SERVICE,
                    item: itemToAdd,
                    quantity: 1
                };
                return [...prevCart, newCartItem];
            }
            
            const newItem = itemToAdd as CartItem;

            if (newItem.type === CartItemType.PREPARED_DISH) {
                const existingDish = prevCart.find(item => item.type === CartItemType.PREPARED_DISH && item.recipe.id === newItem.recipe.id) as PreparedDishCartItem | undefined;
                if (existingDish) {
                     return prevCart.map(item => item.id === existingDish.id ? { ...item, quantity: (item as PreparedDishCartItem).quantity + 1 } : item);
                }
            }

            if (newItem.type === CartItemType.VENDOR_PRODUCT) {
                const existingVp = prevCart.find(item => item.type === CartItemType.VENDOR_PRODUCT && item.productName === newItem.productName && item.vendor === newItem.vendor) as VendorProductCartItem | undefined;
                if (existingVp) {
                    return prevCart.map(item => item.id === existingVp.id ? { ...item, quantity: (item as VendorProductCartItem).quantity + 1 } : item);
                }
            }
            
            const isDuplicate = prevCart.some(item => 
                (item.type === CartItemType.INGREDIENTS_LIST && newItem.type === CartItemType.INGREDIENTS_LIST && item.recipe.id === newItem.recipe.id) ||
                (item.type === CartItemType.CHEF_SERVICE && newItem.type === CartItemType.CHEF_SERVICE && item.recipe.id === newItem.recipe.id)
            );

            if(isDuplicate) {
                console.log("Item already in cart");
                return prevCart;
            }

            return [...prevCart, newItem];
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
        const followUpPromises = order.items.map(item => 
            extractFollowUpReminder(getItemNameForOrder(item), order.date)
        );
        const results = await Promise.all(followUpPromises);
        const validFollowUps = results.filter((followUp): followUp is { title: string; date: Date } => !!followUp);

        if (validFollowUps.length > 0) {
            for (const followUp of validFollowUps) {
                try {
                    const newReminder: Omit<Reminder, 'id' | 'user_id'> = {
                        title: followUp.title,
                        date: followUp.date,
                        type: 'Renewal',
                        description: `Automatically added from order #${order.id.slice(-6)}`,
                        is_completed: false,
                        source: 'Purchase',
                    };
                    await addReminder(newReminder);
                } catch (err) {
                    console.error("Failed to add follow-up reminder:", err);
                }
            }

            const updatedOrderPayload = { ...order, followUpReminders: validFollowUps };
            const { error } = await supabase.from('orders').update(updatedOrderPayload).eq('id', order.id);
            if(error) console.error("Error updating order with follow-ups:", error);
            else {
                 setOrders(prevOrders => prevOrders.map(o => 
                    o.id === order.id ? updatedOrderPayload : o
                ));
            }
        }
    };


    const checkout = async () => {
        if (cart.length === 0 || !userId) return;
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
            user_id: userId
        };
        
        const { data, error } = await supabase.from('orders').insert(newOrder).select().single();
        if (error) { console.error('Error creating order:', error); return; }

        const createdOrder = { ...data, date: new Date(data.date) };
        setOrders(prev => [createdOrder, ...prev]);
        clearCart();
        analyzeOrderForFollowUps(createdOrder);
    };
    
    const saveRecipe = async (recipe: Recipe) => {
        if (!userId || savedRecipes.some(r => r.id === recipe.id)) return;
        
        const { error } = await supabase.from('saved_recipes').insert({
            user_id: userId,
            recipe_id: recipe.id,
            recipe_data: recipe
        });

        if (error) { console.error('Error saving recipe:', error); return; }

        setSavedRecipes(prev => [recipe, ...prev]);
    };

    const unsaveRecipe = async (recipeId: string) => {
        if (!userId) return;
        
        const { error } = await supabase.from('saved_recipes').delete()
            .eq('user_id', userId)
            .eq('recipe_id', recipeId);
        
        if (error) { console.error('Error unsaving recipe:', error); return; }

        setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    };

    const updatePreferences = async (updates: Partial<Omit<UserPreferences, 'user_id'>>) => {
        if (!userId) return;

        const { data, error } = await supabase
            .from('user_preferences')
            .upsert({ user_id: userId, ...updates })
            .select()
            .single();

        if (error) {
            console.error('Error updating preferences:', error);
            return;
        }
        setPreferences(data);
    };

    const completeOnboarding = async () => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('user_preferences')
            .upsert({ user_id: userId, has_completed_tutorial: true })
            .select()
            .single();

        if (error) {
            console.error('Error completing onboarding:', error);
            return;
        }
        setPreferences(data);
    };

    const value: AppContextType = {
        reminders,
        addReminder,
        deleteReminder,
        updateReminder,
        completeReminder,
        reminderTypes,
        addReminderType,
        addHolidaysBatch,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartItem,
        orders,
        checkout,
        autoGeneratedReminders,
        savedRecipes,
        saveRecipe,
        unsaveRecipe,
        preferences,
        updatePreferences,
        completeOnboarding,
    };

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