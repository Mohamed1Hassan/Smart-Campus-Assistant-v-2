import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Base client - initialized only if variables exist
const baseClient = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Robust Supabase client proxy that prevents crashes when environment variables are missing.
 * This is particularly important for Next.js build-time static analysis.
 */
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (baseClient) {
      const value = (baseClient as any)[prop];
      return typeof value === 'function' ? value.bind(baseClient) : value;
    }
    
    // Fallback for missing client: return a function that returns a dummy object
    // to prevent chaining crashes like supabase.channel().subscribe()
    return (...args: any[]) => {
      console.warn(`[Supabase Proxy] Warning: Attempted to call "${String(prop)}" but Supabase is not initialized.`);
      return supabase; // Recursive proxy return for chaining
    };
  }
});

if (!baseClient) {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // Only log error on server-side production build to avoid noise in browser
    console.error('CRITICAL: Supabase environment variables are missing! Real-time features will not work.');
  } else {
    console.warn('[Supabase] Missing environment variables. Real-time features disabled.');
  }
}
