import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from '@/i18n/locales/en';
import { sv } from '@/i18n/locales/sv';
import { createTranslator } from '@/i18n/translate';
import type { AppLanguage, TranslationDict } from '@/i18n/types';
import { DEFAULT_LANGUAGE, STORAGE_KEY } from '@/i18n/types';

const dictionaries = { sv, en } as const;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'sv' || saved === 'en') return saved;
  } catch {
    // noop
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'sv' ? 'sv' : 'en';
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[language];
    return {
      language,
      setLanguage,
      t: createTranslator(dict as unknown as TranslationDict),
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
}
