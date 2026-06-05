/**
 * Query builder — a drop-in replacement for `supabase.from(...)`.
 *
 * Design: every chain builds up the same `QueryState`, and the builder is thenable
 * so consumers can `await` it directly (exactly like `@supabase/supabase-js`).
 *
 * The set of supported chains mirrors what the codebase already uses (see
 * BACKEND_API.md for the full list). We do NOT attempt to cover the entire
 * PostgREST surface — only what the app needs. Chains NOT supported deliberately:
 * `.in`, `.or`, `.contains`, `.range`, `.rpc` (rpc is exposed separately).
 *
 * Every terminal `await` produces one HTTP request to one of:
 *   POST   /api/query/:table    (read)
 *   POST   /api/insert/:table
 *   PATCH  /api/update/:table
 *   POST   /api/upsert/:table
 *   DELETE /api/delete/:table
 *
 * Request body carries the accumulated state in a stable, snake_case JSON grammar
 * documented in BACKEND_API.md. Every response is `{ data, error, count? }`.
 */
import { request, type ApiErrorShape } from './client';

type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

type Filter =
  | { op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike' | 'like' | 'is'; col: string; val: unknown };

type OrderSpec = {
  column: string;
  ascending: boolean;
  nulls_first?: boolean;
};

type CountMode = 'exact' | 'planned' | 'estimated' | null;

/**
 * Result shape matches `@supabase/supabase-js`: `data` is nullable and `error` is
 * nullable, and in practice they're mutually exclusive (one of the two is set).
 * Consumers use the `if (error) return` pattern, after which `data` is trusted.
 *
 * Default to `any` to match the untyped Supabase client — consumers of the shim
 * (e.g. `supabase-db.ts`) rely on destructuring rows into arbitrary shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult<T = any> = {
  data: T | null;
  error: ApiErrorShape | null;
  count: number | null;
  status?: number;
  statusText?: string;
};

type QueryState = {
  table: string;
  op: Op;
  /** Columns for SELECT or RETURNING. Defaults to '*' for reads. */
  select: string | null;
  filters: Filter[];
  order: OrderSpec[];
  limit: number | null;
  single: 'single' | 'maybeSingle' | null;
  count: CountMode;
  head: boolean;
  /** Rows for insert/upsert. */
  rows?: unknown;
  /** Values for update. */
  values?: Record<string, unknown>;
  /** Upsert onConflict target. */
  on_conflict?: string;
  /** True once the caller has called `.select(...)` after insert/update/upsert. */
  returning: boolean;
};

function newState(table: string, op: Op): QueryState {
  return {
    table,
    op,
    select: null,
    filters: [],
    order: [],
    limit: null,
    single: null,
    count: null,
    head: false,
    returning: false,
  };
}

// ---------- thenable builder ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class QueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private state: QueryState;
  /** Cached promise so awaiting multiple times doesn't fire the request twice. */
  private _promise: Promise<QueryResult<T>> | null = null;

  constructor(state: QueryState) {
    this.state = state;
  }

  // ---- column selector (used for SELECT op AND for post-write RETURNING) ----

  select(
    columns: string = '*',
    opts?: { count?: CountMode; head?: boolean },
  ): QueryBuilder<T> {
    this.state.select = columns;
    if (opts?.count) this.state.count = opts.count;
    if (opts?.head) this.state.head = true;
    // If the current op is a write, mark that we want the rows returned.
    if (this.state.op !== 'select') this.state.returning = true;
    return this;
  }

  // ---- filters (only meaningful on read / update / delete) ----

  private addFilter(f: Filter): this {
    this.state.filters.push(f);
    return this;
  }

  eq(column: string, value: unknown) {
    return this.addFilter({ op: 'eq', col: column, val: value });
  }
  neq(column: string, value: unknown) {
    return this.addFilter({ op: 'neq', col: column, val: value });
  }
  gt(column: string, value: unknown) {
    return this.addFilter({ op: 'gt', col: column, val: value });
  }
  gte(column: string, value: unknown) {
    return this.addFilter({ op: 'gte', col: column, val: value });
  }
  lt(column: string, value: unknown) {
    return this.addFilter({ op: 'lt', col: column, val: value });
  }
  lte(column: string, value: unknown) {
    return this.addFilter({ op: 'lte', col: column, val: value });
  }
  like(column: string, pattern: string) {
    return this.addFilter({ op: 'like', col: column, val: pattern });
  }
  ilike(column: string, pattern: string) {
    return this.addFilter({ op: 'ilike', col: column, val: pattern });
  }
  is(column: string, value: unknown) {
    return this.addFilter({ op: 'is', col: column, val: value });
  }

  // ---- modifiers ----

  order(
    column: string,
    opts?: { ascending?: boolean; nullsFirst?: boolean },
  ): this {
    this.state.order.push({
      column,
      ascending: opts?.ascending ?? true,
      nulls_first: opts?.nullsFirst,
    });
    return this;
  }

  limit(count: number): this {
    this.state.limit = count;
    return this;
  }

  single(): this {
    this.state.single = 'single';
    return this;
  }

  maybeSingle(): this {
    this.state.single = 'maybeSingle';
    return this;
  }

  // ---- thenable ----

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    if (!this._promise) this._promise = this.execute();
    return this._promise.then(onfulfilled, onrejected);
  }

  // ---- HTTP ----

  private async execute(): Promise<QueryResult<T>> {
    const s = this.state;

    // Build the request body. Keep this stable — BACKEND_API.md documents the schema.
    const body = {
      select: s.select ?? undefined,
      filters: s.filters.length
        ? s.filters.map((f) => ({ op: f.op, column: f.col, value: f.val }))
        : undefined,
      order: s.order.length ? s.order : undefined,
      limit: s.limit ?? undefined,
      single: s.single ?? undefined,
      count: s.count ?? undefined,
      head: s.head || undefined,
      rows: s.op === 'insert' || s.op === 'upsert' ? s.rows : undefined,
      values: s.op === 'update' ? s.values : undefined,
      on_conflict: s.op === 'upsert' ? s.on_conflict : undefined,
      returning: s.op !== 'select' ? s.returning || undefined : undefined,
    };

    let path: string;
    let method: 'POST' | 'PATCH' | 'DELETE';
    switch (s.op) {
      case 'select':
        path = `/api/query/${encodeURIComponent(s.table)}`;
        method = 'POST';
        break;
      case 'insert':
        path = `/api/insert/${encodeURIComponent(s.table)}`;
        method = 'POST';
        break;
      case 'update':
        path = `/api/update/${encodeURIComponent(s.table)}`;
        method = 'PATCH';
        break;
      case 'upsert':
        path = `/api/upsert/${encodeURIComponent(s.table)}`;
        method = 'POST';
        break;
      case 'delete':
        path = `/api/delete/${encodeURIComponent(s.table)}`;
        method = 'DELETE';
        break;
    }

    type Payload = { data?: unknown; count?: number | null };
    const { data, error } = await request<Payload>({ path, method, body });

    if (error) {
      return { data: null, error, count: null };
    }

    // The backend wraps responses in `{ data, count }`. For head-only counts,
    // `data` will be null. For `.single()` / `.maybeSingle()`, backend must
    // return a single object or null respectively.
    const payload: Payload = data ?? {};
    return {
      data: (payload.data as T) ?? null,
      error: null,
      count: typeof payload.count === 'number' ? payload.count : null,
    };
  }
}

// ---------- table root ----------

/**
 * Starts a query chain. Mirrors `supabase.from(table)`.
 *
 * Usage:
 *   from('products').select('*').eq('is_active', true).order('display_order')
 *   from('orders').insert(row).select('id').single()
 *   from('orders').update({ status: 'shipped' }).eq('id', orderId)
 *   from('user_carts').upsert({ user_id, items }, { onConflict: 'user_id' })
 *   from('reviews').delete().eq('id', reviewId)
 */
export function from(table: string) {
  return {
    select(
      columns: string = '*',
      opts?: { count?: CountMode; head?: boolean },
    ): QueryBuilder {
      const state = newState(table, 'select');
      state.select = columns;
      if (opts?.count) state.count = opts.count;
      if (opts?.head) state.head = true;
      return new QueryBuilder(state);
    },

    insert(rows: unknown): QueryBuilder {
      const state = newState(table, 'insert');
      state.rows = Array.isArray(rows) ? rows : [rows];
      return new QueryBuilder(state);
    },

    update(values: Record<string, unknown>): QueryBuilder {
      const state = newState(table, 'update');
      state.values = values;
      return new QueryBuilder(state);
    },

    upsert(
      rows: unknown,
      opts?: { onConflict?: string; ignoreDuplicates?: boolean },
    ): QueryBuilder {
      const state = newState(table, 'upsert');
      state.rows = Array.isArray(rows) ? rows : [rows];
      if (opts?.onConflict) state.on_conflict = opts.onConflict;
      return new QueryBuilder(state);
    },

    delete(): QueryBuilder {
      const state = newState(table, 'delete');
      return new QueryBuilder(state);
    },
  };
}
