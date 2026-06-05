/**
 * BACKWARDS-COMPAT SHIM — no longer talks to Supabase.
 *
 * This file used to create and configure the `@supabase/supabase-js` client.
 * It now re-exports the Node/MongoDB API shim from `@/lib/api` under the same
 * names so every existing consumer keeps compiling and working unchanged.
 *
 * Migration notes:
 *   - The exported `supabase` object now has .auth / .from() / .rpc() / .storage /
 *     .functions surfaces that mirror Supabase call-by-call. Implementation and
 *     endpoint contract live in `src/lib/api/` and BACKEND_API.md.
 *   - `signIn`, `signUp`, `signOut`, `getCurrentUser`, `getSession`, `isAdmin`,
 *     `fetchWithTimeout` keep the exact same signatures and return shapes they
 *     had when this file wrapped the real Supabase client.
 *   - The `Session` type that old code imports from `@supabase/supabase-js` is
 *     re-exported here as a type alias so no import paths break.
 */
import { api } from './api';
import type { AuthSession } from './api';

export const supabase = api;

/**
 * `Session` used to be imported from '@supabase/supabase-js'. Any code that still
 * imports it from this module sees the new shim-native type.
 */
export type Session = AuthSession;

export { fetchWithTimeout } from './api';

// ---------- auth helpers (preserve the exact signatures consumers depend on) ----------

export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  const role = (user?.user_metadata as { role?: unknown } | undefined)?.role;
  return role === 'admin';
};

export const signUp = async (
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

/**
 * Prefer this over `supabase.auth.getUser()` for UI: our `getSession()` never
 * hangs (see the timeout+localStorage fallback inside `src/lib/api/auth.ts`).
 */
export const getCurrentUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
};

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
