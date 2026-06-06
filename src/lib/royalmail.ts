const FREE_SHIPPING_THRESHOLD_SEK = 2500;

// Royal Mail shipping helpers (UK)
// Live Royal Mail / parcel-rate APIs are stubbed out; the frontend uses
// DEFAULT_SHIPPING_RATES until an integration is wired up.

// const ROYAL_MAIL_API_KEY = import.meta.env.VITE_ROYAL_MAIL_API_KEY ?? '';
// const ROYAL_MAIL_BASE_URL = 'https://api.royalmail.net';

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

// Default shipping rate (fallback if API fails).
// Prices in SEK.
export const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Reliable tracked delivery',
    price: 149,
    estimatedDays: '5-8 business days',
  },
];

/**
 * Calculate shipping options for a destination postcode / weight.
 * Currently returns DEFAULT_SHIPPING_RATES; swap in a real Royal Mail
 * or courier rate lookup when ready.
 */
export const calculateShipping = async (
  _toPostcode: string,
  _weightInGrams: number = 500
): Promise<ShippingRate[]> => {
  try {
    return DEFAULT_SHIPPING_RATES;
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return DEFAULT_SHIPPING_RATES;
  }
};

/**
 * Validate a UK postcode (format only — does not confirm deliverability).
 * Accepts the standard GOV.UK pattern with an optional space between
 * the outward and inward codes, e.g. "SW1A 1AA", "M1 1AE", "B33 8TH".
 */
export const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export const validatePostcode = async (postcode: string): Promise<boolean> => {
  try {
    if (!postcode) return false;
    return UK_POSTCODE_REGEX.test(postcode.trim());
  } catch (error) {
    console.error('Error validating postcode:', error);
    return false;
  }
};

/** Town / city autocomplete — stub for now. */
export const searchTowns = async (query: string): Promise<string[]> => {
  try {
    if (query.length < 3) return [];
    return [];
  } catch (error) {
    console.error('Error searching towns:', error);
    return [];
  }
};

/** @deprecated Alias kept so older imports don't break. */
export const searchSuburbs = searchTowns;

export const qualifiesForFreeShipping = (subtotal: number): boolean => {
  return subtotal >= FREE_SHIPPING_THRESHOLD_SEK;
};

export const getShippingCost = (
  subtotal: number,
  selectedRate: ShippingRate
): number => {
  if (qualifiesForFreeShipping(subtotal)) {
    return 0;
  }
  return selectedRate.price;
};
