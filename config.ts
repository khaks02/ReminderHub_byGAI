// IMPORTANT: To run the app in demo mode without a Supabase backend, set USE_MOCK_DATA to true.
// To connect to your own Supabase instance, set USE_MOCK_DATA to false and fill in your credentials.
export const USE_MOCK_DATA = false;

// To connect to a live Supabase backend, set USE_MOCK_DATA to false and fill these in.
// Hardcoded credentials are used here to resolve runtime errors in the current execution environment which doesn't support import.meta.env.
export const SUPABASE_URL: string = 'https://slzekgelvrigylhbdrvb.supabase.co';
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsemVrZ2VsdnJpZ3lsaGJkcnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDEwNDQsImV4cCI6MjA3MTgxNzA0NH0.pacfIlDCNE2Sc2SsI-cIWNO3kv_npixNSRjENHwLP0Q';


/**
 * Checks if the application is ready to run.
 * @returns {boolean} True if in mock mode or if Supabase credentials are provided.
 */
export const isSupabaseConfigured = () => {
    return USE_MOCK_DATA || (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY');
};