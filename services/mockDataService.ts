
import { Reminder, Recipe, Order, CartItem, UserPreferences, DailyRecommendationResponse, ActivityRecommendation, VendorSuggestion, ReminderType, CartItemType } from '../types';
import { MOCK_RECIPES } from './mock-data/recipes';
import { MOCK_REMINDERS } from './mock-data/reminders';

const MOCK_USER_ID = 'mock-user-123';

class MockDataService {
    private static instance: MockDataService;

    public reminders: Reminder[] = [];
    public recipes: Recipe[] = [];
    public orders: Order[] = [];
    public cart: CartItem[] = [];
    public reminderTypes: ReminderType[] = [];
    public savedRecipes: Recipe[] = [];
    public preferences: UserPreferences = {
        user_id: MOCK_USER_ID,
        recipe_vegetarian_only: false,
        has_completed_tutorial: true,
    };

    private constructor() {
        this.recipes = MOCK_RECIPES;
        this.reminders = MOCK_REMINDERS.map(r => ({ ...r, date: new Date(r.date) }));

        // Extract unique reminder types
        const types = new Set<string>();
        this.reminders.forEach(r => types.add(r.type));
        this.reminderTypes = Array.from(types).sort();
        
        // Pre-save some recipes
        this.savedRecipes = this.recipes.slice(0, 5);
    }

    public static getInstance(): MockDataService {
        if (!MockDataService.instance) {
            MockDataService.instance = new MockDataService();
        }
        return MockDataService.instance;
    }

    // --- Reminders ---
    getReminders = () => this.reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
    addReminder = (reminder: Omit<Reminder, 'id'>) => {
        const newReminder: Reminder = {
            ...reminder,
            id: `mock-reminder-${Date.now()}`,
            user_id: MOCK_USER_ID,
        };
        this.reminders.push(newReminder);
        return Promise.resolve();
    }
    deleteReminder = (id: string) => {
        this.reminders = this.reminders.filter(r => r.id !== id);
    }
    updateReminder = (id: string, updates: Partial<Reminder>) => {
        this.reminders = this.reminders.map(r => r.id === id ? { ...r, ...updates } : r);
        return Promise.resolve();
    }
    addHolidaysBatch = (holidays: { holidayName: string; date: string }[], country: string) => {
        const newReminders: Reminder[] = holidays.map((h, i) => ({
             id: `mock-holiday-${Date.now()}-${i}`,
             user_id: MOCK_USER_ID,
             title: h.holidayName,
             date: new Date(h.date),
             type: 'Holiday',
             description: `Public holiday in ${country}`,
             is_completed: false
        }));
        this.reminders.push(...newReminders);
        return Promise.resolve(newReminders.length);
    }

    // --- Reminder Types ---
    getReminderTypes = () => this.reminderTypes;
    addReminderType = (type: string) => {
        if (!this.reminderTypes.includes(type)) {
            this.reminderTypes.push(type);
            this.reminderTypes.sort();
        }
    }

    // --- Recipes ---
    getRecipes = () => this.recipes;
    getDailyRecommendations = (isVeg: boolean): DailyRecommendationResponse => {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        
        const filteredRecipes = this.recipes.filter(r => (isVeg ? r.isVeg : true));
        
        const seededRandom = (max: number) => Math.floor(Number('0.' + Math.sin(seed).toString().substr(15)) * max);
        
        const shuffle = (array: Recipe[]) => {
             let currentIndex = array.length, randomIndex;
             while (currentIndex > 0) {
                randomIndex = seededRandom(currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        }

        const shuffled = shuffle([...filteredRecipes]);

        return {
            theme: "A World of Flavors",
            breakfast: shuffled.slice(0, 4),
            lunch: shuffled.slice(4, 8),
            hitea: shuffled.slice(8, 12),
            dinner: shuffled.slice(12, 16),
            all_time_snacks: shuffled.slice(16, 20),
        };
    }
    getSavedRecipes = () => this.savedRecipes;
    saveRecipe = (recipe: Recipe) => {
        if (!this.savedRecipes.some(r => r.id === recipe.id)) {
            this.savedRecipes.unshift(recipe);
        }
    }
    unsaveRecipe = (recipeId: string) => {
        this.savedRecipes = this.savedRecipes.filter(r => r.id !== recipeId);
    }

    // --- Cart & Orders ---
    getCart = () => this.cart;
    addToCart = (item: CartItem) => { this.cart.push(item); }
    removeFromCart = (itemId: string) => { this.cart = this.cart.filter(item => item.id !== itemId); }
    clearCart = () => { this.cart = []; }
    updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
        this.cart = this.cart.map(item => item.id === itemId ? { ...item, ...updates } as CartItem : item);
    }
    getOrders = () => this.orders.sort((a,b) => b.date.getTime() - a.date.getTime());
    checkout = () => {
         const total = this.cart.reduce((acc, item) => {
            let itemPrice = 0;
            switch (item.type) {
                case CartItemType.SERVICE: itemPrice = item.item.price * item.quantity; break;
                case CartItemType.PREPARED_DISH: itemPrice = item.recipe.price * item.quantity; break;
                case CartItemType.CHEF_SERVICE: itemPrice = item.price; break;
                case CartItemType.VENDOR_PRODUCT: itemPrice = item.price * item.quantity; break;
            }
            return acc + itemPrice;
        }, 0);

        const newOrder: Order = {
            id: `mock-order-${Date.now()}`,
            user_id: MOCK_USER_ID,
            date: new Date(),
            items: [...this.cart],
            total: total * 1.1, // with tax
        };
        this.orders.unshift(newOrder);
        this.cart = [];
    }

    // --- Preferences ---
    getPreferences = () => this.preferences;
    updatePreferences = (updates: Partial<UserPreferences>) => {
        this.preferences = { ...this.preferences, ...updates };
        return Promise.resolve();
    }
    completeOnboarding = () => {
        this.preferences.has_completed_tutorial = true;
        return Promise.resolve();
    }
}

export const mockDataService = MockDataService.getInstance();
