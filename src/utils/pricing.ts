/**
 * Centralized pricing utility.
 * All bundle discount calculations must go through this file.
 * Never store computed prices in the database — only originalPrice is persisted.
 */

/** Discount percentage (as a decimal) for each supported bundle quantity. */
export const BUNDLE_DISCOUNTS: Record<number, number> = {
  1: 0.20,  // Buy 1 → 20% off
  2: 0.25,  // Buy 2 → 25% off
  3: 0.30,  // Buy 3 → 30% off
  5: 0.36,  // Buy 5 → 36% off
  10: 0.44, // Buy 10 → 44% off
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calculate the per-unit discounted price for a given quantity.
 * Falls back to the single-unit discount for unsupported quantities.
 */
export function calculatePrice(originalPrice: number, quantity: number): number {
  const discount = BUNDLE_DISCOUNTS[quantity] ?? BUNDLE_DISCOUNTS[1];
  return round2(originalPrice * (1 - discount));
}

export interface BundlePrices {
  buy1: number;
  buy2: number;
  buy3: number;
  buy5: number;
  buy10: number;
}

/**
 * Return per-unit prices for all supported bundle tiers.
 */
export function getBundlePricing(originalPrice: number): BundlePrices {
  return {
    buy1:  calculatePrice(originalPrice, 1),
    buy2:  calculatePrice(originalPrice, 2),
    buy3:  calculatePrice(originalPrice, 3),
    buy5:  calculatePrice(originalPrice, 5),
    buy10: calculatePrice(originalPrice, 10),
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
 * Calculate the storefront display price using the admin-configured global discount.
 * If discount is disabled, returns the original price unchanged.
 */
export function getStorefrontPrice(
  originalPrice: number,
  discountEnabled: boolean,
  discountPercentage: number,
): number {
  if (!discountEnabled) return originalPrice;
  return round2(originalPrice * (1 - discountPercentage / 100));
}

/**
 * Calculate the savings amount for storefront display.
 * Returns 0 if discount is disabled.
 */
export function getStorefrontSavings(
  originalPrice: number,
  discountEnabled: boolean,
  discountPercentage: number,
): number {
  if (!discountEnabled) return 0;
  return round2(originalPrice * (discountPercentage / 100));
}

/**
 * Storefront bundle pricing model:
 * 1) apply the global storefront discount (Buy 1)
 * 2) apply an additional "extra" discount for Buy 2 / Buy 3
 *
 * Example:
 * - Buy1 = 20% off original → 880 kr
 * - Buy2 total = (880 kr × 2) - extra 5%
 * - Buy3 total = (880 kr × 3) - extra 10%
 */
export function getStorefrontBundleUnitPrice(
  originalPrice: number,
  discountEnabled: boolean,
  discountPercentage: number,
  extraPercentageOff: number,
): number {
  const buy1Unit = getStorefrontPrice(originalPrice, discountEnabled, discountPercentage);
  return round2(buy1Unit * (1 - extraPercentageOff / 100));
}

export function getStorefrontBundleTotal(
  originalPrice: number,
  quantity: number,
  discountEnabled: boolean,
  discountPercentage: number,
  extraPercentageOff: number,
): number {
  return round2(
    getStorefrontBundleUnitPrice(originalPrice, discountEnabled, discountPercentage, extraPercentageOff) * quantity
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
  originalPrice: number,
  quantity: number,
  s: StorefrontDiscountParams,
): number {
  const dEn = s.discount_enabled ?? true;
  const dP = s.discount_percentage ?? 20;
  const b2 = s.buy2_percentage ?? 5;
  const b3 = s.buy3_percentage ?? 10;
  if (quantity <= 0) return 0;
  if (quantity === 1) return getStorefrontPrice(originalPrice, dEn, dP);
  if (quantity === 2) return getStorefrontBundleUnitPrice(originalPrice, dEn, dP, b2);
  return getStorefrontBundleUnitPrice(originalPrice, dEn, dP, b3);
}

/** % off list price per unit — for cart badges (vs struck-through list price). */
export function getListPriceDiscountPercent(originalPrice: number, unitPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || unitPrice > originalPrice) return 0;
  return Math.max(0, Math.round((1 - unitPrice / originalPrice) * 100));
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
