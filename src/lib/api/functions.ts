/**
 * Functions surface — drop-in for `supabase.functions.invoke(name, { body })`.
 *
 * In Supabase, Edge Functions live on the Deno runtime. On our Node backend, each
 * function is just a POST endpoint under `/api/functions/:name`. Body is forwarded
 * as JSON. Return shape matches Supabase: `{ data, error }`.
 *
 * Only consumer today: `send-email` from src/lib/email.ts.
 */
import { request, type ApiErrorShape } from './client';

export type InvokeOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InvokeResult<T = any> = {
  data: T | null;
  error: ApiErrorShape | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function invoke<T = any>(
  name: string,
  options?: InvokeOptions,
): Promise<InvokeResult<T>> {
  const { data, error } = await request<T>({
    path: `/api/functions/${encodeURIComponent(name)}`,
    method: options?.method ?? 'POST',
    body: options?.body,
    headers: options?.headers,
  });
  return { data: (data as T) ?? null, error };
}

export const functions = { invoke };
