/** Checkout and fulfilment are limited to Sweden. */
export const CHECKOUT_COUNTRY = 'Sweden';

const SWEDEN_ALIASES = new Set(['sweden', 'sverige', 'se']);

export function isSwedenShippingRegion(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const n = value.trim().toLowerCase();
  return n === CHECKOUT_COUNTRY.toLowerCase() || SWEDEN_ALIASES.has(n);
}
