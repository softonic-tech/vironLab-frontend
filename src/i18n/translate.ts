import type { TranslationDict } from './types';

function getNestedValue(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split('.');
  let current: TranslationDict | string | undefined = dict;
  for (const part of parts) {
    if (current == null || typeof current === 'string') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = vars[name];
    return value == null ? '' : String(value);
  });
}

export function createTranslator(dict: TranslationDict) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const raw = getNestedValue(dict, key);
    if (raw == null) return key;
    return interpolate(raw, vars);
  };
}
