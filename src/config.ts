// IMPORTANT: To run the app in demo mode without a Supabase backend, set USE_MOCK_DATA to true.
// To connect to your own Supabase instance, set USE_MOCK_DATA to false and provide credentials via a .env file.
export const USE_MOCK_DATA = false;

// Credentials are now loaded from Vite's environment variables.
// For local development, create a .env file in the root of your project:
// VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
// VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
export const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;


/**
 * Checks if the application is ready to run by verifying Supabase configuration.
 * @returns {boolean} True if in mock mode or if Supabase credentials are validly provided.
 */
export const isSupabaseConfigured = () => {
    // In mock mode, we don't need Supabase credentials.
    if (USE_MOCK_DATA) {
        return true;
    }
    
    const url = SUPABASE_URL;
    const key = SUPABASE_ANON_KEY;

    // In live mode, ensure both URL and Key are present.
    if (!url || !key) {
        return false;
    }
    
    // Perform a basic validation to prevent the Supabase client from crashing the app
    // at a top level due to a malformed URL.
    try {
        new URL(url);
    } catch (e) {
        console.error("Invalid VITE_SUPABASE_URL provided in environment variables:", url);
        return false;
    }

    return true;
};
