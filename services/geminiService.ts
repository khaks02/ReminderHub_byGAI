import { GoogleGenAI } from '@google/genai';
import { Reminder, ReminderType, Recipe, ActivityRecommendation, DailyRecommendationResponse, Order, VendorSuggestion } from '../types';
import { USE_MOCK_DATA } from '../config';
import { mockDataService } from './mockDataService';

// --- MOCK IMPLEMENTATIONS ---

const getMockServiceRecommendations = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
    await new Promise(res => setTimeout(res, 300)); // Simulate network delay
    const type = reminder.type.toLowerCase();
    const title = reminder.title.toLowerCase();

    // Gift & Celebration-centric
    if (type.includes('birthday') || type.includes('anniversary') || type.includes('social')) {
        return [
            {
                activity: 'Send a Gift or Flowers',
                vendors: [
                    { name: 'Ferns N Petals', description: 'Specializes in flowers, cakes, and personalized gifts.', priceRange: '₹800-3000', rating: 4.3, productQuery: 'cakes and flowers', customerCare: 'help@fnp.com' },
                    { name: 'Amazon', description: 'Vast selection of gifts for all ages and occasions.', priceRange: '₹500-10000', rating: 4.5, productQuery: `${reminder.title} gifts`, customerCare: '1800-3000-9009' }
                ]
            },
            {
                activity: 'Plan a Celebration Meal',
                vendors: [
                    { name: 'Zomato', description: 'Discover and book tables at top-rated restaurants.', priceRange: '₹1000-5000', rating: 4.6, productQuery: 'restaurants for dinner', customerCare: 'support@zomato.com' },
                    { name: 'Swiggy', description: 'Order a special meal from a wide range of restaurants.', priceRange: '₹800-4000', rating: 4.5, productQuery: 'gourmet food delivery', customerCare: 'support@swiggy.in' }
                ]
            }
        ];
    }
    
    // Health & Appointments
    if (type.includes('appointment') || type.includes('health') || type.includes('pet care')) {
        const isPet = type.includes('pet care');
        return [{
            activity: isPet ? 'Veterinary Services' : 'Book a Consultation',
            vendors: isPet ? [
                { name: 'Justdial', description: 'Find local veterinary clinics and pet services.', priceRange: '₹500-2000', rating: 4.2, productQuery: 'veterinary clinics near me', customerCare: '088888 88888'},
                { name: 'Supertails', description: 'Online vet consultations and pet supplies.', priceRange: '₹400-1500', rating: 4.6, productQuery: 'online vet consultation', customerCare: 'support@supertails.com'}
            ] : [
                { name: 'Practo', description: 'Find and book doctor appointments online.', priceRange: '₹500-1500', rating: 4.6, productQuery: 'doctor appointment', customerCare: 'support@practo.com' },
                { name: 'Apollo 24/7', description: 'Online pharmacy and doctor consultations.', priceRange: '₹400-1200', rating: 4.4, productQuery: 'online doctor', customerCare: 'helpdesk@apollo247.com' }
            ]
        }];
    }
    
    // Bills & Finance
    if (type.includes('bill') || type.includes('finance')) {
        return [{
            activity: 'Pay Bills & Manage Finances',
            vendors: [
                { name: 'Paytm', description: 'Pay any bill, recharge, and manage investments.', priceRange: 'Varies', rating: 4.7, productQuery: 'pay bills online', customerCare: '0120-4456-456' },
                { name: 'Cred', description: 'Pay credit card bills and earn rewards.', priceRange: 'Varies', rating: 4.8, productQuery: 'credit card bill payment', customerCare: 'support@cred.club' }
            ]
        }];
    }
    
    // Travel & Events
    if (type.includes('travel') || type.includes('event')) {
         return [
            {
                activity: 'Travel & Transport',
                vendors: [
                    { name: 'MakeMyTrip', description: 'Book flights, hotels, and holiday packages.', priceRange: '₹2000+', rating: 4.5, productQuery: 'flights to ' + title.split(' to ')[1] || 'goa', customerCare: '1-800-102 8747' },
                    { name: 'Uber', description: 'Book a cab for easy travel to your event or airport.', priceRange: '₹200-1500', rating: 4.4, productQuery: 'book a cab', customerCare: 'support@uber.com' }
                ]
            },
             {
                activity: 'Book Tickets',
                vendors: [
                    { name: 'BookMyShow', description: 'Book tickets for movies, concerts, and events.', priceRange: '₹300+', rating: 4.6, productQuery: 'event tickets', customerCare: '022 6144 5050'}
                ]
            }
        ];
    }
    
    // Home & Maintenance
    if (type.includes('home') || type.includes('car maintenance') || type.includes('home improvement')) {
        return [{
            activity: 'Home & Auto Services',
            vendors: [
                { name: 'Urban Company', description: 'Professional home services like cleaning, repairs, and more.', priceRange: '₹500-5000', rating: 4.7, productQuery: 'home cleaning services', customerCare: 'help@urbancompany.com' },
                { name: 'GoMechanic', description: 'Car servicing and repairs with free pick-up and delivery.', priceRange: '₹1500-10000', rating: 4.3, productQuery: 'car service', customerCare: '93888 93888' }
            ]
        }];
    }

    // Shopping
    if (type.includes('shopping')) {
        return [{
            activity: 'Shop Online',
            vendors: [
                { name: 'Zepto', description: '10-minute grocery delivery for your daily needs.', priceRange: '₹100-2000', rating: 4.6, productQuery: 'online grocery', customerCare: 'support@zeptonow.com' },
                { name: 'Flipkart', description: 'India\'s leading online marketplace for a wide range of products.', priceRange: 'Varies', rating: 4.4, productQuery: 'online shopping', customerCare: '1800-202-9898' }
            ]
        }];
    }

    // Renewals
    if (type.includes('renewal')) {
        return [{
            activity: 'Compare & Renew Policies',
            vendors: [
                { name: 'PolicyBazaar', description: 'Compare insurance policies from top insurers in India.', priceRange: 'Varies', rating: 4.5, productQuery: 'compare car insurance', customerCare: '1800-258-5970' },
                { name: 'Acko', description: 'Direct-to-consumer insurance provider with digital-first approach.', priceRange: 'Varies', rating: 4.6, productQuery: 'car insurance renewal', customerCare: 'hello@acko.com'}
            ]
        }];
    }

    // Learning & Personal Growth
    if (type.includes('learning') || type.includes('personal goal') || type.includes('hobby')) {
        return [{
            activity: 'Learn & Grow',
            vendors: [
                { name: 'Udemy', description: 'Online courses on a wide range of topics.', priceRange: '₹499+', rating: 4.5, productQuery: 'online courses', customerCare: 'support@udemy.com' },
                { name: 'Skillshare', description: 'Learn creative skills from experts and professionals.', priceRange: 'Subscription', rating: 4.6, productQuery: 'creative classes', customerCare: 'help@skillshare.com' }
            ]
        }];
    }

    // Default for anything else (Work, Personal, Fitness, etc.)
    return [{
        activity: 'Stay Productive & Healthy',
        vendors: [
            { name: 'Swiggy', description: 'Order a healthy meal or a quick snack to keep you going.', priceRange: '₹200-800', rating: 4.5, productQuery: 'healthy food', customerCare: 'support@swiggy.in' },
            { name: 'Cult.fit', description: 'Access fitness classes, gym sessions, and wellness content.', priceRange: 'Subscription', rating: 4.7, productQuery: 'fitness classes', customerCare: 'hello@cult.fit' }
        ]
    }];
};


// --- ORIGINAL SERVICE ---

// Caches for session-level storage to reduce API calls
const drinkPairingCache = new Map<string, string>();
const vendorActionCache = new Map<string, ActivityRecommendation[]>();
const serviceRecommendationCache = new Map<string, ActivityRecommendation[]>();
const recipeForReminderCache = new Map<string, Recipe[]>();
let kitchenTipCache: string | null = null;


// --- AI Direct Client-Side Invocation ---

// Per persona guidelines, the API key is assumed to be available in process.env.API_KEY.
// All AI calls are now made directly from the client, removing the need for Supabase Edge Functions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


// Generic function to process a JSON response directly from the AI
const generateAndParseJson = async (prompt: string, config: any) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });
        const text = response.text;
        
        if (!text) {
            throw new Error("AI returned an empty response.");
        }
        
        const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("[GeminiService] AI call or JSON parsing failed in generateAndParseJson:", e);
        const errorMessage = e instanceof Error ? e.message : "The AI returned an unexpected response format. Please try again.";
        throw new Error(errorMessage);
    }
};

// Generic function to get a text response directly from the AI
const generateText = async (prompt: string, config: any = {}) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });
        return response.text;
    } catch (e) {
        console.error("[GeminiService] AI text generation failed in generateText:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred with the AI service.";
        throw new Error(errorMessage);
    }
};


// --- JSON Schema Definitions for AI ---

const RECIPE_SCHEMA = {
    type: "OBJECT",
    properties: {
        id: { type: "STRING", description: "A unique ID for the recipe, can be a slugified name." },
        name: { type: "STRING" },
        description: { type: "STRING", description: "A brief, enticing description of the dish." },
        ingredients: { type: "ARRAY", items: { type: "STRING" } },
        instructions: { type: "ARRAY", items: { type: "STRING" } },
        imageUrl: { type: "STRING", description: "A placeholder image URL from an API like picsum.photos. The URL should be a direct image link." },
        isVeg: { type: "BOOLEAN" },
        cuisine: { type: "STRING" },
        rating: { type: "NUMBER", description: "A rating out of 5, e.g., 4.5" },
        cookTimeInMinutes: { type: "INTEGER" },
        servings: { type: "INTEGER" },
        price: { type: "NUMBER", description: "Estimated price in INR to order this dish from a restaurant." },
        deliveryVendors: { type: "ARRAY", items: { type: "STRING" }, description: "List of 2-3 popular Indian food delivery vendor names, e.g., 'Zomato', 'Swiggy'." },
        groceryVendors: { type: "ARRAY", items: { type: "STRING" }, description: "List of 2-3 popular Indian grocery vendor names, e.g., 'BigBasket', 'Zepto'." },
        difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
        calories: { type: "INTEGER", description: "Estimated calories per serving." }
    },
    required: ["id", "name", "description", "ingredients", "instructions", "isVeg", "cuisine", "rating", "cookTimeInMinutes", "servings", "price", "difficulty", "calories"]
};

const VENDOR_RECOMMENDATION_SCHEMA = {
    type: "ARRAY",
    items: {
        type: "OBJECT",
        properties: {
            activity: { type: "STRING" },
            vendors: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        description: { type: "STRING" },
                        priceRange: { type: "STRING" },
                        rating: { type: "NUMBER" },
                        productQuery: { type: "STRING" },
                        customerCare: { type: "STRING", description: "Customer care phone number or email." }
                    },
                    required: ["name", "description", "priceRange", "rating", "productQuery"]
                }
            }
        },
        required: ["activity", "vendors"]
    }
};


// --- Core AI Service Functions ---

export const analyzeReminder = async (prompt: string): Promise<Partial<Omit<Reminder, 'id'>>> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 500));
        const lowerPrompt = prompt.toLowerCase();
        const date = new Date();
        if (lowerPrompt.includes('tomorrow')) date.setDate(date.getDate() + 1);
        if (lowerPrompt.includes('next week')) date.setDate(date.getDate() + 7);
        return {
            title: prompt.split(' at ')[0],
            date: date,
            type: 'General',
            description: prompt
        };
    }
    try {
        const fullPrompt = `Analyze the user request and extract reminder details. Infer date relative to today, ${new Date().toDateString()}. Also, identify any recurrence patterns (e.g., 'every day', 'weekly', 'every 2 months'). If recurrence is found, provide frequency ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') and interval. If a field like title or date cannot be determined, omit it from the JSON response. Request: "${prompt}"`;
        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "The title of the reminder. Omit if not clear." },
                    date: { type: "STRING", description: "Inferred date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). Omit if not clear." },
                    type: { type: "STRING", description: "A category for the reminder, e.g., 'Birthday', 'Meeting', 'Personal Goal'." },
                    description: { type: "STRING", description: "A detailed description." },
                    recurrence_rule: { 
                        type: "OBJECT",
                        nullable: true,
                        properties: {
                            frequency: { type: "STRING", enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']},
                            interval: { type: "INTEGER" }
                        }
                    }
                },
                required: ["type", "description"]
            }
        };
        const parsed = await generateAndParseJson(fullPrompt, config);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error("AI returned an invalid object format for the reminder.");
        }
        
        return {
            title: parsed.title,
            date: parsed.date ? new Date(parsed.date) : undefined,
            type: parsed.type as ReminderType,
            description: parsed.description,
            recurrence_rule: parsed.recurrence_rule || null
        };
    } catch (error: any) {
        console.error("[GeminiService] Error analyzing reminder prompt:", error);
        return { description: prompt };
    }
};

export type DashboardSuggestionsResponse = {
    suggestions: Omit<Reminder, 'id'>[];
    dailyBriefing: string;
};

export const getDashboardSuggestions = async (existingReminders: Reminder[]): Promise<DashboardSuggestionsResponse> => {
    if (USE_MOCK_DATA) {
         await new Promise(res => setTimeout(res, 400));
         return {
             dailyBriefing: "Seize the day! Your schedule looks clear, a perfect opportunity to plan something exciting.",
             suggestions: [
                 { title: "Plan weekend trip", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), type: "Personal", description: "Research and book a getaway for the upcoming weekend." },
                 { title: "Check car tire pressure", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), type: "Vehicle", description: "Ensure tires are properly inflated for safety and efficiency." },
                 { title: "Organize digital photos", date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), type: "Home", description: "Sort and back up photos from the last month." },
             ]
         }
    }
    const todayReminders = existingReminders.filter(r => new Date(r.date).toDateString() === new Date().toDateString() && !r.is_completed);

    const context = existingReminders.length > 0
        ? `The user already has these upcoming reminders: ${existingReminders.slice(0, 5).map(r => r.title).join(', ')}.`
        : 'The user has no upcoming reminders.';
    
    const todayContext = todayReminders.length > 0
        ? `Specifically for today, they have: ${todayReminders.map(r => r.title).join(', ')}.`
        : "They have a clear schedule for today.";

    const prompt = `Based on the current date of ${new Date().toDateString()}, act as a friendly and proactive assistant for a user in India.
1. First, write a short, encouraging "Daily Briefing" (around 20-30 words). ${todayContext} The tone should be positive and motivating.
2. Second, suggest 3 new, relevant, and actionable reminders. ${context} Examples could be bill payments (e.g., "Pay Netflix Bill"), personal tasks (e.g., "Plan weekend trip"), or renewals (e.g., "Check car insurance options"). 
Provide a title, a future date, a type, and a brief, helpful description for each reminder.`;

    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: "OBJECT",
            properties: {
                dailyBriefing: { type: "STRING", description: "A short, positive daily summary and motivational message for the user." },
                suggestions: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING" },
                            date: { type: "STRING", description: "Inferred date in ISO 8601 format." },
                            type: { type: "STRING" },
                            description: { type: "STRING" }
                        },
                        required: ["title", "date", "type", "description"]
                    }
                }
            },
            required: ["dailyBriefing", "suggestions"]
        }
    };

    try {
        const suggestionsData = await generateAndParseJson(prompt, config);
        
        if (suggestionsData && Array.isArray(suggestionsData.suggestions)) {
            return {
                dailyBriefing: suggestionsData.dailyBriefing,
                suggestions: suggestionsData.suggestions.map((s: any) => ({...s, date: new Date(s.date)}))
            };
        }
        
        console.warn("[GeminiService] AI suggestions response was not in the expected format:", suggestionsData);
        return { suggestions: [], dailyBriefing: "Have a great day!" };
    } catch (error) {
        console.error("[GeminiService] Error getting dashboard suggestions:", error);
        throw error;
    }
}

export const getServiceRecommendations = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
    if (USE_MOCK_DATA) {
        return getMockServiceRecommendations(reminder);
    }
    const cacheKey = reminder.id;
    if (serviceRecommendationCache.has(cacheKey)) {
        return serviceRecommendationCache.get(cacheKey)!;
    }

    try {
        const prompt = `Based on the reminder titled "${reminder.title}" with description "${reminder.description}", follow these steps:
1. Identify 1-2 distinct activities a user might need to perform (e.g., 'Buy a Gift', 'Book a Doctor Appointment').
2. For each activity, brainstorm a single, generic but searchable product or service query. Example: for 'Buy a Gift' for a birthday, the query could be 'birthday gifts'. For 'Dentist Appointment', it could be 'dental clinics nearby'.
3. For each activity and its corresponding query, find 2-3 popular Indian vendors that provide this product/service.
4. For each vendor, provide: their name, a short description, a realistic price range in INR (as a string like "₹100-1000"), a rating out of 5, the product query from step 2, and a customer care contact (phone or email if available).`;
        
        const config = { responseMimeType: "application/json", responseSchema: VENDOR_RECOMMENDATION_SCHEMA };

        const recommendations = await generateAndParseJson(prompt, config);
        if (!Array.isArray(recommendations) || (recommendations.length > 0 && (typeof recommendations[0] !== 'object' || !('activity' in recommendations[0])))) {
            throw new Error("AI returned an invalid format for service recommendations.");
        }
        serviceRecommendationCache.set(cacheKey, recommendations);
        return recommendations;
    } catch (error) {
        console.error("[GeminiService] Error getting service recommendations:", error);
        throw error;
    }
};

export const extractFollowUpReminder = async (itemName: string, purchaseDate: Date): Promise<{ title: string; date: Date } | null> => {
     if (USE_MOCK_DATA) {
        if (itemName.toLowerCase().includes('insurance')) {
            const renewalDate = new Date(purchaseDate);
            renewalDate.setFullYear(renewalDate.getFullYear() + 1);
            return { title: `Renew ${itemName}`, date: renewalDate };
        }
        return null;
    }
    try {
        const prompt = `Analyze the purchased item: "${itemName}". The purchase was made on ${purchaseDate.toDateString()}. 
        Determine if this item typically requires a future follow-up action like renewal, repurchase, or maintenance (e.g., insurance, subscriptions, warranties, regular check-ups).
        If a follow-up is highly likely, provide a concise reminder title (e.g., "Renew car insurance") and a calculated future date for the reminder. 
        If no follow-up is needed, indicate that.`;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    requiresFollowUp: { type: "BOOLEAN", description: "Whether a follow-up reminder is needed." },
                    followUpTitle: { type: "STRING", description: "The title for the follow-up reminder. Omit if not needed." },
                    followUpDate: { type: "STRING", description: "The suggested future date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). Omit if not needed." }
                },
                required: ["requiresFollowUp"]
            }
        };

        const result = await generateAndParseJson(prompt, config);

        if (result && result.requiresFollowUp && result.followUpTitle && result.followUpDate) {
            const followUpDate = new Date(result.followUpDate);
            if (followUpDate > purchaseDate) {
                return { title: result.followUpTitle, date: followUpDate };
            }
        }
        return null;
    } catch (error) {
        console.error("[GeminiService] Error extracting follow-up reminder:", error);
        return null;
    }
};

export const getHolidays = async (year: number, country: string, region: string): Promise<{ holidayName: string; date: string }[]> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 600));
        if (country.toLowerCase() === 'india') {
            return [
                { holidayName: "Republic Day", date: `${year}-01-26` },
                { holidayName: "Holi", date: `${year}-03-25` },
                { holidayName: "Independence Day", date: `${year}-08-15` },
                { holidayName: "Gandhi Jayanti", date: `${year}-10-02` },
                { holidayName: "Diwali", date: `${year}-11-01` },
            ];
        }
        return [];
    }
    const prompt = `List all official public holidays for ${country} ${region ? `(specifically for the region/state of ${region})` : ''} in the year ${year}. Provide the holiday name and the exact date in 'YYYY-MM-DD' format.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    holidayName: { type: "STRING" },
                    date: { type: "STRING", description: "Date in YYYY-MM-DD format" }
                },
                required: ["holidayName", "date"]
            }
        }
    };
    const holidays = await generateAndParseJson(prompt, config);
    if (!Array.isArray(holidays)) {
        throw new Error("AI returned an invalid format for holidays.");
    }
    return holidays;
}

export const searchForServices = async (reminder: Reminder, query: string): Promise<ActivityRecommendation[]> => {
     if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 400));
        return [{
            activity: `Search results for "${query}"`,
            vendors: [
                { name: 'Urban Company', description: 'Professional home services.', priceRange: '₹300-2000', rating: 4.7, productQuery: query },
                { name: 'Justdial', description: 'Local search engine for various services.', priceRange: 'Varies', rating: 4.1, productQuery: query }
            ]
        }];
    }
    const prompt = `A user has a reminder titled "${reminder.title}" and is now searching for "${query}". 
    Based on this context, brainstorm one relevant activity and find 2-3 popular Indian vendors for that activity. 
    Provide vendor name, description, price range (INR), rating (out of 5), the specific product query, and customer care contact.`;
    const config = { responseMimeType: "application/json", responseSchema: VENDOR_RECOMMENDATION_SCHEMA };
    const results = await generateAndParseJson(prompt, config);
    if (!Array.isArray(results)) {
        throw new Error("AI returned an invalid format for service search.");
    }
    return results;
}

export const getRecipesForReminder = async (reminder: Reminder): Promise<Recipe[]> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 400));
        const allRecipes = mockDataService.getRecipes();
        return [allRecipes[0], allRecipes[1]];
    }
    const cacheKey = `recipe-${reminder.id}`;
    if (recipeForReminderCache.has(cacheKey)) {
        return recipeForReminderCache.get(cacheKey)!;
    }
    const prompt = `A user has a reminder for "${reminder.title}" on ${reminder.date.toDateString()}. Suggest 2-3 suitable and creative recipes for this occasion. Provide full details for each recipe.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: RECIPE_SCHEMA }
    };
    const recipes = await generateAndParseJson(prompt, config);
    if (!Array.isArray(recipes)) {
        throw new Error("AI returned an invalid format for reminder recipes.");
    }
    recipeForReminderCache.set(cacheKey, recipes);
    return recipes;
}

export const getRecipes = async (query: string, isVeg: boolean): Promise<Recipe[]> => {
     if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 500));
        const allRecipes = mockDataService.getRecipes();
        return allRecipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) && (isVeg ? r.isVeg : true)).slice(0,8);
    }
    const prompt = `Find 8 diverse recipes that match the query: "${query}". The user preference is vegetarian-only: ${isVeg}. Provide full details for each recipe, including a placeholder image URL.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: RECIPE_SCHEMA }
    };
    const recipes = await generateAndParseJson(prompt, config);
    if (!Array.isArray(recipes)) {
        throw new Error("AI returned an invalid format for recipe search.");
    }
    return recipes;
}

export const getRecipesByIngredients = async (ingredients: string, isVeg: boolean): Promise<Recipe[]> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 500));
        const allRecipes = mockDataService.getRecipes();
        const searchIngredients = ingredients.toLowerCase().split(',').map(i => i.trim());
        return allRecipes.filter(r => (isVeg ? r.isVeg : true) && searchIngredients.some(si => r.ingredients.join(' ').toLowerCase().includes(si))).slice(0, 4);
    }
    const prompt = `Based on the following ingredients a user has: "${ingredients}", suggest 2-3 creative recipes they could make. The user preference is vegetarian-only: ${isVeg}. Provide full details for each recipe, including a placeholder image URL.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: RECIPE_SCHEMA }
    };
    const recipes = await generateAndParseJson(prompt, config);
    if (!Array.isArray(recipes)) {
        throw new Error("AI returned an invalid format for ingredient-based recipe search.");
    }
    return recipes;
}

export const getDailyRecommendations = async (isVeg: boolean, history: string[]): Promise<DailyRecommendationResponse> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 100)); // Super fast in mock mode
        return mockDataService.getDailyRecommendations(isVeg);
    }
    const historyPrompt = history.length > 0 ? `To ensure variety, avoid suggesting these recipes they've seen recently: ${history.slice(-30).join(', ')}.` : '';
    const prompt = `Act as a creative chef for a user in India. Today's date is ${new Date().toDateString()}.
1. Create an inspiring theme for today's meals (e.g., 'Monsoon Munchies', 'Healthy Summer Delights').
2. Based on this theme, suggest 4 recipes for each of these categories: breakfast, lunch, hitea, dinner, all_time_snacks.
3. The user preference is vegetarian-only: ${isVeg}.
4. ${historyPrompt}
5. Provide full details for each recipe as per the schema.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: "OBJECT",
            properties: {
                theme: { type: "STRING" },
                breakfast: { type: "ARRAY", items: RECIPE_SCHEMA },
                lunch: { type: "ARRAY", items: RECIPE_SCHEMA },
                hitea: { type: "ARRAY", items: RECIPE_SCHEMA },
                dinner: { type: "ARRAY", items: RECIPE_SCHEMA },
                all_time_snacks: { type: "ARRAY", items: RECIPE_SCHEMA },
            },
            required: ["theme", "breakfast", "lunch", "hitea", "dinner", "all_time_snacks"]
        }
    };
    const recommendations = await generateAndParseJson(prompt, config);
    return recommendations as DailyRecommendationResponse;
}

export const shuffleRecipeCategory = async (category: string, isVeg: boolean, history: string[]): Promise<Recipe[]> => {
     if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 300));
        const dailyRecs = mockDataService.getDailyRecommendations(isVeg);
        // Just return a different slice for variety in mock
        const allRecipes = mockDataService.getRecipes().filter(r => isVeg ? r.isVeg : true);
        const randomIndex = Math.floor(Math.random() * (allRecipes.length - 4));
        return allRecipes.slice(randomIndex, randomIndex + 4);
    }
    const historyPrompt = history.length > 0 ? `Avoid suggesting these recipes they've seen recently: ${history.slice(-30).join(', ')}.` : '';
    const prompt = `Suggest four new recipes for the '${category}' category for a user in India. The user preference is vegetarian-only: ${isVeg}. ${historyPrompt} Provide full details for each recipe.`;
    const config = {
        responseMimeType: "application/json",
        responseSchema: { type: "ARRAY", items: RECIPE_SCHEMA }
    };
    const recipes = await generateAndParseJson(prompt, config);
    if (!Array.isArray(recipes)) {
        throw new Error("AI returned an invalid format for recipe shuffle.");
    }
    return recipes;
}

export const getVendorsForRecipeAction = async (recipe: Recipe, action: string): Promise<ActivityRecommendation[]> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 300));
        let vendors: VendorSuggestion[] = [];
        if (action === 'Buy Ingredients') {
            vendors = [
                { name: 'BigBasket', description: 'Indias largest online supermarket.', priceRange: 'Varies', rating: 4.5, productQuery: recipe.ingredients.join(', ') },
                { name: 'Zepto', description: '10-minute grocery delivery.', priceRange: 'Varies', rating: 4.6, productQuery: 'fresh vegetables' }
            ]
        } else if (action === 'Order Online') {
            vendors = [
                { name: 'Zomato', description: 'Order from a wide range of restaurants.', priceRange: '₹300-1000', rating: 4.4, productQuery: recipe.name },
                { name: 'Swiggy', description: 'Fast food delivery from nearby restaurants.', priceRange: '₹250-900', rating: 4.5, productQuery: recipe.name }
            ]
        } else { // Hire a Chef
             vendors = [
                { name: 'Urban Company', description: 'Book professional chefs for special occasions.', priceRange: '₹2000-8000', rating: 4.7, productQuery: 'hire a chef' }
            ]
        }
        return [{ activity: action, vendors }];
    }
    const cacheKey = `${recipe.id}-${action}`;
    if (vendorActionCache.has(cacheKey)) {
        return vendorActionCache.get(cacheKey)!;
    }
    const prompt = `For the recipe "${recipe.name}", the user wants to '${action}'.
1. Brainstorm one activity for this action (e.g., 'Buy Groceries Online', 'Order from Restaurants').
2. Find 2-3 popular Indian vendors relevant to this activity.
3. Provide vendor details: name, description, price range (INR), rating (out of 5), a relevant product query, and customer care contact.`;
    const config = { responseMimeType: "application/json", responseSchema: VENDOR_RECOMMENDATION_SCHEMA };
    const recommendations = await generateAndParseJson(prompt, config);
    if (!Array.isArray(recommendations)) {
        throw new Error("AI returned an invalid format for vendor recommendations.");
    }
    vendorActionCache.set(cacheKey, recommendations);
    return recommendations;
}

export const getAiKitchenTip = async (): Promise<string> => {
     if (USE_MOCK_DATA) {
        return "To keep your ginger fresh longer, store it in the freezer. It's also much easier to grate when frozen!";
    }
    if (kitchenTipCache) return kitchenTipCache;
    const prompt = "Give me a single, clever, and brief kitchen tip or food fact that would be interesting for a home cook in India.";
    const tip = await generateText(prompt);
    kitchenTipCache = tip;
    return tip;
}

export const getDrinkPairing = async (recipeName: string, cuisine: string): Promise<string> => {
     if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 200));
        return `A refreshing Nimbu Pani (Indian lemonade) with a hint of mint would cut through the richness of this ${cuisine} dish perfectly.`;
    }
    const cacheKey = `${recipeName}-${cuisine}`;
    if (drinkPairingCache.has(cacheKey)) {
        return drinkPairingCache.get(cacheKey)!;
    }
    const prompt = `What is a good non-alcoholic drink pairing for "${recipeName}", which is a ${cuisine} dish? Suggest one creative option and briefly explain why it pairs well.`;
    const pairing = await generateText(prompt);
    drinkPairingCache.set(cacheKey, pairing);
    return pairing;
}

export const getAnalyticsInsights = async (reminders: Reminder[], orders: Order[]): Promise<string> => {
    if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 800));
        return `
# Productivity Snapshot
You're doing great at keeping up with your **Finance** and **Health** reminders, with the highest completion rates in these categories.

# Spending Habits
Your spending is highest on **Food Delivery**, followed by **Shopping**. There's an opportunity to optimize here.

# Personalized Tips
*   **Meal Prep:** Since you order food often, try using our recipe feature to plan and cook meals for a few days. This could save you a significant amount.
*   **Automate Bills:** You have several recurring "Bill Payment" reminders. Consider setting up auto-pay for these to save time and avoid late fees.
        `;
    }
    const relevantReminders = reminders
        .filter(r => r.is_completed)
        .map(({ title, type, date }) => ({ title, type, date }));

    const relevantOrders = orders.map(({ total, date, items }) => ({
        total,
        date,
        itemCount: items.length,
    }));

    // Limit data sent to the API to avoid overly long prompts
    const dataSummary = JSON.stringify({ completedReminders: relevantReminders.slice(0, 20), recentOrders: relevantOrders.slice(0, 10) }, null, 2);

    const prompt = `As an expert productivity and finance assistant, analyze the following user data. Provide a concise, actionable summary of their habits based on completed reminders and order history. The analysis should be in markdown format and include:
1.  A short "Productivity Snapshot" heading.
2.  A brief "Spending Habits" heading.
3.  A bulleted list under a "Personalized Tips" heading with 2-3 actionable tips for improvement.

User Data:
${dataSummary}`;
    
    const insights = await generateText(prompt);
    return insights;
};

export const analyzeSmsForReminders = async (smsText: string): Promise<Omit<Reminder, 'id'>[]> => {
     if (USE_MOCK_DATA) {
        await new Promise(res => setTimeout(res, 600));
        const suggestions = [];
        const date = new Date();
        date.setDate(date.getDate() + 2);
        if (smsText.toLowerCase().includes('payment') || smsText.toLowerCase().includes('bill')) {
            suggestions.push({
                title: "Pay Electricity Bill",
                date: date,
                type: 'Bill Payment',
                description: 'Detected from SMS: Your electricity bill is due soon.'
            });
        }
        if (smsText.toLowerCase().includes('appointment') || smsText.toLowerCase().includes('dr.')) {
            suggestions.push({
                title: "Confirm Doctor's Appointment",
                date: date,
                type: 'Appointment',
                description: 'Detected from SMS: Follow-up appointment.'
            });
        }
        return suggestions;
    }
    try {
        const fullPrompt = `Analyze the following text, which contains one or more SMS messages from a user in India. Identify any actionable reminders like appointments, bill due dates, OTPs for transactions, or package deliveries. For each valid reminder found, extract a concise title, a specific date and time (in ISO 8601 format, inferring relative to today, ${new Date().toDateString()}), a helpful description, and a relevant type (e.g., 'Bill Payment', 'Appointment', 'Delivery', 'Travel'). Ignore purely conversational messages, marketing spam, and OTP messages that are not linked to a future action. Return the results as a JSON array of reminder objects. If no reminders are found, return an empty array.

SMS Text:
"${smsText}"`;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        date: { type: "STRING", description: "Inferred date in ISO 8601 format." },
                        type: { type: "STRING" },
                        description: { type: "STRING" }
                    },
                    required: ["title", "date", "type", "description"]
                }
            }
        };

        const parsed = await generateAndParseJson(fullPrompt, config);

        if (!Array.isArray(parsed)) {
            throw new Error("AI returned a non-array format for SMS reminders.");
        }

        // Convert date strings to Date objects
        return parsed.map((r: any) => ({ ...r, date: new Date(r.date) }));

    } catch (error) {
        console.error("[GeminiService] Error analyzing SMS for reminders:", error);
        throw error;
    }
};