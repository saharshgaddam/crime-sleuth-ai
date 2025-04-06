
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are properly configured
const hasSupabaseCredentials = !!(supabaseUrl && supabaseAnonKey);

// Create a proper supabase client or a dummy one if credentials aren't available
export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      'https://placeholder-supabase-project.supabase.co',
      'placeholder-anon-key'
    );

// Helper function to determine if Supabase is configured
export const isSupabaseConfigured = () => hasSupabaseCredentials;

// Log Supabase configuration status
console.log(`Supabase configuration status: ${hasSupabaseCredentials ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
if (!hasSupabaseCredentials) {
  console.warn(
    'Supabase is not configured. Please connect to Supabase using the green Supabase button in the top right corner of the Lovable interface.'
  );
}
