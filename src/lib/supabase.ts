
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are available
const hasSupabaseCredentials = !!(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseCredentials) {
  console.warn('Supabase credentials not found. Please connect to Supabase using the integration.');
}

// Create a dummy client if no credentials are available
export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      'https://placeholder-url.supabase.co',
      'placeholder-key'
    );

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => hasSupabaseCredentials;
