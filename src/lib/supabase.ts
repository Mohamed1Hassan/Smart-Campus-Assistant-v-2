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
const DUMMY_OBJECT = {} as any;

export const supabase = new Proxy(DUMMY_OBJECT, {
  get(target, prop) {
    if (baseClient) {
      const value = (baseClient as any)[prop];
      return typeof value === 'function' ? value.bind(baseClient) : value;
    }
    
    // Return safe defaults for common properties to prevent destructuring/calling errors
    const commonProps: Record<string, any> = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          download: () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
      from: () => ({
        select: () => ({
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          eq: () => ({ eq: () => ({}) } as any),
          order: () => ({}) as any,
          range: () => ({}) as any,
          then: (cb: any) => Promise.resolve({ data: null, error: null }).then(cb),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        upsert: () => Promise.resolve({ data: null, error: null }),
      }),
      channel: () => ({
        on: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
        send: () => Promise.resolve('ok'),
      }),
    };

    if (prop in commonProps) {
      return commonProps[prop as string];
    }

    // Default: return a function that logs a warning and returns the proxy for chaining
    return (...args: any[]) => {
      console.warn(`[Supabase Proxy] Warning: Attempted to call "${String(prop)}" but Supabase is not initialized.`);
      return supabase; 
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
