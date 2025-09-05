
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.52.7';

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
    // Securely retrieve the OpenAI API key and initialize the client inside the handler.
    // This prevents the function from crashing on startup if the key is missing.
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable not set in Supabase secrets.");
    }
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const { payload } = await req.json();

    if (!payload) {
      throw new Error("Request body must contain 'payload'.");
    }

    const { model, messages, response_format } = payload;

    // Call the OpenAI chat completions API.
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini', // A sensible default model.
      messages: messages,
      response_format: response_format,
    });

    const textResponse = completion.choices[0]?.message?.content;

    if (!textResponse) {
      throw new Error("OpenAI returned an empty response.");
    }
    
    // Return a simple object with the text, mirroring the Gemini proxy's format for consistency.
    const result = { text: textResponse };

    // Return the successful result as a JSON string.
    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Log the actual error to the server console for debugging.
    console.error(`[OpenAI Proxy Error] ${error.name}: ${error.message}`);
    
    // Return a structured, user-friendly error to the client.
    return new Response(JSON.stringify({ error: `OpenAI Proxy Error: ${error.message}` }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});