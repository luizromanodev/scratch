/**
 * FinFlow — Supabase Client Configuration
 * 
 * Provides the Supabase client instance and auth helpers.
 * In local/dev mode without Supabase config, the app gracefully falls back to localStorage.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create the client if both URL and key are configured
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'finflow_supabase_auth',
      },
    })
  : null

/**
 * Check if Supabase is properly configured and available
 */
export function isSupabaseEnabled() {
  return supabase !== null
}
