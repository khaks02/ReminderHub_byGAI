// FIX: Use the un-versioned URL for Supabase function types to ensure Deno types are correctly resolved.
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// This function is deprecated. All AI calls should use 'gemini-proxy'.

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

  const responseBody = {
    error: "This function ('gemini-suggestions') is deprecated. Please use the 'gemini-proxy' function instead.",
  };

  // Return a "410 Gone" status to indicate the endpoint is no longer available.
  return new Response(
    JSON.stringify(responseBody),
    {
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});