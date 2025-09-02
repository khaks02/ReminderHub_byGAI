
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
// Pin the SDK version for stability and update the Deno standard library.
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.16.0";

// Declare Deno to provide types for the Supabase Edge Function environment.
declare const Deno: any;

// Securely retrieve the Gemini API key from Supabase environment variables (secrets).
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // For development. For production, lock this down to your app's domain.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Immediately handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Validate that the API key secret is set.
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }
    
    // Deconstruct the request body to get the operation type and its payload.
    const { type, payload } = await req.json();
    if (!type || !payload) {
        throw new Error("Invalid request body: 'type' and 'payload' are required.");
    }

    // Initialize the Gemini SDK with the secret key as a named parameter.
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    let result;

    // Route the request to the appropriate Gemini SDK method based on the 'type',
    // then extract only the necessary data to ensure the response is serializable.
    if (type === 'generateContent') {
      const response = await ai.models.generateContent(payload);
      // Explicitly extract the text property to ensure a simple, serializable
      // object is returned to the client, preventing issues with complex SDK response objects.
      result = { text: response.text };
    } else if (type === 'generateImages') {
      const response = await ai.models.generateImages(payload);
      // Explicitly extract the generatedImages property.
      result = { generatedImages: response.generatedImages };
    } else {
      throw new Error(`Unsupported operation type: ${type}`);
    }

    // Return the successful response from the Gemini API.
    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Log the error for debugging and return a structured error response to the client.
    console.error('Error in Gemini proxy function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
