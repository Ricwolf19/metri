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
export type ThemePreference = 'system' | 'light' | 'dark';
/** How times are displayed across the app: 24-hour or 12-hour with AM/PM. */
export type ClockFormat = '24' | '12';

const Keys = {
  units: 'settings.units',
  locale: 'settings.locale',
  theme: 'settings.theme',
  clock: 'settings.clock',
  pinnedActions: 'settings.pinnedActions',
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
  /** The user's saved locale, or null if they've never chosen one (use device default). */
  getLocale(): LocaleCode | null {
    return (storage.getString(Keys.locale) as LocaleCode) ?? null;
  },
  setLocale(locale: LocaleCode) {
    storage.set(Keys.locale, locale);
  },
  getThemePreference(): ThemePreference {
    return (storage.getString(Keys.theme) as ThemePreference) ?? 'dark';
  },
  setThemePreference(theme: ThemePreference) {
    storage.set(Keys.theme, theme);
  },
  getClockFormat(): ClockFormat {
    return (storage.getString(Keys.clock) as ClockFormat) ?? '24';
  },
  setClockFormat(clock: ClockFormat) {
    storage.set(Keys.clock, clock);
  },
  /** Ids of the quick actions pinned to Home, or null if never customized. */
  getPinnedActions(): string[] | null {
    const raw = storage.getString(Keys.pinnedActions);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  },
  setPinnedActions(ids: string[]) {
    storage.set(Keys.pinnedActions, JSON.stringify(ids));
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
