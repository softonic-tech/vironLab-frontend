/**
 * HTTP client for the Node/MongoDB backend.
 *
 * This is the low-level fetch wrapper used by every other module in `src/lib/api/`.
 * It is intentionally tiny and framework-agnostic. Higher-level modules (auth, query,
 * rpc, storage, functions) build on top of it and expose Supabase-compatible shapes.
 *
 * Contract assumed from the backend:
 *   - JSON responses with HTTP status codes that reflect the outcome.
 *   - On error: `{ error: { message: string, code?: string } }` body.
 *   - Auth: `Authorization: Bearer <access_token>` header. On 401, we try to refresh
 *     exactly once with `POST /api/auth/refresh` using the stored refresh_token.
 */
import { CONFIG } from '@/lib/config';

/** Prevents hung tabs after long backgrounding: native fetch has no default timeout. */
export const FETCH_TIMEOUT_MS = 15_000;

export type ApiErrorShape = {
  message: string;
  code?: string;
  status?: number;
  /** Present when the server returned a structured error body we couldn't normalize. */
  raw?: unknown;
};

export class ApiError extends Error {
  code?: string;
  status?: number;
  raw?: unknown;
  constructor(err: ApiErrorShape) {
    super(err.message);
    this.name = 'ApiError';
    this.code = err.code;
    this.status = err.status;
    this.raw = err.raw;
  }
}

/** Combine two AbortSignals — used to merge per-request timeouts with caller-supplied signals. */
export function combineAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b]);
  }
  const merged = new AbortController();
  const abort = () => merged.abort();
  if (a.aborted || b.aborted) {
    abort();
    return merged.signal;
  }
  a.addEventListener('abort', abort);
  b.addEventListener('abort', abort);
  return merged.signal;
}

/**
 * Wraps fetch so requests fail fast instead of hanging indefinitely (common after
 * a tab sleeps for hours and the browser leaves TCP connections in a bad state).
 * Exposed with its original name so existing code that imports `fetchWithTimeout`
 * from `@/lib/supabase` keeps working.
 */
export const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const outer = init?.signal;
  const signal = outer ? combineAbortSignals(controller.signal, outer) : controller.signal;
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timer));
};

// ---------- auth token store (read-only from this file to avoid circular imports) ----------

/** localStorage key holding the session JSON. Auth module writes it; client only reads. */
export const AUTH_STORAGE_KEY = 'vironlabs-auth-session';

/** Event name the auth module dispatches on window after mutating the session. */
export const AUTH_CHANGE_EVENT = 'vironlabs:auth-changed';

type StoredSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: unknown;
};

function readStoredSession(): StoredSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.access_token === 'string') {
      return parsed as StoredSession;
    }
  } catch {
    /* ignore parse errors */
  }
  return null;
}

function writeStoredSession(session: StoredSession | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: session }));
    }
  } catch {
    /* ignore quota / disabled-storage errors */
  }
}

export const sessionStore = {
  read: readStoredSession,
  write: writeStoredSession,
};

// ---------- core request ----------

export type RequestOptions = {
  /** Path joined to `CONFIG.API_URL`. Must start with `/`. */
  path: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** JSON body; serialized with `JSON.stringify`. Ignored when `form` is set. */
  body?: unknown;
  /** FormData body — used for multipart uploads. Takes precedence over `body`. */
  form?: FormData;
  /** Extra headers. `Authorization` and `Content-Type` are handled automatically. */
  headers?: Record<string, string>;
  /** If false, don't attach the Authorization header (used by sign-in / sign-up). */
  auth?: boolean;
  /** If true, return the raw Response instead of JSON (for file downloads). */
  raw?: boolean;
  /** Caller-supplied AbortSignal, merged with the internal timeout. */
  signal?: AbortSignal;
};

export type ApiResult<T> = { data: T | null; error: ApiErrorShape | null };

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function parseError(res: Response): Promise<ApiErrorShape> {
  try {
    const body = await res.clone().json();
    if (body && typeof body === 'object') {
      const err = (body as { error?: unknown }).error;
      if (err && typeof err === 'object') {
        const e = err as { message?: unknown; code?: unknown };
        return {
          message: typeof e.message === 'string' ? e.message : `HTTP ${res.status}`,
          code: typeof e.code === 'string' ? e.code : undefined,
          status: res.status,
          raw: body,
        };
      }
      if (typeof err === 'string') {
        return { message: err, status: res.status, raw: body };
      }
      if (typeof (body as { message?: unknown }).message === 'string') {
        return {
          message: (body as { message: string }).message,
          status: res.status,
          raw: body,
        };
      }
    }
  } catch {
    /* fall through */
  }
  try {
    const text = await res.text();
    if (text) return { message: text, status: res.status };
  } catch {
    /* ignore */
  }
  return { message: `HTTP ${res.status}`, status: res.status };
}

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const current = readStoredSession();
  if (!current?.refresh_token) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetchWithTimeout(joinUrl(CONFIG.API_URL, '/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      if (!res.ok) {
        writeStoredSession(null);
        return false;
      }
      const json = (await res.json()) as { session?: StoredSession };
      if (json?.session?.access_token) {
        writeStoredSession(json.session);
        return true;
      }
      writeStoredSession(null);
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function doFetch(opts: RequestOptions, accessTokenOverride?: string): Promise<Response> {
  const url = joinUrl(CONFIG.API_URL, opts.path);
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };

  if (opts.auth !== false) {
    const token = accessTokenOverride ?? readStoredSession()?.access_token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.form) {
    // Browser sets the multipart boundary automatically — do NOT set Content-Type.
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    body = JSON.stringify(opts.body);
  }

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
    body,
  };
  if (opts.signal) init.signal = opts.signal;

  return fetchWithTimeout(url, init);
}

/**
 * Perform a request. On 401, tries exactly one refresh-and-retry before giving up.
 * Returns `{ data, error }` — never throws for expected failures.
 */
export async function request<T>(opts: RequestOptions): Promise<ApiResult<T>> {
  try {
    let res = await doFetch(opts);

    if (res.status === 401 && opts.auth !== false) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        res = await doFetch(opts);
      }
    }

    if (!res.ok) {
      return { data: null, error: await parseError(res) };
    }

    if (opts.raw) {
      return { data: res as unknown as T, error: null };
    }

    if (res.status === 204) {
      return { data: null, error: null };
    }

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      return { data: (text as unknown as T) ?? null, error: null };
    }

    const json = (await res.json()) as T;
    return { data: json, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Request timed out'
          : err.message
        : 'Network error';
    return { data: null, error: { message } };
  }
}

/** Convenience: same as `request` but throws on error. Useful inside auth flows. */
export async function requestOrThrow<T>(opts: RequestOptions): Promise<T> {
  const { data, error } = await request<T>(opts);
  if (error) throw new ApiError(error);
  return data as T;
}
