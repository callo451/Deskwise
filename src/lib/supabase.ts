import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Use environment variables if available, otherwise fallback to hardcoded values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqibbynjnfycbuersldk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaWJieW5qbmZ5Y2J1ZXJzbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMjI5NjAsImV4cCI6MjA2MDc5ODk2MH0.o8nX06QAOyBMh2S6zMRaiXsCvnAautNu4WYkyDQUez4';

// Directly export the created client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'deskwise-auth-storage-key', // Use a consistent storage key
  },
  global: {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
});

// Add debug logging for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session ? 'User authenticated' : 'No session');
});

// Add a simple health check function
export const checkSupabaseConnection = async () => {
  try {
    console.log('Checking Supabase connection...');
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    console.log('Supabase connection is healthy');
    return true;
  } catch (err) {
    console.error('Supabase connection check exception:', err);
    return false;
  }
};
