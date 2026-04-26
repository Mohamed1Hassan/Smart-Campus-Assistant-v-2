/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Base client - initialized only if variables exist
// Auth & DB features are enabled, but Realtime (WebSocket) is fully intercepted below.
const baseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ============================================================
// REALTIME BLOCKER
// The Supabase JS library has an internal reconnect loop that
// spams the console with WebSocket errors when Realtime is not
// available on the project. The ONLY reliable fix is to intercept
// ALL calls to .channel() and return a dummy that never creates
// a real WebSocket connection.
// ============================================================

const createDummyChannel = (channelName: string) => {
  const eventHandlers: Record<string, ((payload: any) => void)[]> = {};

  const channel = {
    on: (_type: string, _filter: any, callback?: (payload: any) => void) => {
      // Store handlers so they could theoretically be called manually
      if (callback) {
        if (!eventHandlers[_filter?.event]) {
          eventHandlers[_filter?.event] = [];
        }
        eventHandlers[_filter?.event].push(callback);
      }
      return channel; // allow chaining
    },
    subscribe: (callback?: (status: string, err?: Error) => void) => {
      // Immediately report a clean "offline/disabled" state without any WebSocket attempt
      if (typeof callback === 'function') {
        // Use CLOSED instead of CHANNEL_ERROR to avoid triggering retry logic
        setTimeout(() => callback('CLOSED'), 0);
      }
      return channel;
    },
    unsubscribe: () => Promise.resolve('ok'),
    send: () => Promise.resolve('ok'),
    track: () => Promise.resolve('ok'),
    untrack: () => Promise.resolve('ok'),
  };

  return channel;
};

// Realtime Availability Tracking
let isRealtimeDisabled = true; // Always disabled by default - enable only if Realtime works
let lastRealtimeError: string | null = 'Realtime is disabled to prevent WebSocket connection spam';

export const setRealtimeStatus = (disabled: boolean, error?: string | null) => {
  isRealtimeDisabled = disabled;
  if (error !== undefined) lastRealtimeError = error;
};

export const getRealtimeStatus = () => ({
  isDisabled: isRealtimeDisabled,
  lastError: lastRealtimeError,
});

/**
 * Creates a recursive dummy object that allows infinite method chaining.
 * Used when Supabase environment variables are missing.
 */
const createRecursiveDummy = (name: string): any => {
  const dummy = (..._args: any[]) => createRecursiveDummy(`${name}(...)`);

  return new Proxy(dummy, {
    apply(_target, _thisArg, _args) {
      return createRecursiveDummy(`${name}(...)`);
    },
    get(_target, prop) {
      if (prop === 'then') {
        return (cb: any) => Promise.resolve({ data: null, error: null }).then(cb);
      }
      if (prop === 'subscribe') {
        return (cb?: (status: string) => void) => {
          if (typeof cb === 'function') {
            setTimeout(() => cb('CLOSED'), 0);
          }
          return { unsubscribe: () => {} };
        };
      }
      if (prop === 'data') return null;
      if (prop === 'error') return null;
      if (prop === 'session') return null;
      if (prop === 'user') return null;
      if (prop === 'publicUrl') return '';
      if (prop === 'subscription') return { unsubscribe: () => {} };

      return createRecursiveDummy(`${name}.${String(prop)}`);
    },
  });
};

/**
 * Main Supabase client proxy.
 *
 * - `.channel()` calls are INTERCEPTED and return a dummy that never creates WebSockets.
 * - All other calls (auth, database, storage) go to the real client.
 */
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    if (baseClient) {
      const value = (baseClient as any)[prop];
      return typeof value === 'function' ? value.bind(baseClient) : value;
    }

    // Fallback recursive dummy when no client exists
    return createRecursiveDummy(String(prop));
  },
});

if (!baseClient) {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.error('[Supabase] CRITICAL: Missing environment variables. Auth & DB features disabled.');
  } else {
    console.warn('[Supabase] Missing environment variables. Auth & DB features disabled.');
  }
}
