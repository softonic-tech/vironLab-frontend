export type AppLanguage = 'sv' | 'en';

export type TranslationValue = string | TranslationDict;
export type TranslationDict = { [key: string]: TranslationValue };

export const DEFAULT_LANGUAGE: AppLanguage = 'sv';
export const STORAGE_KEY = 'vironlabs_language';
