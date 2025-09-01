
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, USE_MOCK_DATA } from '../config';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          type: string
          description: string
          recurrence_rule: Json | null
          is_completed: boolean
          source: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          date: string
          type: string
          description: string
          recurrence_rule?: Json | null
          is_completed?: boolean
          source?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          date?: string
          type?: string
          description?: string
          recurrence_rule?: Json | null
          is_completed?: boolean
          source?: string | null
        }
      }
      reminder_types: {
        Row: {
          id: number
          user_id: string
          name: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          date: string
          items: Json
          total: number
          reminderId: string | null
          reminderTitle: string | null
          followUpReminders: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          items: Json
          total: number
          reminderId?: string | null
          reminderTitle?: string | null
          followUpReminders?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          items?: Json
          total?: number
          reminderId?: string | null
          reminderTitle?: string | null
          followUpReminders?: Json | null
        }
      }
      saved_recipes: {
        Row: {
          id: number
          user_id: string
          recipe_id: string
          recipe_data: Json
        }
        Insert: {
          id?: number
          user_id: string
          recipe_id: string
          recipe_data: Json
        }
        Update: {
          id?: number
          user_id?: string
          recipe_id?: string
          recipe_data?: Json
        }
      }
      cart: {
        Row: {
          user_id: string
          items: Json
          updated_at?: string
        }
        Insert: {
          user_id: string
          items: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          items?: Json
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          recipe_vegetarian_only: boolean
          notification_settings: Json | null
          has_completed_tutorial: boolean
        }
        Insert: {
          user_id: string
          recipe_vegetarian_only?: boolean
          notification_settings?: Json | null
          has_completed_tutorial?: boolean
        }
        Update: {
          user_id?: string
          recipe_vegetarian_only?: boolean
          notification_settings?: Json | null
          has_completed_tutorial?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

let supabaseInstance = null;

// Only initialize Supabase if we are not in mock data mode.
if (!USE_MOCK_DATA) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error("Supabase URL and Anon Key must be provided in environment variables for live data mode.");
    }
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Create a single, shared Supabase client for interacting with your database.
// The type assertion is safe because the Supabase client is only ever used in parts of the code
// that are guarded by a `!USE_MOCK_DATA` check, ensuring it is never null when accessed.
export const supabase = supabaseInstance as ReturnType<typeof createClient<Database>>;
