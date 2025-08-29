

import { supabase } from './supabaseClient';
import { Reminder, ReminderType, Recipe, ActivityRecommendation, DailyRecommendationResponse, Order } from '../types';

// Caches for session-level storage to reduce API calls
const drinkPairingCache = new Map<string, string>();
const vendorActionCache = new Map<string, ActivityRecommendation[]>();
const serviceRecommendationCache = new Map<string, ActivityRecommendation[]>();
const recipeForReminderCache = new Map<string, Recipe[]>();
let kitchenTipCache: string | null = null;

// Generic function to call the Gemini API via the Supabase Edge Function proxy
const invokeGeminiProxy = async (prompt: string, config: any) => {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: { prompt, config },
        });

        if (error) {
            console.error('Edge function invocation error:', error);
            throw new Error(`Edge function invocation failed: ${error.message}`);
        }

        if (data.error) {
             throw new Error(data.error);
        }
        
        return data.text;

    } catch (e) {
        console.error("Gemini proxy call failed:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        if (errorMessage.includes('fetch')) {
             throw new Error("A network error occurred while connecting to the AI service.");
        }
        throw new Error(`AI Service Error: ${errorMessage}`);
    }
};


// Generic function to process a JSON response from the proxy
const generateAndParseJson = async (prompt: string, config: any) => {
    const text = await invokeGeminiProxy(prompt, config);
    
    if (!text) {
        throw new Error("AI returned an empty response.");
    }
    
    try {
        const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("JSON parsing failed for AI response:", text, e);
        throw new Error("The AI returned an unexpected response format. Please try again.");
    }
};

// Generic function to get a text response from the proxy
const generateText = async (prompt: string, config: any = {}) => {
     return await invokeGeminiProxy(prompt, config);
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
                    recurrenceRule: { 
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
            recurrenceRule: parsed.recurrenceRule || null
        };
    } catch (error: any) {
        console.error("Error analyzing reminder:", error);
        return { description: prompt };
    }
};

export type DashboardSuggestionsResponse = {
    suggestions: Omit<Reminder, 'id'>[];
    dailyBriefing: string;
};

export const getDashboardSuggestions = async (existingReminders: Reminder[]): Promise<DashboardSuggestionsResponse> => {
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
        // Refactored to use the generic JSON parser which calls the 'gemini-proxy' function.
        // This standardizes all AI calls and removes the problematic direct call to 'gemini-suggestions'.
        const suggestionsData = await generateAndParseJson(prompt, config);
        
        if (suggestionsData && Array.isArray(suggestionsData.suggestions)) {
            return {
                dailyBriefing: suggestionsData.dailyBriefing,
                suggestions: suggestionsData.suggestions.map((s: any) => ({...s, date: new Date(s.date)}))
            };
        }
        
        // Fallback in case of unexpected format from AI, though generateAndParseJson should throw.
        console.warn("AI suggestions response was not in the expected format:", suggestionsData);
        return { suggestions: [], dailyBriefing: "Have a great day!" };
    } catch (error) {
        console.error("Error getting dashboard suggestions:", error);
        // The error is already wrapped by invokeGeminiProxy, so just re-throw it.
        throw error;
    }
}

export const getServiceRecommendations = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
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
        console.error("Error getting service recommendations:", error);
        throw error;
    }
};

export const extractFollowUpReminder = async (itemName: string, purchaseDate: Date): Promise<{ title: string; date: Date } | null> => {
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
        console.error("Error extracting follow-up reminder:", error);
        return null;
    }
};

export const getHolidays = async (year: number, country: string, region: string): Promise<{ holidayName: string; date: string }[]> => {
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

export const getDailyRecommendations = async (isVeg: boolean, history: string[]): Promise<DailyRecommendationResponse> => {
    const historyPrompt = history.length > 0 ? `To ensure variety, avoid suggesting these recipes they've seen recently: ${history.slice(-30).join(', ')}.` : '';
    const prompt = `Act as a creative chef for a user in India. Today's date is ${new Date().toDateString()}.
1. Create an inspiring theme for today's meals (e.g., 'Monsoon Munchies', 'Healthy Summer Delights').
2. Based on this theme, suggest 1-2 recipes for each of these categories: breakfast, lunch, hitea, dinner, all_time_snacks.
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
    const historyPrompt = history.length > 0 ? `Avoid suggesting these recipes they've seen recently: ${history.slice(-30).join(', ')}.` : '';
    const prompt = `Suggest two new recipes for the '${category}' category for a user in India. The user preference is vegetarian-only: ${isVeg}. ${historyPrompt} Provide full details for each recipe.`;
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
    if (kitchenTipCache) return kitchenTipCache;
    const prompt = "Give me a single, clever, and brief kitchen tip or food fact that would be interesting for a home cook in India.";
    const tip = await generateText(prompt);
    kitchenTipCache = tip;
    return tip;
}

export const getDrinkPairing = async (recipeName: string, cuisine: string): Promise<string> => {
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
