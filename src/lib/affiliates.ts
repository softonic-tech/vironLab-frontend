import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface Promoter {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  referral_code: string;
  commission_percent: number;
  customer_discount_percent: number;
  tier: string;
  is_active: boolean;
  total_sales: number;
  total_orders: number;
  total_commission: number;
  store_credit: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateOrder {
  id: string;
  promoter_id: string;
  order_id: string;
  order_number: string;
  customer_email: string;
  order_total: number;
  commission_percent: number;
  commission_amount: number;
  customer_discount: number;
  status: string;
  credited_at: string | null;
  created_at: string;
}

export interface StoreCreditTransaction {
  id: string;
  promoter_id: string;
  amount: number;
  type: string;
  description: string;
  order_id: string | null;
  created_at: string;
}

export interface AffiliateValidation {
  valid: boolean;
  error?: string;
  /** affiliate = influencer referral; discount = limited-use store promo code */
  code_type?: 'affiliate' | 'discount';
  promoter_id?: string;
  promoter_name?: string;
  discount_percent?: number;
  discount_code_id?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  usage_limit?: number | null;
  usage_count?: number;
  usage_remaining?: number | null;
}

// Commission tiers — admin can override per-promoter
export const COMMISSION_TIERS = [
  { name: 'standard', label: 'Standard', minSales: 0, commission: 10 },
  { name: 'silver', label: 'Silver', minSales: 1000, commission: 12 },
  { name: 'gold', label: 'Gold', minSales: 5000, commission: 15 },
  { name: 'platinum', label: 'Platinum', minSales: 15000, commission: 20 },
];

export function getTierForSales(totalSales: number): typeof COMMISSION_TIERS[0] {
  const sorted = [...COMMISSION_TIERS].sort((a, b) => b.minSales - a.minSales);
  return sorted.find(t => totalSales >= t.minSales) || COMMISSION_TIERS[0];
}

// ============================================
// VALIDATION
// ============================================

export async function validateDiscountCode(code: string): Promise<AffiliateValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_discount_code', { p_code: code });
    if (error) {
      console.error('validate_discount_code error:', error);
      return { valid: false, error: 'Unable to validate code' };
    }
    return data as AffiliateValidation;
  } catch (e) {
    console.error('validateDiscountCode exception:', e);
    return { valid: false, error: 'Unable to validate code' };
  }
}

export async function validateAffiliateCode(code: string): Promise<AffiliateValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_affiliate_code', { p_code: code });
    if (error) {
      console.error('validate_affiliate_code error:', error);
      return { valid: false, error: 'Unable to validate code' };
    }
    const result = data as AffiliateValidation;
    if (result?.valid && !result.code_type) {
      return { ...result, code_type: 'affiliate' };
    }
    return result;
  } catch (e) {
    console.error('validateAffiliateCode exception:', e);
    return { valid: false, error: 'Unable to validate code' };
  }
}

/** Try limited-use discount codes first, then influencer referral codes. */
export async function validatePromoCode(code: string): Promise<AffiliateValidation> {
  const discount = await validateDiscountCode(code);
  if (discount.valid) return discount;
  const affiliate = await validateAffiliateCode(code);
  if (affiliate.valid) return affiliate;
  // Prefer the more specific discount-code error when the code looked like a promo.
  return discount.error && discount.error !== 'Code not found or inactive'
    ? discount
    : affiliate.error
      ? affiliate
      : { valid: false, error: 'Invalid code' };
}

export async function recordDiscountCodeUsage(params: {
  discount_code_id: string;
  order_id: string;
  discount_amount: number;
  user_id?: string | null;
}): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('record_discount_code_usage', {
      p_discount_code_id: params.discount_code_id,
      p_order_id: params.order_id,
      p_discount_amount: params.discount_amount,
      p_user_id: params.user_id ?? null,
    });
    if (error) {
      console.error('record_discount_code_usage error:', error);
      return false;
    }
    return !!(data as { ok?: boolean })?.ok;
  } catch (e) {
    console.error('recordDiscountCodeUsage exception:', e);
    return false;
  }
}

// ============================================
// PROMOTER CRUD (Admin)
// ============================================

export async function getAllPromoters(): Promise<Promoter[]> {
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAllPromoters error:', error);
    return [];
  }
  return data || [];
}

export async function getPromoterByCode(code: string): Promise<Promoter | null> {
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .ilike('referral_code', code)
    .maybeSingle();
  if (error) {
    console.error('getPromoterByCode error:', error);
    return null;
  }
  return data;
}

export async function getPromoterByUserId(userId: string): Promise<Promoter | null> {
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('getPromoterByUserId error:', error);
    return null;
  }
  return data;
}

/** Match promoter row by account email (case-insensitive). Used when `user_id` was not set on insert. */
export async function getPromoterByEmail(email: string): Promise<Promoter | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .ilike('email', normalized)
    .maybeSingle();
  if (error) {
    console.error('getPromoterByEmail error:', error);
    return null;
  }
  return data;
}

/**
 * Resolve the promoter row for whoever is logged in.
 * 1) `promoters.user_id` = auth user id (same id as `public.profiles.id` — no separate profiles FK)
 * 2) else `promoters.email` matches auth email (admin can create promoter before user exists)
 */
export async function getPromoterForSessionUser(): Promise<Promoter | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const byId = await getPromoterByUserId(user.id);
  if (byId) return byId;
  if (user.email) return getPromoterByEmail(user.email);
  return null;
}

/**
 * Admin-only: create influencer (promoter) account, link or create auth user, send welcome email.
 * See backend `POST /api/rpc/admin_create_influencer`.
 */
export async function adminCreateInfluencer(input: {
  name: string;
  email: string;
  referral_code: string;
  commission_percent?: number;
  customer_discount_percent?: number;
}): Promise<{
  ok: boolean;
  error?: string;
  account_action?: 'created' | 'linked';
  email_sent?: boolean;
  promoter?: Promoter;
}> {
  try {
    const { data, error } = await supabase.rpc('admin_create_influencer', {
      p_name: input.name,
      p_email: input.email,
      p_referral_code: input.referral_code,
      p_commission_percent: input.commission_percent ?? 10,
      p_customer_discount_percent: input.customer_discount_percent ?? 10,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const payload = data as {
      ok?: boolean;
      account_action?: 'created' | 'linked';
      email_sent?: boolean;
      promoter?: Promoter;
    } | null;
    if (!payload?.ok || !payload.promoter) {
      return { ok: false, error: 'Unexpected response from server' };
    }
    return {
      ok: true,
      account_action: payload.account_action,
      email_sent: payload.email_sent,
      promoter: payload.promoter,
    };
  } catch (e) {
    console.error('adminCreateInfluencer exception:', e);
    return { ok: false, error: 'Failed to create influencer' };
  }
}

export async function createPromoter(input: {
  name: string;
  email: string;
  referral_code: string;
  commission_percent?: number;
  customer_discount_percent?: number;
  user_id?: string | null;
}): Promise<{ ok: boolean; error?: string; promoter?: Promoter }> {
  const { data, error } = await supabase
    .from('promoters')
    .insert({
      name: input.name,
      email: input.email,
      referral_code: input.referral_code.toUpperCase(),
      commission_percent: input.commission_percent ?? 10,
      customer_discount_percent: input.customer_discount_percent ?? 10,
      user_id: input.user_id ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('duplicate')) {
      return { ok: false, error: 'Referral code or email already exists' };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, promoter: data };
}

export async function updatePromoter(
  id: string,
  updates: Partial<Pick<Promoter, 'name' | 'email' | 'referral_code' | 'commission_percent' | 'customer_discount_percent' | 'is_active' | 'tier' | 'user_id'>>
): Promise<{ ok: boolean; error?: string }> {
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.referral_code) payload.referral_code = updates.referral_code.toUpperCase();

  const { error } = await supabase
    .from('promoters')
    .update(payload)
    .eq('id', id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deletePromoter(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('promoters').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============================================
// AFFILIATE ORDERS
// ============================================

export async function recordAffiliateOrder(params: {
  promoter_id: string;
  order_id: string;
  order_number: string;
  customer_email: string;
  order_total: number;
  customer_discount?: number;
}): Promise<{ ok: boolean; commission?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('record_affiliate_order', {
      p_promoter_id: params.promoter_id,
      p_order_id: params.order_id,
      p_order_number: params.order_number,
      p_customer_email: params.customer_email,
      p_order_total: params.order_total,
      p_customer_discount: params.customer_discount ?? 0,
    });
    if (error) return { ok: false, error: error.message };
    const result = data as { ok: boolean; commission?: number; error?: string };
    return result;
  } catch (e) {
    console.error('recordAffiliateOrder exception:', e);
    return { ok: false, error: 'Failed to record affiliate order' };
  }
}

export async function creditAffiliateCommission(orderId: string): Promise<{ ok: boolean; credited?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('credit_affiliate_commission', { p_order_id: orderId });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; credited?: number; error?: string };
  } catch (e) {
    console.error('creditAffiliateCommission exception:', e);
    return { ok: false, error: 'Failed to credit commission' };
  }
}

export async function getAffiliateOrdersForPromoter(promoterId: string): Promise<AffiliateOrder[]> {
  const { data, error } = await supabase
    .from('affiliate_orders')
    .select('*')
    .eq('promoter_id', promoterId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAffiliateOrdersForPromoter error:', error);
    return [];
  }
  return data || [];
}

export async function getAllAffiliateOrders(): Promise<(AffiliateOrder & { promoter_name?: string; promoter_code?: string })[]> {
  const { data, error } = await supabase
    .from('affiliate_orders')
    .select('*, promoters(name, referral_code)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAllAffiliateOrders error:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    ...row,
    promoter_name: row.promoters?.name,
    promoter_code: row.promoters?.referral_code,
  }));
}

// ============================================
// STORE CREDIT
// ============================================

export async function getStoreCreditTransactions(promoterId: string): Promise<StoreCreditTransaction[]> {
  const { data, error } = await supabase
    .from('store_credit_transactions')
    .select('*')
    .eq('promoter_id', promoterId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getStoreCreditTransactions error:', error);
    return [];
  }
  return data || [];
}

export async function adjustStoreCredit(
  promoterId: string,
  amount: number,
  description: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('adjust_store_credit', {
      p_promoter_id: promoterId,
      p_amount: amount,
      p_description: description,
    });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string };
  } catch (e) {
    console.error('adjustStoreCredit exception:', e);
    return { ok: false, error: 'Failed to adjust credit' };
  }
}

export async function useStoreCredit(
  promoterId: string,
  amount: number,
  description?: string
): Promise<{ ok: boolean; remaining?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('use_store_credit', {
      p_promoter_id: promoterId,
      p_amount: amount,
      p_description: description ?? 'Store credit used at checkout',
    });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; remaining?: number; error?: string };
  } catch (e) {
    console.error('useStoreCredit exception:', e);
    return { ok: false, error: 'Failed to use store credit' };
  }
}

// Fraud: prevent self-referral
export function isSelfReferral(promoterEmail: string, customerEmail: string): boolean {
  return promoterEmail.toLowerCase().trim() === customerEmail.toLowerCase().trim();
}

/** True if the logged-in customer is the same person as the promoter (by auth id or email). */
export async function isPromoterSelfOrder(
  userId: string | null,
  code: string,
  customerEmail?: string
): Promise<boolean> {
  const promoter = await getPromoterByCode(code);
  if (!promoter) return false;
  if (userId && promoter.user_id === userId) return true;
  if (customerEmail && isSelfReferral(promoter.email, customerEmail)) return true;
  return false;
}
