import React, { createContext, useContext, useMemo } from 'react';
import { formatSek } from '@/utils/pricing';

export type AppCurrency = 'sek';

interface CurrencyContextType {
  currency: AppCurrency;
  rate: number;
  symbol: string;
  format: (amountSek: number) => string;
  convert: (amountSek: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<CurrencyContextType>(() => {
    const convert = (amountSek: number) => Math.round(Number(amountSek) * 100) / 100;
    const format = (amountSek: number) => formatSek(amountSek);
    return { currency: 'sek', rate: 1, symbol: 'kr ', convert, format };
  }, []);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
