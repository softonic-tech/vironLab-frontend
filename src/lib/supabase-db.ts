import { supabase } from './supabase';
import { CONFIG } from './config';
import { generateLocalOrderNumber } from '@/utils/order-number';
import type { Product } from '@/products';
import { getBundlePricing, resolveDosageSekPrice } from '@/utils/pricing';
import type { PointType } from '@/utils/points';
import {
  cached, invalidateCache,
  TTL_PRODUCTS, TTL_PRODUCT, TTL_REVIEWS, TTL_ADMIN, TTL_UUID, TTL_USER_SHORT,
  TTL_USER_ORDERS, TTL_USER_REVIEWS,
} from './cache';

// ============================================
// PRODUCTS - Load from Supabase
// ============================================

export interface ProductFromDB {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url?: string | null;
  image?: string | null;
  coa_url?: string | null;
  more_info?: string | null;
  review_count: number;
  average_rating: number;
  is_active: boolean;
  product_dosages: DosageFromDB[];
}

export interface DosageFromDB {
  id: string;
  product_id: string;
  mg: number | string;
  unit?: string | null;
  // Some deployments store this as snake_case `original_price`,
  // others store as quoted camelCase `"originalPrice"`.
  original_price?: number | null;
  originalPrice?: number | null;
  price?: number | null;
  in_stock: boolean;
  stock_quantity: number;
}

// Load all products with their dosages
const _loadProductsFromSupabase = async (): Promise<Product[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_dosages (*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      // Fallback: if display_order column doesn't exist yet, use category sort
      if (error.message?.includes('display_order')) {
        const { data: fallback, error: fallbackErr } = await supabase
          .from('products')
          .select(`*, product_dosages (*)`)
          .eq('is_active', true)
          .order('category', { ascending: false });
        if (fallbackErr) {
          console.error('Error loading products:', fallbackErr);
          return [];
        }
        return (fallback || []).map(transformProductFromDB);
      }
      console.error('Error loading products:', error);
      return [];
    }

    if (!products || products.length === 0) {
      return [];
    }

    return products.map(transformProductFromDB);
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

export const loadProductsFromSupabase = (): Promise<Product[]> =>
  cached('products:all', _loadProductsFromSupabase, TTL_PRODUCTS, true, true);

/** Active products whose DB `category` is Essentials (case-insensitive), for cart upsells. */
const _loadEssentialProductsFromSupabase = async (): Promise<Product[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`*, product_dosages (*)`)
      .eq('is_active', true)
      .ilike('category', 'essentials')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading essential products:', error);
      return [];
    }
    if (!products?.length) return [];
    return products.map(transformProductFromDB);
  } catch (e) {
    console.error('loadEssentialProductsFromSupabase:', e);
    return [];
  }
};

export const loadEssentialProductsFromSupabase = (): Promise<Product[]> =>
  cached('products:essentials', _loadEssentialProductsFromSupabase, TTL_PRODUCTS, true, true);

// Normalize image / asset URL:
// - `https?://` and `//` (protocol-relative) CDN URLs (e.g. Cloudinary) are left as real URLs, never prefixed with the API origin.
// - Scheme-less absolute URLs (`res.cloudinary.com/.../image/upload/...`) get `https://`.
// - Root-relative `/storage/...` is served by the Node API → prefix `VITE_API_URL`.
// - Other root-relative paths stay on the Vite origin (public/).
export function normalizeImageUrl(raw: string | null | undefined): string {
  const s = (raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  // Host/path without scheme (common when pasting Cloudinary links without https://)
  if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\//.test(s)) {
    return `https://${s}`;
  }
  const withSlash = s.startsWith('/') ? s : `/${s}`;
  const imagesProductsMatch = withSlash.match(/\/images\/products\/(.+)$/i);
  if (imagesProductsMatch) return `/${imagesProductsMatch[1].replace(/^\/+/, '')}`;
  if (withSlash.startsWith('/storage/')) {
    const base = CONFIG.API_URL.replace(/\/$/, '');
    return `${base}${withSlash}`;
  }
  return withSlash;
}

// Transform from DB format to app format
const transformProductFromDB = (dbProduct: ProductFromDB): Product => {
  const dosageRows = dbProduct.product_dosages
    ? [...dbProduct.product_dosages].sort((a, b) => String(a.id).localeCompare(String(b.id)))
    : [];
  const dosages = dosageRows.map((d: DosageFromDB) => ({
    mg: d.mg,
    unit: (d.unit ?? 'MG') as any,
    originalPrice: resolveDosageSekPrice(d),
    inStock: d.in_stock,
  }));

  const catLower = (dbProduct.category || '').toLowerCase().replace(/\s+/g, '-');
  const normalizedCategory = catLower as Product['category'];

  return {
    id: dbProduct.slug,
    name: dbProduct.name,
    description: dbProduct.description,
    moreInfo: dbProduct.more_info ?? null,
    coaUrl: dbProduct.coa_url ? normalizeImageUrl(dbProduct.coa_url) : null,
    category: normalizedCategory,
    type: 'metabolic',
    dosages,
    image: normalizeImageUrl(dbProduct.image_url ?? dbProduct.image ?? ''),
    badge: catLower.includes('best') ? '🔥 BEST SELLER' :
           catLower.includes('high') ? '⭐ HIGH DEMAND' :
           catLower === 'essentials' ? '🧪 ESSENTIAL' : 'POPULAR',
    vialType: 'white',
    bundlePricing: [
      { quantity: 1,  label: 'Buy 1' },
      { quantity: 2,  label: 'Buy 2' },
      { quantity: 3,  label: 'Buy 3' },
      { quantity: 5,  label: 'Buy 5' },
      { quantity: 10, label: 'Buy 10' },
    ],
    reviewCount: dbProduct.review_count,
    technicalSpecs: {
      purity: '≥99.0% (verified by Certificate of Analysis)',
      appearance: 'White to off-white lyophilised powder',
      solubility: 'Soluble in sterile water or appropriate aqueous buffers',
      qualityVerification: 'Identity and purity confirmed by RP-HPLC',
      storageConditions: 'Store dry at 2–8 °C. Reconstituted material should be refrigerated and used within 4 weeks',
    },
  };
};

// ============================================
// STOCK MANAGEMENT - Admin Functions
// ============================================

export const toggleDosageStock = async (
  dosageId: string,
  inStock: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_dosages')
      .update({ in_stock: inStock })
      .eq('id', dosageId);

    if (error) {
      console.error('Error updating stock:', error);
      return false;
    }
    invalidateCache('products:');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

/** Update only the original price for a dosage. Bundle prices are computed from this. */
export const updateDosagePricing = async (
  dosageId: string,
  originalPrice: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_dosages')
      .update({ original_price: originalPrice })
      .eq('id', dosageId);

    if (error) {
      console.error('Error updating pricing:', error);
      return false;
    }
    invalidateCache('products:');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export const updateStockQuantity = async (
  dosageId: string,
  quantity: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_dosages')
      .update({ stock_quantity: quantity })
      .eq('id', dosageId);

    if (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
    invalidateCache('products:');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

// ============================================
// USER POINTS - New append-only event table
// ============================================

export interface PointsEvent {
  id: string;
  user_id: string;
  points: number;
  type: PointType;
  description: string;
  order_id?: string | null;
  created_at: string;
}

/**
 * Get the user's current point balance by summing all event rows.
 * Never reads a cached balance column — always computed from source.
 */
export const getUserPointsBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user points balance:', error);
      // Legacy fallback: older schema stored `balance` on the user_points row.
      const { data: legacyRow, error: legacyErr } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (legacyErr) {
        console.error('Error getting legacy points balance:', legacyErr);
        return 0;
      }

      return ((legacyRow as { balance?: number } | null)?.balance ?? 0);
    }

    return (data || []).reduce((sum, row) => sum + (row.points ?? 0), 0);
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
};

/**
 * Get all point events for a user, newest first.
 */
export const getUserTransactions = async (userId: string): Promise<PointsEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) {
      return (data || []) as PointsEvent[];
    }

    console.error('Error getting transactions (event schema):', error);

    // Legacy fallback: older schema used `points_transactions`.
    const { data: legacyTxns, error: legacyErr } = await supabase
      .from('points_transactions')
      .select('id, user_id, points, type, description, order_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (legacyErr) {
      console.error('Error getting legacy transactions:', legacyErr);
      return [];
    }

    return (legacyTxns || []) as PointsEvent[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

/**
 * Insert a point event row via the update_user_points RPC (SECURITY DEFINER).
 */
export const addUserPoints = async (
  userId: string,
  points: number,
  type: PointType | string,
  description: string,
  orderId?: string | null
): Promise<boolean> => {
  try {
    // Important: don't swallow RPC errors — the admin UI needs to know
    // if the insert/write actually succeeded.
    console.log('[addUserPoints] rpc:update_user_points', { userId, points, type, description, orderId });
    const { error } = await supabase.rpc('update_user_points', {
      p_user_id: userId,
      p_points: points,
      p_type: type,
      p_description: description,
      p_order_id: orderId ?? null,
    });

    if (error) {
      console.error('[addUserPoints] RPC failed', error);
      throw new Error(error.message || 'Failed to add points');
    }

    return true;
  } catch (error) {
    console.error('[addUserPoints] Exception', error);
    throw error;
  }
};

/**
 * Count how many 'purchase' event rows the user has.
 * Used to determine if the first-order bonus should be awarded.
 */
export const getEarnedTransactionsCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('user_points')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'purchase');

    if (error) {
      console.error('Error getting earned count:', error);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
};

/**
 * Check if purchase points were already awarded for a specific order.
 * Prevents double-awarding when both "Mark Paid" and "Add Tracking" are triggered.
 */
export const getOrderPointsAwarded = async (orderId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('user_points')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('type', 'purchase');

    if (error) {
      console.error('Error checking order points:', error);
      return false;
    }
    return (count ?? 0) > 0;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

/**
 * Sum of purchase points for an order (used when revoking on cancel/delete).
 */
export const getOrderEarnedPointsSum = async (orderId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_order_earned_points_sum', { p_order_id: orderId });
    if (error) {
      console.warn('Error getOrderEarnedPointsSum', { orderId, error: error.message });
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (error) {
    console.error('getOrderEarnedPointsSum exception', { orderId, error });
    return 0;
  }
};

// ============================================
// REFERRALS
// ============================================

export interface ReferralFromDB {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export const insertReferral = async (
  referrerId: string,
  referredUserId: string,
  referredEmail: string
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_user_id: referredUserId,
      referred_email: referredEmail,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as { message?: string } | null)?.message;
    return { ok: false, error: msg ?? 'Failed to create referral' };
  }
};

export const createReferralAndAward = async (
  referrerId: string,
  referredUserId: string,
  referredEmail: string,
  bonusPoints: number = 100
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('create_referral_and_award', {
      p_referrer_id: referrerId,
      p_referred_user_id: referredUserId,
      p_referred_email: referredEmail,
      p_bonus_points: bonusPoints,
    });
    if (error) {
      console.warn('[Referral] create_referral_and_award RPC error', error);
      return { ok: false, error: error.message };
    }
    const result = data as { ok?: boolean; error?: string } | null;
    if (result && result.ok === false) {
      return { ok: false, error: result.error ?? 'Unknown error' };
    }
    return { ok: true };
  } catch (e: unknown) {
    console.error('[Referral] create_referral_and_award exception', e);
    const msg = (e as { message?: string } | null)?.message;
    return { ok: false, error: msg ?? 'Failed to create referral' };
  }
};

export const getReferrals = async (referrerId: string): Promise<ReferralFromDB[]> => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error getting referrals:', error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

// ============================================
// ORDERS
// ============================================

export interface OrderFromDB {
  id: string;
  order_number: string;
  user_id: string;
  email: string;
  full_name: string;
  items: unknown[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  created_at: string;
}

export const createOrder = async (orderData: Partial<OrderFromDB>): Promise<string | null> => {
  try {
    const { data: orderNumber, error: fnError } = await supabase.rpc('generate_order_number');

    if (fnError) {
      console.error('Error generating order number:', fnError);
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        order_number: orderNumber || generateLocalOrderNumber(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

export const getUserOrders = (userId: string): Promise<OrderFromDB[]> =>
  cached(
    `user_orders:${userId}`,
    async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) { console.error('Error getting orders:', error); return []; }
        return data || [];
      } catch (err) { console.error('Error:', err); return []; }
    },
    TTL_USER_ORDERS,
  );

export interface UserReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: string;
  is_verified_purchase: boolean;
  products: { name: string } | null;
}

export const getUserReviews = (userId: string): Promise<UserReview[]> =>
  cached(
    `user_reviews:${userId}`,
    async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('id, rating, title, comment, created_at, is_verified_purchase, products(name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) { console.error('Error loading user reviews:', error); return []; }
        return (data || []) as UserReview[];
      } catch (err) { console.error('Error:', err); return []; }
    },
    TTL_USER_REVIEWS,
  );

// ============================================
// REVIEWS
// ============================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const _getProductUuidBySlug = async (slugOrId: string): Promise<string | null> => {
  try {
    if (UUID_REGEX.test(slugOrId)) {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('id', slugOrId)
        .maybeSingle();
      if (!error && data?.id) return data.id;
    }
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slugOrId)
      .maybeSingle();

    if (error) {
      console.error('Error resolving product by slug:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

export const getProductUuidBySlug = (slugOrId: string): Promise<string | null> =>
  cached(`uuid:${slugOrId}`, () => _getProductUuidBySlug(slugOrId), TTL_UUID, false);

// Load a full storefront product by `products.slug`.
// Returns app-shaped `Product` (with dosages + coa_url/more_info mapped).
const _getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_dosages (*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error loading product by slug:', error);
      return null;
    }

    if (!data) return null;
    return transformProductFromDB(data);
  } catch (err) {
    console.error('getProductBySlug exception:', err);
    return null;
  }
};

export const getProductBySlug = (slug: string): Promise<Product | null> =>
  cached(`product:${slug}`, () => _getProductBySlug(slug), TTL_PRODUCT, true, true);

export interface CreateReviewInput {
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified_purchase?: boolean;
}

export type CreateReviewResult = { id: string } | { error: string };

export const createReview = async (input: CreateReviewInput): Promise<CreateReviewResult> => {
  try {
    const row: Record<string, unknown> = {
      user_id: input.user_id,
      product_id: input.product_id,
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment,
      is_verified_purchase: input.is_verified_purchase ?? false,
      helpful_count: 0,
      is_approved: true,
    };
    const { data, error } = await supabase
      .from('reviews')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return { error: error.message };
    }
    return data?.id ? { id: data.id } : { error: 'No id returned' };
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = (error as { message?: string } | null)?.message;
    return { error: msg ?? 'Failed to submit review' };
  }
};

export const getUserReviewCount = (userId: string): Promise<number> =>
  cached(
    `review_count:${userId}`,
    async () => {
      try {
        const { count, error } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (error) { console.error('Error getting review count:', error); return 0; }
        return count ?? 0;
      } catch (err) { console.error('Error:', err); return 0; }
    },
    TTL_USER_SHORT,
  );

// ============================================
// ADMIN FUNCTIONS
// ============================================

export const checkIsAdmin = (userId: string): Promise<boolean> =>
  cached(
    `admin:${userId}`,
    async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (user?.id === userId && user?.user_metadata?.role === 'admin') return true;
        const { data, error } = await supabase
          .from('profiles').select('is_admin').eq('id', userId).single();
        if (error) return false;
        return data?.is_admin === true;
      } catch (err) { console.error('Error checking admin:', err); return false; }
    },
    TTL_ADMIN,
  );

export const getAllOrders = async (): Promise<OrderFromDB[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  trackingNumber?: string
): Promise<boolean> => {
  try {
    const updateData: { status: string; tracking_number?: string } = { status };
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.rpc('log_admin_action', {
      p_admin_id: adminId,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details ?? {},
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// ============================================
// HOMEPAGE REVIEWS (public, cached)
// ============================================

export interface HomepageReviewRow {
  id: string;
  title?: string | null;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean | null;
  helpful_count?: number | null;
  products?: { name?: string | null } | null;
}

export const getHomepageReviews = (): Promise<HomepageReviewRow[]> =>
  cached(
    'reviews:homepage',
    async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, title, rating, comment, is_verified_purchase, helpful_count, products(name)')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) { console.error('Failed to load homepage reviews:', error); return []; }
      return (data || []) as HomepageReviewRow[];
    },
    TTL_REVIEWS,
    false,
    true, // SWR: return stale immediately, refresh in background
  );

// Re-export cache invalidation for admin use
export { invalidateCache };

// Re-export getBundlePricing for convenience in admin dashboard
export { getBundlePricing };
