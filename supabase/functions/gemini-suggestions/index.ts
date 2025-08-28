// The triple-slash directive below provides type definitions for the Deno runtime.
// It is required for Supabase Edge Functions and must be the first line of the file.
// FIX: Use a specific version for Supabase functions types to ensure stable resolution.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1" />

import { GoogleGenAI } from "npm:@google/genai@0.12.0";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || '*';
  const corsHeaders = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
        status: 405,
      });
    }
    
    const { prompt, config } = await req.json();
    const apiKey = Deno.env.get("API_KEY");

    if (!apiKey) {
      throw new Error("The API_KEY environment variable is not set in Supabase secrets.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    const text = response.text;
    const suggestionsData = JSON.parse(text.replace(/^```json\n?/, '').replace(/\n?```$/, ''));

    return new Response(JSON.stringify(suggestionsData), {
      headers: { ...corsHeaders, 'content-type': "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Suggestions Function Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'content-type': "application/json" },
      status: 500,
    });
  }
});
