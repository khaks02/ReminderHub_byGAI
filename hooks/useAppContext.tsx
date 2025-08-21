import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Reminder, Service, CartItem, AppContextType, CartItemType, ServiceCartItem, PreparedDishCartItem, Recipe, ReminderType, RecurrenceRule, Order, VendorProductCartItem } from '../types';
import { INITIAL_REMINDERS, INITIAL_REMINDER_TYPES } from '../constants';
import { scheduleNotificationsForReminder, cancelNotificationsForReminder, requestNotificationPermission } from '../services/notificationService';

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
    const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [reminderTypes, setReminderTypes] = useState<ReminderType[]>(INITIAL_REMINDER_TYPES);
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        // On initial app load, request permission for notifications
        requestNotificationPermission();
        // And schedule notifications for all existing reminders
        reminders.forEach(scheduleNotificationsForReminder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const addReminder = (reminder: Reminder) => {
        setReminders(prev => {
            const newReminders = [reminder, ...prev].sort((a, b) => a.date.getTime() - b.date.getTime());
            scheduleNotificationsForReminder(reminder);
            return newReminders;
        });
    };

    const deleteReminder = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
        cancelNotificationsForReminder(id);
    };

    const updateReminder = (id: string, updates: Partial<Reminder>) => {
        setReminders(prev => {
            const updatedReminders = prev.map(r => r.id === id ? { ...r, ...updates } : r).sort((a,b) => a.date.getTime() - b.date.getTime());
            const updatedReminder = updatedReminders.find(r => r.id === id);
            if (updatedReminder) {
                scheduleNotificationsForReminder(updatedReminder);
            }
            return updatedReminders;
        });
    };

    const completeReminder = (id: string) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        cancelNotificationsForReminder(id); // Always cancel old notifications

        if (reminder.recurrenceRule) {
            const newDate = calculateNextOccurrence(reminder.date, reminder.recurrenceRule);
            // updateReminder will handle rescheduling the new notifications
            updateReminder(id, { date: newDate });
        } else {
            // isCompleted state will prevent notifications from being scheduled
            updateReminder(id, { isCompleted: true });
        }
    };

    const addReminderType = (newType: ReminderType) => {
        setReminderTypes(prev => {
            const upperCasePrev = prev.map(t => t.toUpperCase().trim());
            const upperCaseNew = newType.toUpperCase().trim();
            if (upperCaseNew && !upperCasePrev.includes(upperCaseNew)) {
                return [...prev, newType.trim()].sort();
            }
            return prev;
        });
    };

    const addToCart = (itemToAdd: Service | CartItem) => {
        setCart(prevCart => {
            // Handle legacy Service addition
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

    const checkout = () => {
        if (cart.length === 0) return;
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

        const newOrder: Order = {
            id: `order-${Date.now()}`,
            date: new Date(),
            items: cart,
            total,
            reminderId: firstItemWithReminder?.reminderId,
            reminderTitle: firstItemWithReminder?.reminderTitle,
        };
        setOrders(prev => [newOrder, ...prev]);
        clearCart();
    };

    const value: AppContextType = {
        reminders,
        addReminder,
        deleteReminder,
        updateReminder,
        completeReminder,
        reminderTypes,
        addReminderType,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartItem,
        orders,
        checkout,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};