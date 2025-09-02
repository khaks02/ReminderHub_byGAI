import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

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

// This prevents the app from crashing when Supabase credentials are not set.
// The logic in the context providers ensures that this null client is never
// actually used when in mock mode.
const shouldCreateClient = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Create a single, shared Supabase client for interacting with your database.
// FIX: Corrected the type of the Supabase client to be explicitly nullable (`SupabaseClient<Database> | null`) and removed the `as any` cast. This allows TypeScript to correctly infer types for Supabase queries, resolving numerous 'not assignable to type never' errors throughout the application where the client is used.
export const supabase: SupabaseClient<Database> | null = shouldCreateClient
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;