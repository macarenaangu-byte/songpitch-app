import { createClient } from '@supabase/supabase-js';

// ─── Capture email-confirmation type BEFORE Supabase clears the hash ────────
// flowType:'implicit' means Supabase reads & clears #access_token=...&type=signup
// at module-load time, before React renders. We save the flag to sessionStorage
// NOW so App.jsx can read it reliably when isEmailConfirmRef is initialised.
try {
  const _hashStr = window.location.hash.replace(/^#/, '');
  const _hashParams = new URLSearchParams(_hashStr);
  const _hashType = _hashParams.get('type');
  if (_hashType === 'signup') {
    sessionStorage.setItem('_cv_email_confirm', '1');
  } else if (_hashType === 'email_change') {
    sessionStorage.setItem('_cv_email_change', '1');
  }
} catch (_) { /* SSR / restricted environment — safe to ignore */ }

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
