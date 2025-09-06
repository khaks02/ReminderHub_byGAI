// IMPORTANT: To run the app in demo mode without a Supabase backend, set USE_MOCK_DATA to true.
// To connect to your own Supabase instance, set USE_MOCK_DATA to false and provide credentials via environment variables.
export const USE_MOCK_DATA = false;

// To connect to a live Supabase backend, set USE_MOCK_DATA to false and ensure these environment variables are configured.
// The platform's execution environment is expected to provide these variables.
// Note: Using `process.env` is based on the platform's requirement for the Gemini API key.
export const SUPABASE_URL: string = (process.env.SUPABASE_URL as string) || 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY: string = (process.env.SUPABASE_ANON_KEY as string) || 'YOUR_SUPABASE_ANON_KEY';


/**
 * Checks if the application is ready to run.
 * @returns {boolean} True if in mock mode or if Supabase credentials are provided.
 */
export const isSupabaseConfigured = () => {
    // Check if the variables were successfully loaded from the environment and are not the placeholder strings.
    return USE_MOCK_DATA || (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY');
};
