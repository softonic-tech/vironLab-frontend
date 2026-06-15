/**
 * Centralized pricing utility.
 * All bundle discount calculations must go through this file.
 *
 * The database stores the **sell price** (what the customer pays for Buy 1).
 * When the storefront discount badge is enabled, we derive a higher list price
 * so "X% off" lands on the sell price.
 */

/** Discount percentage (as a decimal) for each supported bundle quantity. */
export const BUNDLE_DISCOUNTS: Record<number, number> = {
  1: 0.20,  // legacy label — Buy 1 uses sell price directly
  2: 0.25,  // Buy 2 → 25% off sell (admin preview tiers)
  3: 0.30,  // Buy 3 → 30% off sell
  5: 0.36,  // Buy 5 → 36% off sell
  10: 0.44, // Buy 10 → 44% off sell
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Read sell price from a dosage row returned by the API (already SEK). */
export function resolveDosageSekPrice(row: {
  original_price?: number | null;
  originalPrice?: number | null;
  price?: number | null;
}): number {
  const n = row.original_price ?? row.originalPrice ?? row.price ?? 0;
  return round2(Number(n));
}

/** Format an amount that is already in SEK — no currency conversion. */
export function formatSek(amount: number): string {
  return `${round2(amount).toFixed(2)} kr`;
}

/**
 * Inflated list price shown struck-through when a storefront discount is active.
 * sellPrice / (1 - discount%) so applying the discount returns the sell price.
 */
export function getStorefrontListPrice(
  sellPrice: number,
  discountEnabled: boolean,
  discountPercentage: number,
): number {
  if (!discountEnabled || !discountPercentage) return sellPrice;
  const factor = 1 - discountPercentage / 100;
  if (factor <= 0) return sellPrice;
  return round2(sellPrice / factor);
}

/**
 * Calculate the per-unit price for admin bundle preview tiers.
 * Buy 1 is the sell price; higher quantities use BUNDLE_DISCOUNTS off sell.
 */
export function calculatePrice(sellPrice: number, quantity: number): number {
  if (quantity === 1) return round2(sellPrice);
  const discount = BUNDLE_DISCOUNTS[quantity] ?? BUNDLE_DISCOUNTS[1];
  return round2(sellPrice * (1 - discount));
}

export interface BundlePrices {
  buy1: number;
  buy2: number;
  buy3: number;
  buy5: number;
  buy10: number;
}

/**
 * Return per-unit prices for admin bundle preview tiers (sell price = Buy 1).
 */
export function getBundlePricing(sellPrice: number): BundlePrices {
  return {
    buy1:  calculatePrice(sellPrice, 1),
    buy2:  calculatePrice(sellPrice, 2),
    buy3:  calculatePrice(sellPrice, 3),
    buy5:  calculatePrice(sellPrice, 5),
    buy10: calculatePrice(sellPrice, 10),
  };
}

/**
 * Calculate the total cost for a bundle (per-unit price × quantity).
 */
export function getBundleTotal(originalPrice: number, quantity: number): number {
  return round2(calculatePrice(originalPrice, quantity) * quantity);
}

/**
 * Return the discount percentage label for a given quantity (e.g. "20% OFF").
 */
export function getDiscountLabel(quantity: number): string {
  const discount = BUNDLE_DISCOUNTS[quantity] ?? BUNDLE_DISCOUNTS[1];
  return `${Math.round(discount * 100)}% OFF`;
}

/**
 * Storefront sell price — equals the database price (no reduction).
 */
export function getStorefrontPrice(
  sellPrice: number,
  _discountEnabled?: boolean,
  _discountPercentage?: number,
): number {
  return round2(sellPrice);
}

/**
 * Savings shown on the product card (list price − sell price).
 */
export function getStorefrontSavings(
  sellPrice: number,
  discountEnabled: boolean,
  discountPercentage: number,
): number {
  if (!discountEnabled) return 0;
  const list = getStorefrontListPrice(sellPrice, discountEnabled, discountPercentage);
  return round2(list - sellPrice);
}

/**
 * Storefront bundle pricing model:
 * Extra Buy 2 / Buy 3 % off the sell price.
 */
export function getStorefrontBundleUnitPrice(
  sellPrice: number,
  _discountEnabled: boolean,
  _discountPercentage: number,
  extraPercentageOff: number,
): number {
  return round2(sellPrice * (1 - extraPercentageOff / 100));
}

export function getStorefrontBundleTotal(
  sellPrice: number,
  quantity: number,
  discountEnabled: boolean,
  discountPercentage: number,
  extraPercentageOff: number,
): number {
  return round2(
    getStorefrontBundleUnitPrice(sellPrice, discountEnabled, discountPercentage, extraPercentageOff) * quantity
  );
}

/**
 * Build a "Buy N" label. Centralised so the format is consistent everywhere.
 */
export function getBundleLabel(quantity: number): string {
  return `Buy ${quantity}`;
}

/**
 * Calculate the per-unit price for a custom percentage-off discount.
 * Used by admin-configured Buy 2 / Buy 3 bundle tiers.
 */
export function getCustomBundlePrice(originalPrice: number, percentageOff: number): number {
  return round2(originalPrice * (1 - percentageOff / 100));
}

/**
 * Calculate the total for a custom percentage bundle (per-unit × quantity).
 */
export function getCustomBundleTotal(originalPrice: number, quantity: number, percentageOff: number): number {
  return round2(getCustomBundlePrice(originalPrice, percentageOff) * quantity);
}

/**
 * Admin / site-settings shape used for cart + PDP bundle math (matches ProductCard).
 */
export type StorefrontDiscountParams = {
  discount_enabled?: boolean;
  discount_percentage?: number;
  buy2_percentage?: number;
  buy3_percentage?: number;
};

/**
 * Per-unit cart price for a line — same stacking as the product page (Buy 1 global %,
 * then extra Buy 2 / Buy 3 % off the already-discounted unit). Qty ≥ 3 uses the Buy 3 extra rate.
 */
export function getCartUnitPrice(
  sellPrice: number,
  quantity: number,
  s: StorefrontDiscountParams,
): number {
  const dEn = s.discount_enabled ?? true;
  const dP = s.discount_percentage ?? 20;
  const b2 = s.buy2_percentage ?? 5;
  const b3 = s.buy3_percentage ?? 10;
  if (quantity <= 0) return 0;
  if (quantity === 1) return getStorefrontPrice(sellPrice, dEn, dP);
  if (quantity === 2) return getStorefrontBundleUnitPrice(sellPrice, dEn, dP, b2);
  return getStorefrontBundleUnitPrice(sellPrice, dEn, dP, b3);
}

/** % off list price per unit — for cart badges (vs struck-through list price). */
export function getListPriceDiscountPercent(listPrice: number, unitPrice: number): number {
  if (!listPrice || listPrice <= 0 || unitPrice > listPrice) return 0;
  return Math.max(0, Math.round((1 - unitPrice / listPrice) * 100));
}

/**
 * Re-apply storefront bundle rules to persisted cart lines (e.g. after loading from API).
 */
export function repriceCartItems<T extends { isFree?: boolean; basePrice?: number; quantity: number; price: number }>(
  items: T[],
  s: StorefrontDiscountParams,
): T[] {
  return items.map((item) => {
    if (item.isFree || item.basePrice == null) return item;
    const price = getCartUnitPrice(item.basePrice, item.quantity, s);
    return { ...item, price };
  });
}
