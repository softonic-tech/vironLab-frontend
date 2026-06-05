/**
 * Composes the per-surface modules into a single object that matches the shape
 * of a Supabase client. Consumers can use it as a drop-in replacement:
 *
 *   import { api } from '@/lib/api';
 *   api.from('products').select('*').eq('is_active', true)
 *   api.auth.getSession()
 *   api.rpc('generate_order_number')
 *   api.storage.from('product-images').upload(...)
 *   api.functions.invoke('send-email', { body })
 *
 * The legacy module `src/lib/supabase.ts` re-exports this as `supabase` so none of
 * the existing consumer files need to change their imports.
 */
import { auth } from './auth';
import { from } from './query';
import { rpc } from './rpc';
import { storageSurface } from './storage';
import { functions } from './functions';

export const api = {
  auth,
  from,
  rpc,
  storage: storageSurface,
  functions,
};

export type ApiClient = typeof api;

// Re-exports for direct imports when callers don't want the whole client.
export { auth } from './auth';
export { from } from './query';
export { rpc } from './rpc';
export { storageSurface as storage } from './storage';
export { functions } from './functions';
export { request, requestOrThrow, fetchWithTimeout, ApiError } from './client';
export type { ApiErrorShape, ApiResult } from './client';
export type { AuthSession, AuthUser, AuthChangeCallback } from './auth';
export type { QueryResult } from './query';
