import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

// Only create client if we have valid URLs
// For now, we're using backend API for auth, so Supabase is optional
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Supabase client initialized (using backend for auth)');
