/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Base client - initialized only if variables exist
// IMPORTANT: Realtime is disabled at the client level because:
// 1. Realtime connections via WebSocket fail repeatedly (Supabase project may not have Realtime enabled)
// 2. The Supabase JS library has an internal reconnect loop that spams the console
// 3. Disabling it here at creation time is the ONLY way to fully prevent the spam
const baseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        timeout: 60000,
        params: {
          eventsPerSecond: 1,
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Proactively disconnect the Realtime transport immediately after creation.
// The Supabase JS library starts a WebSocket reconnect loop internally regardless
// of whether we call .subscribe() or not. The only way to stop it is to
// call .disconnect() on the RealtimeClient directly.
if (baseClient) {
  try {
    (baseClient as any).realtime.disconnect();
  } catch (_) {
    // Ignore if already disconnected
  }
}

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


// Realtime Availability Tracking - helps components decide whether to subscribe
let isRealtimeDisabled = !baseClient;
let lastRealtimeError: string | null = null;

export const setRealtimeStatus = (disabled: boolean, error?: string | null) => {
  isRealtimeDisabled = disabled;
  if (error !== undefined) lastRealtimeError = error;
};

export const getRealtimeStatus = () => ({
  isDisabled: isRealtimeDisabled,
  lastError: lastRealtimeError
});

export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    if (baseClient) {
      // If we know realtime is failing, we can intercept 'channel' and 'subscribe' 
      // but let's keep it simple for now and let the real client handle it
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
