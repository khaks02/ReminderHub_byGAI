
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// FIX: Update @google/genai import to a compatible version for Deno.
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.14.0";

// This declares the Deno environment for type checking.
declare const Deno: any;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Best practice: Restrict this to your app's domain in production.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main server function to handle incoming requests.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Securely retrieve the Gemini API key and initialize the client inside the handler.
    // This ensures that any error during initialization is caught and handled gracefully.
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set in Supabase secrets.");
    }
    // FIX: Initialize the GoogleGenAI client with a named apiKey parameter.
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const { type, payload } = await req.json();

    if (!type || !payload) {
      throw new Error("Request body must contain 'type' and 'payload'.");
    }

    let result;

    // Route the request based on the 'type' field.
    switch (type) {
      case 'generateContent': {
        const response = await ai.models.generateContent(payload);
        // Extract only the essential 'text' part to ensure a clean, serializable response.
        result = { text: response.text };
        break;
      }
      case 'generateImages': {
        const response = await ai.models.generateImages(payload);
        // Extract only the 'generatedImages' array.
        result = { generatedImages: response.generatedImages };
        break;
      }
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }

    // Return the successful result as a JSON string.
    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Log the actual error to the server console for debugging.
    console.error(`[Gemini Proxy Error] ${error.name}: ${error.message}`);
    
    // Return a structured, user-friendly error to the client.
    return new Response(JSON.stringify({ error: `Gemini Proxy Error: ${error.message}` }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
