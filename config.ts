// This file contains placeholder values for your Supabase project.
// In a real-world application, these should be stored in environment variables.
// DO NOT commit this file with real credentials to a public repository.

export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

/**
 * --- MOCK DATA ---
 * Set this to true to use the local mock data generator instead of live APIs.
 * This will populate the app with thousands of reminders and recipes for demonstration.
 * It's recommended to set this via an environment variable.
 */
// Automatically default to mock data if essential API keys are missing.
// This prevents the app from crashing in a local dev environment.
const shouldForceMockData = !SUPABASE_URL || !SUPABASE_ANON_KEY || !process.env.API_KEY;
export const USE_MOCK_DATA = shouldForceMockData || process.env.USE_MOCK_DATA === 'true';
