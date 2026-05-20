// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have valid environment variables
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('⚡ Generali Radar: Connected to Supabase Cloud Database.');
  } else {
    console.log('📦 Generali Radar: Running in Local Mock Mode (no Supabase keys found).');
  }
}
