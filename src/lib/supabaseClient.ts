import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Use the environment variables or the stored values from memory
const supabaseUrl = 'https://rqibbynjnfycbuersldk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaWJieW5qbmZ5Y2J1ZXJzbGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMjI5NjAsImV4cCI6MjA2MDc5ODk2MH0.o8nX06QAOyBMh2S6zMRaiXsCvnAautNu4WYkyDQUez4';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
