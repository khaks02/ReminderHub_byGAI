
import { GoogleGenAI, Type } from "@google/genai";
import { Reminder, ReminderType, Service, Recipe, RecurrenceRule, ActivityRecommendation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReminder = async (prompt: string): Promise<Omit<Reminder, 'id'>> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the user request and extract reminder details. Infer date relative to today, ${new Date().toDateString()}. Also, identify any recurrence patterns (e.g., 'every day', 'weekly', 'every 2 months'). If recurrence is found, provide frequency ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') and interval. Request: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING, description: "Inferred date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)" },
                        type: { type: Type.STRING, description: "A category for the reminder, e.g., 'Birthday', 'Meeting', 'Personal Goal'." },
                        description: { type: Type.STRING },
                        recurrenceRule: { 
                            type: Type.OBJECT,
                            nullable: true,
                            properties: {
                                frequency: { type: Type.STRING, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']},
                                interval: { type: Type.INTEGER }
                            }
                        }
                    },
                    required: ["title", "date", "type", "description"]
                }
            }
        });

        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);

        return {
            title: parsed.title,
            date: new Date(parsed.date),
            type: parsed.type as ReminderType,
            description: parsed.description,
            recurrenceRule: parsed.recurrenceRule || null
        };
    } catch (error) {
        console.error("Error analyzing reminder:", error);
        throw new Error("Failed to analyze reminder with AI.");
    }
};

export const getServiceRecommendations = async (reminder: Reminder): Promise<ActivityRecommendation[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the reminder titled "${reminder.title}" with description "${reminder.description}", follow these steps:
1. Identify 1-2 distinct activities a user might need to perform (e.g., 'Buy a Gift', 'Book a Doctor Appointment').
2. For each activity, brainstorm a single, generic but searchable product or service query. Example: for 'Buy a Gift' for a birthday, the query could be 'birthday gifts'. For 'Dentist Appointment', it could be 'dental clinics nearby'.
3. For each activity and its corresponding query, find 2-3 popular Indian vendors that provide this product/service.
4. For each vendor, provide: their name, a short description, a realistic price range in INR (as a string like "₹100-1000"), a rating out of 5, and the product query from step 2.

Example for 'Alice's Birthday':
[
  {
    "activity": "Online Gift Stores",
    "vendors": [
      { "name": "Amazon", "description": "Wide range of gifts and electronics.", "priceRange": "₹500-10000", "rating": 4.6, "productQuery": "birthday gifts for friend" },
      { "name": "Ferns N Petals", "description": "Flowers, cakes, and personalized gifts.", "priceRange": "₹800-3000", "rating": 4.3, "productQuery": "birthday flowers and cake" }
    ]
  },
  {
    "activity": "Online Cake Delivery",
    "vendors": [
      { "name": "Zomato", "description": "Order from local bakeries.", "priceRange": "₹700-2000", "rating": 4.4, "productQuery": "birthday cake delivery" }
    ]
  }
]`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            activity: { type: Type.STRING },
                            vendors: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        priceRange: { type: Type.STRING },
                                        rating: { type: Type.NUMBER },
                                        productQuery: { type: Type.STRING }
                                    },
                                    required: ["name", "description", "priceRange", "rating", "productQuery"]
                                }
                            }
                        },
                        required: ["activity", "vendors"]
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const recommendations = JSON.parse(jsonString);
        return recommendations;
    } catch (error) {
        console.error("Error getting service recommendations:", error);
         if (reminder.type.toLowerCase().includes('birthday')) {
             return [
                { activity: 'Online Gift Stores', vendors: [
                    { name: 'Amazon', description: 'Gifts, electronics, and more.', priceRange: '₹500-5000', rating: 4.5, productQuery: 'birthday gifts'},
                    { name: 'Myntra', description: 'Fashion and lifestyle gifts.', priceRange: '₹1000-4000', rating: 4.3, productQuery: 'gift cards'},
                ]},
                { activity: 'Online Cake Delivery', vendors: [
                    { name: 'Swiggy', description: 'Cakes from nearby bakeries.', priceRange: '₹600-1500', rating: 4.4, productQuery: 'birthday cake'},
                ]}
            ];
        }
         if (reminder.type.toLowerCase().includes('appointment')) {
             return [
                { activity: 'Book Doctor Appointments', vendors: [
                    { name: 'Practo', description: 'Find doctors and book appointments.', priceRange: '₹300-1500', rating: 4.6, productQuery: 'dentist appointment'},
                    { name: 'Apollo 24/7', description: 'Consult with doctors online.', priceRange: '₹400-1000', rating: 4.4, productQuery: 'online doctor consultation'},
                ]},
            ];
        }
        return [];
    }
};

export const searchForServices = async (reminder: Reminder, query: string): Promise<ActivityRecommendation[]> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `A user has a reminder titled "${reminder.title}" and is searching for services related to "${query}".
1. Create a single activity category based on the user's search. e.g., if they search for "pizza", the activity could be "Pizza Delivery".
2. Find 2-3 popular Indian vendors that match this search.
3. For each vendor, provide their name, a short description, a realistic price range in INR, a rating out of 5, and use the user's original query ("${query}") as the productQuery.
4. Return the result in the same JSON format as the initial recommendations.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            activity: { type: Type.STRING },
                            vendors: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        priceRange: { type: Type.STRING },
                                        rating: { type: Type.NUMBER },
                                        productQuery: { type: Type.STRING }
                                    },
                                    required: ["name", "description", "priceRange", "rating", "productQuery"]
                                }
                            }
                        },
                        required: ["activity", "vendors"]
                    }
                }
            }
        });
        const jsonString = response.text.trim();
        const recommendations = JSON.parse(jsonString);
        return recommendations;
    } catch (error) {
        console.error("Error searching for services:", error);
        return [
             { activity: `Results for "${query}"`, vendors: [
                { name: 'Google Search', description: 'Could not find specific vendors. Try a web search.', priceRange: 'N/A', rating: 0, productQuery: query},
            ]}
        ];
    }
};

export const getRecipes = async (query: string, isVeg: boolean): Promise<Recipe[]> => {
    // A real app would get user's region dynamically. We'll use a plausible default for demonstration.
    const region = "Mumbai, India";
    try {
        const dietContext = isVeg 
            ? 'Ensure all recipes are vegetarian.' 
            : 'Include a mix of popular vegetarian and non-vegetarian (chicken, lamb, fish) dishes.';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 8 popular Indian recipes for "${query}". ${dietContext} The user is located in ${region}. Based on a simulated real-time web search for that area, provide realistic vendors. For each recipe, provide a name, short description, estimated price for one serving in INR, ingredients, instructions, cuisine style, isVeg (boolean), a rating out of 5, cook time in minutes, servings, a list of 2-3 popular food delivery vendors (like Zomato, Swiggy) that operate in the user's region, and a list of 2-3 popular grocery delivery vendors (like Instamart, BigBasket, Zepto) available there.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            price: { type: Type.NUMBER, description: "Price for one serving of the prepared dish in local currency (e.g., INR)."},
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            isVeg: { type: Type.BOOLEAN },
                            cuisine: { type: Type.STRING },
                            rating: { type: Type.NUMBER },
                            cookTimeInMinutes: { type: Type.INTEGER },
                            servings: { type: Type.INTEGER },
                            deliveryVendors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            groceryVendors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["name", "description", "price", "ingredients", "instructions", "isVeg", "cuisine", "rating", "cookTimeInMinutes", "servings", "deliveryVendors", "groceryVendors"]
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        const recipesData = JSON.parse(jsonString);

        // Map recipes and add placeholder images directly, removing image generation to avoid API rate limits.
        const recipesWithPlaceholders = recipesData.map((r: any, index: number) => ({
            ...r,
            id: `${query.replace(/\s/g, '-')}-${index}`,
            rating: Math.min(5, Math.max(3.5, r.rating || 4.5)),
            imageUrl: `https://picsum.photos/seed/${r.name.replace(/\W/g, '')}/400/300`
        }));

        return recipesWithPlaceholders;

    } catch (error) {
        console.error("Error getting recipes:", error);
        throw new Error("Failed to get AI recipes.");
    }
};
