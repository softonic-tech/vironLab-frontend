import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { SIGNUP_BONUS, FIRST_ORDER_BONUS, calculatePurchasePoints } from '@/utils/points';
import type { PointType } from '@/utils/points';

// Points/rewards are disabled. These exports remain so existing imports compile.
export { SIGNUP_BONUS, FIRST_ORDER_BONUS, calculatePurchasePoints };

export const POINTS_DISABLED = true;

export const REDEMPTION_TIERS = [
  { points: 100, value: 5, label: '5 kr off' },
  { points: 200, value: 10, label: '10 kr off' },
  { points: 500, value: 30, label: '30 kr off' },
  { points: 1000, value: 70, label: '70 kr off' },
];

export const BONUS_POINTS = {
  ACCOUNT_CREATION: SIGNUP_BONUS,
  FIRST_PURCHASE: FIRST_ORDER_BONUS,
  REFERRAL: 100,
};

export const POINTS_EXPIRY_MONTHS = 12;

export const REDEMPTION_REQUIREMENTS = {
  MIN_LIFETIME_SPEND: 150,
  MIN_ORDER_SUBTOTAL: 150,
};

export interface PointsTransaction {
  id: string;
  type: PointType;
  points: number;
  description: string;
  date: string;
  orderId?: string | null;
}

export interface Referral {
  id: string;
  email: string;
  status: 'pending' | 'completed';
  date: string;
  pointsEarned: number;
}

interface RewardsContextType {
  balance: number;
  lifetimePoints: number;
  lifetimeSpend: number;
  transactions: PointsTransaction[];
  referrals: Referral[];
  earnPoints: (amount: number, description: string, orderId?: string) => Promise<void>;
  redeemPoints: (
    points: number,
    description: string,
    orderSubtotal: number
  ) => Promise<{ success: boolean; error?: string }>;
  addBonusPoints: (type: 'account_creation' | 'first_purchase', description: string) => Promise<void>;
  createReferral: (email: string, referrerEmail?: string) => { success: boolean; error?: string };
  completeReferral: (referralId: string) => Promise<void>;
  getAvailableRedemptions: (orderSubtotal: number) => typeof REDEMPTION_TIERS;
  canRedeemPoints: (orderSubtotal: number) => { canRedeem: boolean; reason?: string };
  getPointsValue: (points: number) => number;
  isLoading: boolean;
  refreshPoints: (overrideUserId?: string) => Promise<void>;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export function RewardsProvider({ children }: { children: React.ReactNode }) {
  const noopAsync = useCallback(async () => {}, []);

  const value = useMemo<RewardsContextType>(
    () => ({
      balance: 0,
      lifetimePoints: 0,
      lifetimeSpend: 0,
      transactions: [],
      referrals: [],
      earnPoints: noopAsync,
      redeemPoints: async () => ({
        success: false,
        error: 'Rewards points are currently disabled.',
      }),
      addBonusPoints: noopAsync,
      createReferral: () => ({ success: false, error: 'Rewards referrals are currently disabled.' }),
      completeReferral: noopAsync,
      getAvailableRedemptions: () => [],
      canRedeemPoints: () => ({ canRedeem: false, reason: 'Rewards points are currently disabled.' }),
      getPointsValue: () => 0,
      isLoading: false,
      refreshPoints: noopAsync,
    }),
    [noopAsync]
  );

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards() {
  const context = useContext(RewardsContext);
  if (context === undefined) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
}
