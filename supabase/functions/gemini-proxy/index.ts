// FIX: Use the un-versioned URL for Supabase function types to ensure Deno types are correctly resolved.
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { GoogleGenAI } from "https://esm.sh/@google/genai@0.12.0";

// Standard CORS headers for Supabase functions.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the request method is POST.
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body.
    const body = await req.json();
    const { prompt, config } = body;

    // Validate the presence and type of the 'prompt'.
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: "Missing or invalid 'prompt' in request body." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve the Gemini API key from environment variables (Supabase secrets).
    const apiKey = Deno.env.get("API_KEY");
    if (!apiKey) {
      console.error("API_KEY not set in Supabase secrets.");
      return new Response(JSON.stringify({ error: 'Server misconfiguration: API key missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize the Gemini client and call the API.
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config, // Pass the entire config object from the client.
    });

    const text = response.text;

    // Return the successful response from Gemini.
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Catch JSON parsing errors and other exceptions.
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Gemini Proxy Function Error:", error);

    const status = (error instanceof SyntaxError) ? 400 : 500;
    const message = (error instanceof SyntaxError) ? 'Invalid JSON body.' : `Internal Server Error: ${errorMessage}`;
    
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});