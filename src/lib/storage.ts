import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV — fast, synchronous key-value storage.
 *
 * Used for small values that must be read instantly without a flash on launch
 * (theme, units, onboarding flags, "last weight" cache). It does NOT replace
 * SQLite, which remains the relational source of truth. Requires a development
 * build; MMKV does not work in Expo Go.
 */
export const storage = createMMKV({ id: 'metri' });

export type Units = 'kg' | 'lb';
export type LocaleCode = 'en' | 'es';

const Keys = {
  units: 'settings.units',
  locale: 'settings.locale',
  onboarded: 'settings.onboarded',
  sessionUserId: 'auth.userId',
} as const;

export const settings = {
  getUnits(): Units {
    return (storage.getString(Keys.units) as Units) ?? 'kg';
  },
  setUnits(units: Units) {
    storage.set(Keys.units, units);
  },
  getLocale(): LocaleCode {
    return (storage.getString(Keys.locale) as LocaleCode) ?? 'en';
  },
  setLocale(locale: LocaleCode) {
    storage.set(Keys.locale, locale);
  },
  hasOnboarded(): boolean {
    return storage.getBoolean(Keys.onboarded) ?? false;
  },
  setOnboarded(value: boolean) {
    storage.set(Keys.onboarded, value);
  },
};

/**
 * Auth session — the id of the signed-in user. Stored in MMKV so the app can
 * resolve "am I logged in?" synchronously on launch, with no spinner flash.
 */
export const session = {
  getUserId(): string | null {
    return storage.getString(Keys.sessionUserId) ?? null;
  },
  setUserId(id: string) {
    storage.set(Keys.sessionUserId, id);
  },
  clear() {
    storage.remove(Keys.sessionUserId);
  },
};
