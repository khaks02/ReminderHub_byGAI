
export type ReminderType = string;

export interface RecurrenceRule {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
}

export interface Reminder {
    id: string;
    title: string;
    date: Date;
    type: ReminderType;
    description: string;
    recurrenceRule?: RecurrenceRule | null;
    isCompleted?: boolean;
}

// The old Service type is being replaced by a more dynamic recommendation system.
// It is kept here for now to avoid breaking existing cart logic but is considered deprecated.
export interface Service {
    id: string;
    name: string;
    description: string;
    provider: string;
    price: number;
}

// Deprecated in favor of the new ActivityRecommendation flow
export interface ProductRecommendation {
    productName: string;
    vendorName: string;
    price: number;
}
// Deprecated in favor of the new ActivityRecommendation flow
export interface ServiceRecommendation {
    category: string;
    products: ProductRecommendation[];
}

export interface VendorSuggestion {
    name: string;
    description: string;
    priceRange: string; // "₹100-1000"
    rating: number;
    productQuery: string; // e.g., "smartwatch"
    customerCare?: string;
}

export interface ActivityRecommendation {
    activity: string; // e.g., "Buy a Gift"
    vendors: VendorSuggestion[];
}


export interface Recipe {
    id: string;
    name: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    imageUrl: string;
    isVeg: boolean;
    cuisine: string;
    rating: number;
    cookTimeInMinutes: number;
    servings: number;
    price: number;
    deliveryVendors: string[];
    groceryVendors: string[];
}

export enum CartItemType {
    SERVICE = 'SERVICE',
    PREPARED_DISH = 'PREPARED_DISH',
    INGREDIENTS_LIST = 'INGREDIENTS_LIST',
    CHEF_SERVICE = 'CHEF_SERVICE',
    VENDOR_PRODUCT = 'VENDOR_PRODUCT',
}

interface CartItemBase {
    id: string; // Unique ID for each cart entry
    type: CartItemType;
    reminderId?: string;
    reminderTitle?: string;
}

export interface ServiceCartItem extends CartItemBase {
    type: CartItemType.SERVICE;
    item: Service;
    quantity: number;
}

export interface PreparedDishCartItem extends CartItemBase {
    type: CartItemType.PREPARED_DISH;
    recipe: Recipe;
    quantity: number;
    vendor?: string;
}

export interface IngredientsCartItem extends CartItemBase {
    type: CartItemType.INGREDIENTS_LIST;
    recipe: Recipe;
    vendor?: string;
}

export interface ChefServiceCartItem extends CartItemBase {
    type: CartItemType.CHEF_SERVICE;
    recipe: Recipe;
    price: number; // Chef services have a fixed price
}

export interface VendorProductCartItem extends CartItemBase {
    type: CartItemType.VENDOR_PRODUCT;
    productName: string;
    vendor: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    customerCare?: string;
}


export type CartItem = ServiceCartItem | PreparedDishCartItem | IngredientsCartItem | ChefServiceCartItem | VendorProductCartItem;

export interface Order {
    id: string;
    date: Date;
    items: CartItem[];
    total: number;
    reminderId?: string;
    reminderTitle?: string;
}

export type AppContextType = {
    reminders: Reminder[];
    addReminder: (reminder: Reminder) => void;
    deleteReminder: (id: string) => void;
    updateReminder: (id: string, updates: Partial<Reminder>) => void;
    completeReminder: (id: string) => void;
    reminderTypes: ReminderType[];
    addReminderType: (type: ReminderType) => void;
    cart: CartItem[];
    cartCount: number;
    addToCart: (item: Service | CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
    orders: Order[];
    checkout: () => void;
};