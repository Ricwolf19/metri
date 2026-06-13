import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { settings } from '@/lib/storage';

import { en, type TranslationKey } from './en';
import { es } from './es';

export type Locale = 'en' | 'es';

/** Spanish if the device's primary language is Spanish, otherwise English. */
const deviceLocale = (): Locale => {
  try {
    return getLocales()[0]?.languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

export const LOCALES: { value: Locale; key: TranslationKey }[] = [
  { value: 'en', key: 'lang.en' },
  { value: 'es', key: 'lang.es' },
];

const DICTS: Record<Locale, Record<TranslationKey, string>> = { en, es };

export type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const interpolate = (template: string, vars?: Record<string, string | number>): string => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  // Saved choice wins; otherwise default to the device language (first launch).
  const [locale, setLocaleState] = useState<Locale>(() => settings.getLocale() ?? deviceLocale());

  const setLocale = useCallback((next: Locale) => {
    settings.setLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback<TFunction>(
    (key, vars) => interpolate(DICTS[locale][key] ?? en[key] ?? key, vars),
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>.');
  return ctx;
};

/** Convenience hook when a component only needs the translate function. */
export const useT = (): TFunction => useI18n().t;
