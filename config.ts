// IMPORTANT: To run the app in demo mode without a Supabase backend, set USE_MOCK_DATA to true.
// To connect to your own Supabase instance, set USE_MOCK_DATA to false and fill in your credentials.
export const USE_MOCK_DATA = false;

// NOTE: Hardcoding credentials is not recommended for production applications.
// These have been set based on your request to get the application running.
// For better security, use environment variables as was originally intended.
export const SUPABASE_URL: string = "https://5HQj7Nm1xu4ixcxBxLsLcQ.supabase.co";
export const SUPABASE_ANON_KEY: string = "sb_publishable_5HQj7Nm1xu4ixcxBxLsLcQ_8_kxP0WB";


/**
 * Checks if the application is ready to run.
 * @returns {boolean} True if in mock mode or if Supabase credentials are provided.
 */
export const isSupabaseConfigured = () => {
    // In mock mode, we don't need Supabase credentials.
    if (USE_MOCK_DATA) {
        return true;
    }
    // In live mode, ensure both URL and Key are present and not placeholders.
    const isUrlSet = SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL';
    const isKeySet = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
    return isUrlSet && isKeySet;
};
