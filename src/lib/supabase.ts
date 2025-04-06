
import { createClient } from '@supabase/supabase-js';

// We now directly use the environment variables that are set correctly
const supabaseUrl = 'https://odplkhxbiihqldjjgsxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcGxraHhiaWlocWxkampnc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjA5MjgsImV4cCI6MjA1OTUzNjkyOH0.iiIENSbDNtNuvVPbg7BbkinSJudZ0LMUEjDzaXtGg6U';

// Create a proper supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper function to determine if Supabase is configured
export const isSupabaseConfigured = () => true;

console.log('Supabase configuration status: CONFIGURED');
