import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppCurrency = 'sek' | 'gbp' | 'eur' | 'usd';

interface CurrencyContextType {
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  rate: number;
  symbol: string;
  format: (amountSek: number) => string;
  convert: (amountSek: number) => number;
}

const STORAGE_KEY = 'vironlabs_currency';
const GBP_RATE = 0.075;
const EUR_RATE = 0.10;
const USD_RATE = 0.094;

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<AppCurrency>('sek');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'sek' || saved === 'gbp' || saved === 'eur' || saved === 'usd') setCurrencyState(saved);
    } catch {
      // noop
    }
  }, []);

  const setCurrency = (next: AppCurrency) => {
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // noop
    }
  };

  const value = useMemo<CurrencyContextType>(() => {
    const rate =
      currency === 'gbp' ? GBP_RATE : currency === 'eur' ? EUR_RATE : currency === 'usd' ? USD_RATE : 1;
    const symbol =
      currency === 'gbp' ? '£' : currency === 'eur' ? '€' : currency === 'usd' ? '$' : 'kr ';
    const convert = (amountSek: number) => Math.round(Number(amountSek) * rate * 100) / 100;
    const format = (amountSek: number) =>
      currency === 'sek' ? `${convert(amountSek).toFixed(2)} kr` : `${symbol}${convert(amountSek).toFixed(2)}`;
    return { currency, setCurrency, rate, symbol, convert, format };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

