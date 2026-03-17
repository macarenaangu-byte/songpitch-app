import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CONFIGURATION ─────────────────────────────────────────────────
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',        // Use hash-based token delivery (#access_token=...)
    detectSessionInUrl: true,    // Read the OAuth token from the URL hash on load
    persistSession: true,
  },
});
