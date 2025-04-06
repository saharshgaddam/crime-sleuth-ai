
import { createClient } from '@supabase/supabase-js';

// Get environment variables - using direct references for Vite
const supabaseUrl = 'https://odplkhxbiihqldjjgsxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcGxraHhiaWlocWxkampnc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjA5MjgsImV4cCI6MjA1OTUzNjkyOH0.iiIENSbDNtNuvVPbg7BbkinSJudZ0LMUEjDzaXtGg6U';

// Create a proper supabase client with explicit configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});

// Helper function to determine if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey ? true : false;
};

console.log('Supabase configuration status:', isSupabaseConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED');
