import { User, Reminder, Recipe, ActivityRecommendation, DailyRecommendationResponse } from '../types';
import { mockReminders } from './mockData/reminders';
import { mockRecipes } from './mockData/recipes';

// --- In-memory data store ---
let reminders: Reminder[] = [...mockReminders];
let recipes: Recipe[] = [...mockRecipes];
let cart: any[] = [];
let orders: any[] = [];
let savedRecipes: Recipe[] = [];
let preferences = { recipe_vegetarian_only: false, has_completed_tutorial: false };
let reminderTypes = ['Work', 'Health', 'Bill Payment', 'Birthday', 'Social'];

// --- Auth ---
export const getMockUser = (): User => ({
    id: 'mock-user-123',
    name: 'Demo User',
    email: 'demo@example.com',
    avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=Demo%20User`
});

// --- Reminders ---
export const getReminders = () => reminders;
export const addReminder = (reminder: Omit<Reminder, 'id' | 'user_id'>): Reminder => {
    const newReminder: Reminder = {
        ...reminder,
        id: `mock-${Date.now()}`,
        user_id: 'mock-user-123',
    };
    reminders.push(newReminder);
    return newReminder;
};
export const deleteReminder = (id: string) => {
    reminders = reminders.filter(r => r.id !== id);
};
export const updateReminder = (id: string, updates: Partial<Reminder>): Reminder => {
    let updatedReminder: Reminder | undefined;
    reminders = reminders.map(r => {
        if (r.id === id) {
            updatedReminder = { ...r, ...updates };
            return updatedReminder;
        }
        return r;
    });
    return updatedReminder!;
};

// --- Other App Data ---
export const getCart = () => cart;
export const getOrders = () => orders;
export const getReminderTypes = () => reminderTypes;
export const getSavedRecipes = () => savedRecipes;
export const getPreferences = () => preferences;
export const updatePreferences = (updates: Partial<typeof preferences>) => {
    preferences = { ...preferences, ...updates };
};
export const saveRecipe = (recipe: Recipe) => {
    if (!savedRecipes.some(r => r.id === recipe.id)) {
        savedRecipes.push(recipe);
    }
};
export const unsaveRecipe = (recipeId: string) => {
    savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
};
export const checkout = () => {
    const newOrder = {
        id: `order-${Date.now()}`,
        date: new Date(),
        items: cart,
        total: cart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0) * 1.1, // with mock tax
    };
    orders.unshift(newOrder);
    cart = [];
    return newOrder;
};
export const addToCart = (item: any) => { cart.push(item); };
export const removeFromCart = (itemId: string) => { cart = cart.filter(i => i.id !== itemId); };
export const clearCart = () => { cart = []; };
export const updateCartItem = (itemId: string, updates: any) => {
    cart = cart.map(item => item.id === itemId ? { ...item, ...updates } : item);
};

// --- Mock Gemini Service ---
export const analyzeReminderMock = async (prompt: string): Promise<Partial<Omit<Reminder, 'id'>>> => {
    await new Promise(res => setTimeout(res, 500)); // Simulate network
    return {
        title: `Mock for: "${prompt}"`,
        date: new Date(),
        type: 'General',
        description: `This is a mocked reminder based on your input: "${prompt}".`,
    };
};

export const getDashboardSuggestionsMock = async (): Promise<{ suggestions: Omit<Reminder, 'id'>[], dailyBriefing: string }> => {
    await new Promise(res => setTimeout(res, 800));
    return {
        dailyBriefing: "Here's your mocked daily briefing! Have a productive day.",
        suggestions: [
            { title: 'Review Q3 budget', date: new Date(), type: 'Work', description: 'Check the latest figures.' },
            { title: 'Book flight to Delhi', date: new Date(), type: 'Travel', description: 'For the conference next month.' },
            { title: 'Water the plants', date: new Date(), type: 'Personal', description: 'They look thirsty.' },
        ]
    };
};

export const getServiceRecommendationsMock = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
    await new Promise(res => setTimeout(res, 1000));
    return [{
        activity: `Buy a Gift for ${reminder.title}`,
        vendors: [{
            name: 'Mock Gift Store',
            description: 'A fine selection of AI-generated gifts.',
            priceRange: '₹500-2000',
            rating: 4.5,
            productQuery: 'birthday gifts'
        }]
    }];
};

export const getDailyRecommendationsMock = async (): Promise<DailyRecommendationResponse> => {
     await new Promise(res => setTimeout(res, 1200));
     return {
        theme: "A Taste of Mock Data",
        breakfast: [mockRecipes[0]],
        lunch: [mockRecipes[1]],
        hitea: [mockRecipes[0]],
        dinner: [mockRecipes[1]],
        all_time_snacks: [mockRecipes[0]]
     };
};

export const getRecipesMock = async (query: string): Promise<Recipe[]> => {
     await new Promise(res => setTimeout(res, 600));
     return mockRecipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
};

// Return empty or default for other functions to prevent errors
export const getMockProductsForVendorMock = async (vendorName: string, productQuery: string): Promise<any[]> => {
    await new Promise(res => setTimeout(res, 1500));
    return [
        { productName: `${productQuery} - Model A`, price: 1299, imageUrl: 'https://via.placeholder.com/200' },
        { productName: `${productQuery} - Model B`, price: 1599, imageUrl: 'https://via.placeholder.com/200' },
    ]
};

export const getAnalyticsInsightsMock = async (): Promise<string> => {
    await new Promise(res => setTimeout(res, 900));
    return `
# Productivity Snapshot
You are great at creating reminders!

# Spending Habits
You haven't spent anything in demo mode.

# Personalized Tips
- Try adding more reminders.
- Explore the recipes page for fun.
    `;
};
