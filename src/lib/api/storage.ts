/**
 * Storage surface — drop-in for `supabase.storage.from(bucket).upload() / getPublicUrl()`.
 *
 * Only the subset actually used by the app (admin COA + product-image uploads) is
 * implemented. See AdminDashboard.tsx uploads for the two buckets in use:
 *   - coa_file         (PDFs)
 *   - product-images   (PNG/JPG)
 *
 * Backend contract:
 *   POST  /api/storage/:bucket/upload  multipart field `file`
 *   -> { public_path, url?, filename?, bucket, mime, storage? }
 *   - Local disk: public_path is `/storage/:bucket/...` (and url matches).
 *   - Cloudinary (images): public_path / url are https://res.cloudinary.com/.../image/upload/...
 *   - Cloudinary (COA PDF): https://res.cloudinary.com/.../raw/upload/...
 *
 * After upload, use `data.publicUrl` for DB fields (`image`, `coa_url`) — avoid getPublicUrl()
 * when the server already returned an absolute URL.
 */
import { CONFIG } from '@/lib/config';
import { request, type ApiErrorShape } from './client';

/**
 * Discriminated union — matches `@supabase/supabase-js` closely, with `publicUrl` added
 * so callers can persist the exact URL the backend returned (Cloudinary or API-relative).
 */
export type StorageUploadSuccess = {
  path: string;
  /** Full URL for `product.image`, `coa_url`, or opening the COA PDF (HTTPS Cloudinary or API). */
  publicUrl: string;
};

export type StorageUploadResult =
  | { data: StorageUploadSuccess; error: null }
  | { data: null; error: ApiErrorShape };

export type StoragePublicUrlResult = {
  data: { publicUrl: string };
};

export type UploadOptions = {
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
};

type UploadResponseJson = {
  public_path?: string;
  url?: string;
  filename?: string | null;
  path?: string;
};

function publicUrlBuilder(bucket: string, path: string): string {
  const base = CONFIG.API_URL.replace(/\/$/, '');
  const b = encodeURIComponent(bucket);
  const p = path.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/${b}/${p}`;
}

/** Turn backend `public_path` into an absolute URL for img / DB. */
function absolutePublicUrl(publicPath: string): string {
  const t = publicPath.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const base = CONFIG.API_URL.replace(/\/$/, '');
  if (t.startsWith('/')) return `${base}${t}`;
  return t;
}

export function storage() {
  return {
    from(bucket: string) {
      return {
        async upload(
          path: string,
          file: File | Blob,
          opts?: UploadOptions,
        ): Promise<StorageUploadResult> {
          const form = new FormData();
          form.append('file', file, path);
          form.append('path', path);
          if (opts?.upsert) form.append('upsert', 'true');
          if (opts?.cacheControl) form.append('cache_control', opts.cacheControl);
          if (opts?.contentType) form.append('content_type', opts.contentType);

          const { data: json, error } = await request<UploadResponseJson>({
            path: `/api/storage/${encodeURIComponent(bucket)}/upload`,
            method: 'POST',
            form,
          });
          if (error) return { data: null, error };

          const raw =
            (typeof json?.public_path === 'string' && json.public_path) ||
            (typeof json?.url === 'string' && json.url) ||
            '';

          const pathOut =
            (typeof json?.filename === 'string' && json.filename) ||
            (typeof json?.path === 'string' && json.path) ||
            path;

          const publicUrl = raw
            ? absolutePublicUrl(raw)
            : publicUrlBuilder(bucket, pathOut);

          return { data: { path: pathOut, publicUrl }, error: null };
        },

        getPublicUrl(path: string): StoragePublicUrlResult {
          if (/^https?:\/\//i.test(path)) {
            return { data: { publicUrl: path } };
          }
          return { data: { publicUrl: publicUrlBuilder(bucket, path) } };
        },
      };
    },
  };
}

/** Top-level storage object, composed once so `api.storage.from(...)` works. */
export const storageSurface = storage();
