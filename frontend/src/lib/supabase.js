/**
 * Supabase browser client.
 *
 * Optional by design: when no real credentials are configured, this exports
 * `supabase = null` and `isSupabaseConfigured = false`, and AuthContext
 * falls back to its local demo-account flow. That keeps the app runnable
 * for the hackathon demo without anyone needing to set up Auth first.
 *
 * To enable real auth, set these in frontend/.env:
 *   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY=<your anon / publishable key>
 *
 * Note: this is the browser anon key, which is safe to expose — it is NOT
 * the service_role key, and never should be. Tutoring data is read and
 * written through the FastAPI backend, not directly from here.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Placeholder values shipped in .env.example shouldn't count as configured. */
function looksReal(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  return !v.includes('placeholder') && !v.includes('replace_with');
}

export const isSupabaseConfigured = looksReal(url) && looksReal(anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info(
    '[LearnOS] Supabase auth not configured — using the local demo account. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env to enable real auth.'
  );
}

export default supabase;
