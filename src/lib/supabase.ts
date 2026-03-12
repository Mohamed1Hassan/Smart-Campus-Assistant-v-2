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
/**
 * Creates a recursive dummy object that allows infinite method chaining.
 * This is used when Supabase environment variables are missing.
 */
const createRecursiveDummy = (name: string): any => {
  const dummy = (..._args: any[]) => createRecursiveDummy(`${name}(...)`);
  
  return new Proxy(dummy, {
    apply(target, thisArg, args) {
      return createRecursiveDummy(`${name}(...)`);
    },
    get(_target, prop) {
      // Common terminal methods
      if (prop === 'then') {
        return (cb: any) => Promise.resolve({ data: null, error: null }).then(cb);
      }
      if (prop === 'subscribe') {
        return (cb?: (status: string) => void) => {
          if (typeof cb === 'function') {
            // Simulate async subscription status update
            setTimeout(() => cb('SUBSCRIBED'), 0);
          }
          return { unsubscribe: () => {} };
        };
      }
      
      // Handle known properties for destructuring
      if (prop === 'data') return null;
      if (prop === 'error') return null;
      if (prop === 'session') return null;
      if (prop === 'user') return null;
      if (prop === 'publicUrl') return '';
      if (prop === 'subscription') return { unsubscribe: () => {} };

      // Recursively return dummy for any other property access
      return createRecursiveDummy(`${name}.${String(prop)}`);
    }
  });
};


export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    if (baseClient) {
      const value = (baseClient as any)[prop];
      return typeof value === 'function' ? value.bind(baseClient) : value;
    }
    
    // Return the recursive dummy starting from the property name
    return createRecursiveDummy(String(prop));
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
