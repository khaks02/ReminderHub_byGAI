// IMPORTANT: To run the app in demo mode without a Supabase backend, set USE_MOCK_DATA to true.
// To connect to your own Supabase instance, set USE_MOCK_DATA to false and fill in your credentials.
export const USE_MOCK_DATA = false;

// To connect to a live Supabase backend, set USE_MOCK_DATA to false and fill these in.
// FIX: Explicitly typing as string prevents TypeScript from inferring a too-specific literal type,
// which would cause an error when comparing against the placeholder values.
export const SUPABASE_URL: string = 'https://slzekgelvrigylhbdrvb.supabase.co';
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsemVrZ2VsdnJpZ3lsaGJkcnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDEwNDQsImV4cCI6MjA3MTgxNzA0NH0.pacfIlDCNE2Sc2SsI-cIWNO3kv_npixNSRjENHwLP0Q';

/**
 * Checks if the application is ready to run.
 * @returns {boolean} True if in mock mode or if Supabase credentials are provided.
 */
export const isSupabaseConfigured = () => {
    if (USE_MOCK_DATA) return true;
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};