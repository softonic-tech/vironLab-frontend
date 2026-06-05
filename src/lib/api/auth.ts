/**
 * Auth surface — a drop-in replacement for `supabase.auth.*` that speaks to your
 * Node/MongoDB backend. Methods return the same shapes Supabase does so all
 * consumers (~10 files) keep working without edits.
 *
 * Session shape stored in localStorage:
 *   { access_token, refresh_token, expires_at, user }
 *
 * Backend contract (see BACKEND_API.md):
 *   POST   /api/auth/signup              { email, password, data? }   -> { session, user }
 *   POST   /api/auth/signin              { email, password }          -> { session, user }
 *   POST   /api/auth/signout                                          -> 204
 *   GET    /api/auth/session                                          -> { session | null }
 *   GET    /api/auth/user                                             -> { user | null }
 *   PATCH  /api/auth/user                 { email?, password?, data? } -> { user, session? }
 *   POST   /api/auth/password/reset       { email, redirect_to? }      -> 204
 *   POST   /api/auth/refresh              { refresh_token }            -> { session }
 */
import {
  AUTH_CHANGE_EVENT,
  AUTH_STORAGE_KEY,
  request,
  sessionStore,
  type ApiErrorShape,
} from './client';

/** Hard cap on how long any auth read may block before we fall back to cached data. */
const AUTH_READ_TIMEOUT_MS = 2_500;

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  created_at?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
};

export type AuthStateChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export type AuthChangeCallback = (
  event: AuthStateChangeEvent,
  session: AuthSession | null,
) => void | Promise<void>;

type AuthResponse<T = AuthSession> = {
  data: { session: T | null; user: AuthUser | null };
  error: ApiErrorShape | null;
};

// ---------- storage helpers ----------

function persist(session: AuthSession | null): void {
  sessionStore.write(session);
}

function readPersisted(): AuthSession | null {
  const raw = sessionStore.read();
  if (!raw) return null;
  // Stored shape happens to match AuthSession (same keys). Cast is safe.
  return raw as AuthSession;
}

// ---------- public API ----------

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/**
 * Mirrors `supabase.auth.getSession()` — never hangs.
 *
 * 1. If a session is cached in localStorage, return it immediately (fast path).
 * 2. Otherwise race a backend call against a short timer. If the timer wins
 *    we still return the localStorage fallback. This is the same hardening
 *    we had in the old Supabase client.
 */
export async function getSession(): Promise<{
  data: { session: AuthSession | null };
  error: ApiErrorShape | null;
}> {
  const cached = readPersisted();
  if (cached) return { data: { session: cached }, error: null };

  const real = await withTimeout(
    request<{ session: AuthSession | null }>({ path: '/api/auth/session' }),
    AUTH_READ_TIMEOUT_MS,
  );

  if (real && real.data) {
    if (real.data.session) persist(real.data.session);
    return { data: { session: real.data.session ?? null }, error: real.error };
  }

  return { data: { session: null }, error: null };
}

/**
 * Mirrors `supabase.auth.getUser()`. Hits the backend to verify the current token;
 * falls back to the cached user if the network fails.
 */
export async function getUser(): Promise<{
  data: { user: AuthUser | null };
  error: ApiErrorShape | null;
}> {
  const cached = readPersisted();
  const { data, error } = await request<{ user: AuthUser | null }>({
    path: '/api/auth/user',
  });
  if (error) {
    return { data: { user: cached?.user ?? null }, error };
  }
  return { data: { user: data?.user ?? null }, error: null };
}

export type SignUpPayload = {
  email: string;
  password: string;
  options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
};

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  const body = {
    email: payload.email,
    password: payload.password,
    data: payload.options?.data ?? undefined,
    email_redirect_to: payload.options?.emailRedirectTo,
  };
  const { data, error } = await request<{ session: AuthSession | null; user: AuthUser | null }>({
    path: '/api/auth/signup',
    method: 'POST',
    body,
    auth: false,
  });
  if (error) return { data: { session: null, user: null }, error };
  if (data?.session) {
    persist(data.session);
    emit('SIGNED_IN', data.session);
  }
  return { data: { session: data?.session ?? null, user: data?.user ?? null }, error: null };
}

export type SignInPayload = { email: string; password: string };

export async function signInWithPassword(payload: SignInPayload): Promise<AuthResponse> {
  const { data, error } = await request<{ session: AuthSession | null; user: AuthUser | null }>({
    path: '/api/auth/signin',
    method: 'POST',
    body: payload,
    auth: false,
  });
  if (error) return { data: { session: null, user: null }, error };
  if (data?.session) {
    persist(data.session);
    emit('SIGNED_IN', data.session);
  }
  return { data: { session: data?.session ?? null, user: data?.user ?? null }, error: null };
}

export async function signOut(): Promise<{ error: ApiErrorShape | null }> {
  const { error } = await request<null>({
    path: '/api/auth/signout',
    method: 'POST',
  });
  // Clear the local session even if the server call failed — the user clicked sign out.
  persist(null);
  emit('SIGNED_OUT', null);
  return { error };
}

export type UpdateUserPayload = {
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
};

export async function updateUser(payload: UpdateUserPayload): Promise<{
  data: { user: AuthUser | null };
  error: ApiErrorShape | null;
}> {
  const { data, error } = await request<{ user: AuthUser | null; session?: AuthSession }>({
    path: '/api/auth/user',
    method: 'PATCH',
    body: payload,
  });
  if (error) return { data: { user: null }, error };
  if (data?.session) {
    persist(data.session);
    emit('TOKEN_REFRESHED', data.session);
  } else if (data?.user) {
    const cur = readPersisted();
    if (cur) persist({ ...cur, user: data.user });
    emit('USER_UPDATED', readPersisted());
  }
  return { data: { user: data?.user ?? null }, error: null };
}

export async function resetPasswordForEmail(
  email: string,
  options?: { redirectTo?: string },
): Promise<{ data: Record<string, never>; error: ApiErrorShape | null }> {
  const { error } = await request<null>({
    path: '/api/auth/password/reset',
    method: 'POST',
    body: { email, redirect_to: options?.redirectTo },
    auth: false,
  });
  return { data: {}, error };
}

// ---------- auth state change pub/sub ----------

type Subscriber = (event: AuthStateChangeEvent, session: AuthSession | null) => void;

const subscribers = new Set<Subscriber>();

function emit(event: AuthStateChangeEvent, session: AuthSession | null): void {
  for (const cb of subscribers) {
    try {
      cb(event, session);
    } catch (err) {
      console.error('[auth] onAuthStateChange subscriber threw', err);
    }
  }
}

/**
 * Listen for auth changes in this tab AND other tabs (via the `storage` event).
 * Returns `{ data: { subscription: { unsubscribe() } } }` — exactly what
 * `supabase.auth.onAuthStateChange` returns, so no consumer changes are needed.
 */
export function onAuthStateChange(cb: AuthChangeCallback): {
  data: { subscription: { unsubscribe: () => void } };
} {
  const wrapped: Subscriber = (event, session) => {
    void cb(event, session);
  };
  subscribers.add(wrapped);

  // Fire an initial event so components can hydrate on mount, mirroring Supabase.
  queueMicrotask(() => wrapped('INITIAL_SESSION', readPersisted()));

  // Cross-tab sync: react to the underlying storage key changing in another tab.
  const storageHandler = (e: StorageEvent) => {
    if (e.key !== AUTH_STORAGE_KEY) return;
    const next = readPersisted();
    wrapped(next ? 'SIGNED_IN' : 'SIGNED_OUT', next);
  };
  // Same-tab sync: the client module dispatches AUTH_CHANGE_EVENT when it mutates the store.
  const localHandler = (e: Event) => {
    const next = readPersisted();
    const detail = (e as CustomEvent).detail as AuthSession | null | undefined;
    wrapped(detail ? 'SIGNED_IN' : 'SIGNED_OUT', next);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
    window.addEventListener(AUTH_CHANGE_EVENT, localHandler as EventListener);
  }

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          subscribers.delete(wrapped);
          if (typeof window !== 'undefined') {
            window.removeEventListener('storage', storageHandler);
            window.removeEventListener(AUTH_CHANGE_EVENT, localHandler as EventListener);
          }
        },
      },
    },
  };
}

// ---------- composed object to match `supabase.auth` shape ----------

export const auth = {
  getSession,
  getUser,
  signUp,
  signInWithPassword,
  signOut,
  updateUser,
  resetPasswordForEmail,
  onAuthStateChange,
};
