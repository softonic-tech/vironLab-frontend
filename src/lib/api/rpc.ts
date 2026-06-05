/**
 * RPC surface — drop-in for `supabase.rpc(name, params)`.
 *
 * In Supabase, RPC calls map 1:1 to Postgres stored procedures. In our Node/MongoDB
 * backend, each RPC maps to an HTTP endpoint at `POST /api/rpc/:name`. The 16 RPCs
 * in use are documented in BACKEND_API.md with their exact param shapes and return
 * types.
 *
 * Return shape matches Supabase: `{ data, error }`. The data type depends on the
 * specific RPC (scalar, object, or array).
 */
import { request, type ApiErrorShape } from './client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RpcResult<T = any> = {
  data: T | null;
  error: ApiErrorShape | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rpc<T = any>(
  name: string,
  params?: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const { data, error } = await request<{ data: T }>({
    path: `/api/rpc/${encodeURIComponent(name)}`,
    method: 'POST',
    body: params ?? {},
  });

  if (error) return { data: null, error };

  // Backend contract: wrap the return value in `{ data }`. For scalar returns
  // (e.g. generate_order_number), `data` will be a string/number. For table-returning
  // functions, it will be an array.
  if (data && typeof data === 'object' && 'data' in data) {
    return { data: (data as { data: T }).data ?? null, error: null };
  }
  // Fallback: treat the whole body as the return value if it isn't wrapped.
  return { data: (data as unknown as T) ?? null, error: null };
}
