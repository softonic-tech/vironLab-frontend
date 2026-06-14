/**
 * Centralized points utility.
 * All point calculation logic must go through this file.
 * User balances are never stored — they are always derived from
 * SELECT SUM(points) FROM user_points WHERE user_id = ?.
 */

/** Points awarded automatically when a new account is created (via DB trigger). */
export const SIGNUP_BONUS = 50;

/** Points awarded for placing the very first paid order. */
export const FIRST_ORDER_BONUS = 100;

/** Points awarded per 100 SEK spent (1 pt per 100 kr). */
export const POINTS_PER_100_SEK = 1;

/** @deprecated Use `POINTS_PER_100_SEK`. Kept only for backward compatibility. */
export const POINTS_PER_POUND = POINTS_PER_100_SEK;

/** @deprecated Use `POINTS_PER_100_SEK`. Kept only for backward compatibility. */
export const POINTS_PER_DOLLAR = POINTS_PER_100_SEK;

/**
 * Calculate how many purchase points to award for a given order total.
 * 1 point per 100 kr spent, rounded down.
 */
export function calculatePurchasePoints(orderTotal: number): number {
  return Math.floor(orderTotal / 100 * POINTS_PER_100_SEK);
}

/** Supported point event types. */
export type PointType =
  | 'signup'
  | 'first_order'
  | 'purchase'
  | 'referral'
  | 'admin_adjustment'
  | 'redeemed'
  | 'revoked';

/** Human-readable label for each point type. */
export const POINT_TYPE_LABELS: Record<PointType, string> = {
  signup:           'Signup Bonus',
  first_order:      'First Order Bonus',
  purchase:         'Purchase Points',
  referral:         'Referral Bonus',
  admin_adjustment: 'Admin Adjustment',
  redeemed:         'Points Redeemed',
  revoked:          'Points Removed',
};
