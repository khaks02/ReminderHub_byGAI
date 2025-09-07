import { Reminder, Recipe, ActivityRecommendation, DailyRecommendationResponse, Order, VendorSuggestion, CartItemType, FollowUpReminder } from '../types';
import { USE_MOCK_DATA } from '../config';
import * as mockDataService from './mockDataService';
import { Type } from '@google/genai';
import { supabase } from './supabaseClient';


/**
 * Invokes the 'gemini-proxy' Supabase Edge Function to securely call the Gemini API.
 * @param type The type of operation to perform ('generateContent' or 'generateImages').
 * @param payload The data to send to the Gemini API.
 * @returns The result from the Gemini API.
 */
const invokeGeminiProxy = async (type: 'generateContent' | 'generateImages', payload: any) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { type, payload }
    });

    if (error) {
         throw new Error(`[GeminiProxy] ${error.message}`);
    }
    
    if (data && data.error) {
        throw new Error(`[GeminiProxy] ${data.error}`);
    }
    return data;
};


/**
 * Generates content from the Gemini API and parses the response as JSON.
 * @param prompt The text prompt to send to the model.
 * @param config The generation configuration, including response schema.
 * @returns A parsed JSON object.
 */
const generateAndParseJson = async (prompt: string, config: any) => {
    try {
        const payload = {
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        };
        const response = await invokeGeminiProxy('generateContent', payload);

        const text = response.text;
        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }
        
        // Clean up potential markdown formatting before parsing.
        const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("[GeminiService] AI JSON generation failed:", error);
        throw new Error(`AI service failed to generate a valid JSON response. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Generates a plain text response from the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @param config Optional generation configuration.
 * @returns A string containing the model's response.
 */
const generateText = async (prompt: string, config: any = {}) => {
    try {
        const payload = {
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        };
        const response = await invokeGeminiProxy('generateContent', payload);
        return response.text;
    } catch (error) {
        console.error("[GeminiService] AI text generation failed:", error);
        throw new Error(`AI service failed to generate text. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};


// --- JSON Schema Definitions for AI ---
const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "A unique kebab-case identifier for the recipe." },
    name: { type: Type.STRING },
    description: { type: Type.STRING, description: "A brief, enticing one-paragraph description of the dish." },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    isVeg: { type: Type.BOOLEAN },
    cuisine: { type: Type.STRING, description: "The cuisine of the dish (e.g., 'North Indian', 'Italian')." },
    rating: { type: Type.NUMBER, description: "A realistic rating out of 5, with one decimal place (e.g., 4.5)." },
    cookTimeInMinutes: { type: Type.INTEGER },
    servings: { type: Type.INTEGER },
    price: { type: Type.NUMBER, description: "An estimated price in INR for ordering this dish from a restaurant." },
    deliveryVendors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 popular food delivery vendors in India (e.g., 'Zomato', 'Swiggy')." },
    groceryVendors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2-3 popular grocery delivery vendors in India (e.g., 'BigBasket', 'Zepto')." },
    difficulty: { type: Type.STRING, description: "Can be 'Easy', 'Medium', or 'Hard'." },
    calories: { type: Type.INTEGER },
  },
  required: [
    "id", "name", "description", "ingredients", "instructions", "isVeg", "cuisine", "rating",
    "cookTimeInMinutes", "servings", "price", "deliveryVendors", "groceryVendors", "difficulty", "calories"
  ]
};
const VENDOR_RECOMMENDATION_SCHEMA = {
  type: Type.ARRAY,
  description: "A list of suggested activities and corresponding vendors.",
  items: {
    type: Type.OBJECT,
    properties: {
      activity: { 
        type: Type.STRING, 
        description: "A suggested activity related to the reminder, like 'Buy a Birthday Gift' or 'Book a Table for Anniversary Dinner'." 
      },
      vendors: {
        type: Type.ARRAY,
        description: "A list of 2-3 relevant and popular vendors for the suggested activity.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { 
              type: Type.STRING, 
              description: "The official name of the vendor or service provider (e.g., 'Amazon.in', 'Zomato', 'Urban Company')." 
            },
            description: { 
              type: Type.STRING, 
              description: "A brief, compelling, one-sentence description of the vendor's service relevant to the activity." 
            },
            priceRange: { 
              type: Type.STRING, 
              description: "An estimated price range in Indian Rupees (INR), formatted as '₹XXX-XXXX' (e.g., '₹500-2000')." 
            },
            rating: { 
              type: Type.NUMBER, 
              description: "A realistic numerical rating out of 5, with one decimal place (e.g., 4.5)." 
            },
            productQuery: { 
              type: Type.STRING, 
              description: "A concise, effective search query for finding relevant items from this vendor (e.g., 'red roses bouquet', 'paneer butter masala', 'plumber service')." 
            },
            customerCare: { 
              type: Type.STRING, 
              description: "Optional. A customer care number or contact email if commonly available." 
            }
          },
          required: ["name", "description", "priceRange", "rating", "productQuery"],
        },
      },
    },
    required: ["activity", "vendors"],
  },
};
const MOCK_PRODUCT_DETAILS_SCHEMA = {
  type: Type.ARRAY,
  description: "A list of 4 product suggestions with names and prices.",
  items: {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: "The specific, concise name of the product or service."
      },
      price: {
        type: Type.NUMBER,
        description: "The estimated price of the product in INR."
      }
    },
    required: ["productName", "price"]
  }
};

// --- Core AI Service Functions ---
const PLACEHOLDER_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNhYWEiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

const generateProductImage = async (productName: string): Promise<string> => {
    try {
        const payload = {
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, clean product photograph of "${productName}" for an e-commerce website, on a plain white background.`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
        };
        const response = await invokeGeminiProxy('generateImages', payload);
        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        return base64ImageBytes ? `data:image/jpeg;base64,${base64ImageBytes}` : PLACEHOLDER_IMAGE_URL;
    } catch (error) {
        console.error(`[GeminiService] Image generation failed for "${productName}":`, error);
        return PLACEHOLDER_IMAGE_URL;
    }
}

export const getMockProductsForVendor = async (vendorName: string, productQuery: string): Promise<{ productName: string; price: number; imageUrl: string }[]> => {
    if (USE_MOCK_DATA) return mockDataService.getMockProductsForVendorMock(vendorName, productQuery);
    
    const detailsPrompt = `You are a shopping assistant for a user in India. For the vendor "${vendorName}", generate a list of 4 realistic and specific product or service suggestions a user might find when searching for "${productQuery}". Provide only a concise product name and an estimated price in INR.`;
    const detailsConfig = { responseMimeType: "application/json", responseSchema: MOCK_PRODUCT_DETAILS_SCHEMA };
    const productDetails: { productName: string; price: number }[] = await generateAndParseJson(detailsPrompt, detailsConfig);

    if (!Array.isArray(productDetails)) throw new Error("AI returned an invalid format for mock product details.");
    
    return Promise.all(
        productDetails.map(async (product: { productName: string; price: number }) => {
            const imageUrl = await generateProductImage(product.productName);
            return {
                ...product,
                imageUrl,
            };
        })
    );
};

export const analyzeReminder = async (prompt: string): Promise<Partial<Omit<Reminder, 'id'>>> => {
    if (USE_MOCK_DATA) return mockDataService.analyzeReminderMock(prompt);

    const systemInstruction = `You are an intelligent scheduling assistant for an app called myreminder. Analyze the user's text and extract the details for a new reminder. The current year is ${new Date().getFullYear()}. If the user says 'tomorrow', it is relative to today, ${new Date().toDateString()}. If no time is specified, default to 9:00 AM. Ensure the date is a valid future date. The reminder type should be a concise category like 'Work', 'Birthday', 'Appointment', 'Bill Payment', 'Personal Goal', etc.`;
    const analysisPrompt = `Analyze the following text and extract reminder details:\n\n"${prompt}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            date: { type: Type.STRING, description: 'A valid ISO 8601 date-time string.' },
            type: { type: Type.STRING },
            description: { type: Type.STRING, description: "A detailed description, if any. Otherwise, can be an empty string." },
        },
        required: ["title", "date", "type"],
    };
    const config = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
    };
    const result = await generateAndParseJson(analysisPrompt, config);
    return { ...result, date: new Date(result.date) };
};

export const getHolidays = async (year: number, country: string, region: string): Promise<{ holidayName: string; date: string }[]> => {
    const prompt = `List all major public holidays and significant festivals for ${country}${region ? `, specifically for the region/state of ${region},` : ''} for the year ${year}. Focus on the most widely celebrated ones.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            holidays: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        holidayName: { type: Type.STRING, description: "The name of the holiday." },
                        date: { type: Type.STRING, description: "The date in YYYY-MM-DD format." }
                    },
                    required: ["holidayName", "date"]
                }
            }
        },
        required: ["holidays"]
    };
    const config = {
        responseMimeType: "application/json",
        responseSchema: schema
    };
    const result = await generateAndParseJson(prompt, config);
    return result.holidays || [];
};

export const getDashboardSuggestions = async (reminders: Reminder[]): Promise<{ suggestions: Omit<Reminder, 'id'>[], dailyBriefing: string }> => {
    if (USE_MOCK_DATA) return mockDataService.getDashboardSuggestionsMock();
    
    const upcomingReminders = reminders
        .filter(r => !r.is_completed && new Date(r.date) > new Date())
        .slice(0, 5)
        .map(r => `- ${r.title} on ${new Date(r.date).toLocaleDateString()}`)
        .join('\n');
    
    const prompt = `You are a proactive AI assistant. Based on the user's upcoming reminders, generate a short, encouraging daily briefing (1-2 sentences) and suggest 2-3 new, relevant reminders they might have forgotten. For example, if they have a "Mom's Birthday" reminder, suggest "Buy birthday gift for Mom". If they have a work deadline, suggest "Prepare presentation slides". Keep suggestions concise.
    
    Upcoming Reminders:
    ${upcomingReminders || "None"}
    
    Today's Date: ${new Date().toDateString()}`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            dailyBriefing: { type: Type.STRING, description: "A short, friendly, and encouraging daily summary. Mention the number of upcoming tasks." },
            suggestions: {
                type: Type.ARRAY,
                description: "A list of 2-3 suggested new reminders.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING, description: "A suggested ISO 8601 date-time string, should be in the future." },
                        type: { type: Type.STRING, description: "A relevant category like 'Shopping' or 'Work'." },
                        description: { type: Type.STRING, description: "A brief description for context." }
                    },
                    required: ["title", "date", "type", "description"]
                }
            }
        },
        required: ["dailyBriefing", "suggestions"]
    };
    const config = {
        responseMimeType: "application/json",
        responseSchema: schema
    };

    let result;
    try {
        result = await generateAndParseJson(prompt, config);
    } catch (error) {
        console.error('[GeminiService] getDashboardSuggestions: Failed to get AI suggestions:', error);
        // Return a default, empty state to prevent app crash
        return { dailyBriefing: "Couldn't load suggestions, but have a great day!", suggestions: [] };
    }

    if (!result || !Array.isArray(result.suggestions)) {
        console.warn('[GeminiService] getDashboardSuggestions: AI response did not contain a valid `suggestions` array.', result);
        return {
            dailyBriefing: result?.dailyBriefing || "Couldn't load suggestions, but have a great day!",
            suggestions: []
        };
    }

    const suggestionsWithDates = result.suggestions.map((s: any) => ({
        ...s,
        date: new Date(s.date)
    }));

    return { ...result, suggestions: suggestionsWithDates };
};

export const getServiceRecommendations = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
    if (USE_MOCK_DATA) return mockDataService.getServiceRecommendationsMock(reminder);
    
    const prompt = `You are a helpful assistant integrated into a reminders app. For the reminder titled "${reminder.title}" of type "${reminder.type}", suggest 1-2 relevant activities a user could perform. For each activity, suggest 2-3 popular and relevant vendors or services available in India. Provide realistic ratings and price ranges in INR.
    
    Reminder Description: "${reminder.description}"`;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: VENDOR_RECOMMENDATION_SCHEMA
    };

    return generateAndParseJson(prompt, config);
};

export const searchForServices = async (reminder: Reminder, searchQuery: string): Promise<ActivityRecommendation[]> => {
    const prompt = `You are a service recommendation engine. A user has a reminder titled "${reminder.title}" and is now searching for "${searchQuery}".
    Generate a single activity named "Search Results for '${searchQuery}'" and find 2-3 highly relevant vendors or services in India that match this search. Provide realistic details.`;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: VENDOR_RECOMMENDATION_SCHEMA
    };

    return generateAndParseJson(prompt, config);
};

export const getRecipes = async (query: string, isVeg: boolean): Promise<Recipe[]> => {
    if (USE_MOCK_DATA) return mockDataService.getRecipesMock(query);
    
    const prompt = `Find 4 recipes matching the query "${query}". ${isVeg ? "The recipes MUST be vegetarian." : ""} Provide all details as per the schema. The response must be a JSON array of recipe objects.`;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: RECIPE_SCHEMA
        }
    };
    
    return generateAndParseJson(prompt, config);
};

export const getDailyRecommendations = async (vegetarian: boolean, history: string[]): Promise<DailyRecommendationResponse> => {
    if (USE_MOCK_DATA) return mockDataService.getDailyRecommendationsMock();
    
    const historyPrompt = history.length > 0 ? `To ensure variety, avoid suggesting these recipes if possible: ${history.slice(-10).join(', ')}.` : '';

    const prompt = `You are an expert Indian chef. Create a full-day meal plan for today.
    - Generate a creative theme for the day (e.g., "A Taste of Punjab", "Monsoon Comfort Food").
    - Suggest one unique recipe for each category: breakfast, lunch, hi-tea, dinner, and all-time snacks.
    - ${vegetarian ? "All recipes MUST be vegetarian." : "Include a mix of vegetarian and non-vegetarian options."}
    - ${historyPrompt}
    - Provide complete details for each recipe as per the schema.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            theme: { type: Type.STRING },
            breakfast: { type: Type.ARRAY, items: RECIPE_SCHEMA, maxItems: 1, minItems: 1 },
            lunch: { type: Type.ARRAY, items: RECIPE_SCHEMA, maxItems: 1, minItems: 1 },
            hitea: { type: Type.ARRAY, items: RECIPE_SCHEMA, maxItems: 1, minItems: 1 },
            dinner: { type: Type.ARRAY, items: RECIPE_SCHEMA, maxItems: 1, minItems: 1 },
            all_time_snacks: { type: Type.ARRAY, items: RECIPE_SCHEMA, maxItems: 1, minItems: 1 },
        },
        required: ["theme", "breakfast", "lunch", "hitea", "dinner", "all_time_snacks"]
    };

    const config = {
        responseMimeType: "application/json",
        responseSchema: schema
    };

    return generateAndParseJson(prompt, config);
};

export const shuffleRecipeCategory = async (category: string, isVeg: boolean, history: string[]): Promise<Recipe[]> => {
    const historyPrompt = history.length > 0 ? `To ensure variety, avoid suggesting these recipes if possible: ${history.slice(-10).join(', ')}.` : '';
    const prompt = `Suggest 4 new recipes for the meal category "${category}".
    ${isVeg ? "The recipes MUST be vegetarian." : ""}
    ${historyPrompt}
    Provide complete details for each recipe as per the schema. The response must be a JSON array.`;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: RECIPE_SCHEMA
        }
    };
    
    return generateAndParseJson(prompt, config);
};

export const getVendorsForRecipeAction = async (recipe: Recipe, action: 'Buy Ingredients' | 'Order Online' | 'Hire a Chef'): Promise<ActivityRecommendation[]> => {
    const ingredientList = recipe.ingredients.slice(0, 5).join(', ');
    const prompt = `For the recipe "${recipe.name}", the user wants to "${action}".
    
    - If buying ingredients, suggest grocery vendors.
    - If ordering online, suggest food delivery platforms.
    - If hiring a chef, suggest services that provide chefs for home cooking.
    
    Suggest 1 activity and 2-3 relevant vendors in India. For the 'productQuery', create a relevant search term. Example for 'Buy Ingredients': "${ingredientList}". Example for 'Order Online': "${recipe.name}".`;

    const config = {
        responseMimeType: "application/json",
        responseSchema: VENDOR_RECOMMENDATION_SCHEMA
    };

    return generateAndParseJson(prompt, config);
};

export const getAiKitchenTip = async (): Promise<string> => {
    const prompt = "Provide a single, clever, and uncommon kitchen tip or cooking hack that would be useful for a home cook in India. Keep it to one or two sentences.";
    return generateText(prompt);
};

export const getDrinkPairing = async (recipeName: string, cuisine: string): Promise<string> => {
    const prompt = `What is a good beverage pairing for "${recipeName}", which is a ${cuisine} dish? Suggest one alcoholic and one non-alcoholic option. Be creative and brief (1-2 sentences total).`;
    return generateText(prompt);
};

export const getRecipesByIngredients = async (ingredientsQuery: string, isVeg: boolean): Promise<Recipe[]> => {
    const prompt = `Find 4 recipes that primarily use the following ingredients: ${ingredientsQuery}.
    ${isVeg ? "The recipes MUST be vegetarian." : ""}
    Provide all details as per the schema. The response must be a JSON array of recipe objects.`;
    
    const config = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: RECIPE_SCHEMA
        }
    };
    
    return generateAndParseJson(prompt, config);
};

export const getAnalyticsInsights = async (reminders: Reminder[], orders: Order[]): Promise<string> => {
    if (USE_MOCK_DATA) return mockDataService.getAnalyticsInsightsMock();

    const reminderSummary = reminders.length > 0 ? `User has ${reminders.length} total reminders. Types: ${[...new Set(reminders.map(r => r.type))].join(', ')}.` : 'User has no reminders.';
    const orderSummary = orders.length > 0 ? `User has ${orders.length} orders, with a total spend of roughly ₹${orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}.` : 'User has no orders.';
    
    const prompt = `You are a data analyst AI. Analyze the following user data from the 'myreminder' app and provide actionable insights in Markdown format.
    
    Data Summary:
    - ${reminderSummary}
    - ${orderSummary}
    
    Your analysis should have three sections:
    1. A "Productivity Snapshot" summarizing their reminder habits.
    2. A "Spending Habits" section based on their orders.
    3. A "Personalized Tips" section with 2-3 actionable tips to help them use the app more effectively.
    
    Be positive, encouraging, and concise.`;
    
    return generateText(prompt);
};

export const extractFollowUpReminder = async (itemType: CartItemType, orderDate: Date): Promise<FollowUpReminder | null> => {
    const prompt = `A user just purchased an item of type '${itemType}' on ${orderDate.toDateString()}. Should a follow-up reminder be created?
    For example, a 'Bill Payment' might need a reminder next month. An 'Insurance' service might need one next year. A 'PREPARED_DISH' order likely needs no follow-up.
    
    If a follow-up is needed, provide a suitable title and a future date. If not, respond with nulls.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, nullable: true },
            date: { type: Type.STRING, description: "A valid future ISO 8601 date-time string.", nullable: true }
        }
    };
    const config = {
        responseMimeType: "application/json",
        responseSchema: schema
    };

    const result = await generateAndParseJson(prompt, config);

    if (result && result.title && result.date) {
        return {
            title: result.title,
            date: new Date(result.date)
        };
    }
    return null;
};