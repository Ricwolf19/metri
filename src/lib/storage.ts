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

export const SettingKeys = {
  units: 'settings.units',
  locale: 'settings.locale',
  theme: 'settings.theme',
  clock: 'settings.clock',
  // Read reactively through `useDateFormat`.
  dateFormat: 'settings.dateFormat',
  pinnedActions: 'settings.pinnedActions',
  onboarded: 'settings.onboarded',
  premiumIntroSeen: 'settings.premiumIntroSeen',
  dismissedAnnouncements: 'announcements.dismissed',
  notificationsEnabled: 'settings.notificationsEnabled',
  localBannerSnoozedUntil: 'settings.localBannerSnoozedUntil',
  widgetPromoSnoozedUntil: 'widget.promoSnoozedUntil',
  sessionUserId: 'auth.userId',
} as const;

export const settings = {
  getUnits(): Units {
    return (storage.getString(SettingKeys.units) as Units) ?? 'kg';
  },
  setUnits(units: Units) {
    storage.set(SettingKeys.units, units);
  },
  /** The user's saved locale, or null if they've never chosen one (use device default). */
  getLocale(): LocaleCode | null {
    return (storage.getString(SettingKeys.locale) as LocaleCode) ?? null;
  },
  setLocale(locale: LocaleCode) {
    storage.set(SettingKeys.locale, locale);
  },
  getThemePreference(): ThemePreference {
    return (storage.getString(SettingKeys.theme) as ThemePreference) ?? 'dark';
  },
  setThemePreference(theme: ThemePreference) {
    storage.set(SettingKeys.theme, theme);
  },
  // Local-mode banner snooze deadline (epoch ms).
  getLocalBannerSnoozedUntil(): number {
    return storage.getNumber(SettingKeys.localBannerSnoozedUntil) ?? 0;
  },
  snoozeLocalBanner(days = 14) {
    storage.set(SettingKeys.localBannerSnoozedUntil, Date.now() + days * 86_400_000);
  },
  // Home widget promo snooze deadline (epoch ms).
  getWidgetPromoSnoozedUntil(): number {
    return storage.getNumber(SettingKeys.widgetPromoSnoozedUntil) ?? 0;
  },
  snoozeWidgetPromo(days = 14) {
    storage.set(SettingKeys.widgetPromoSnoozedUntil, Date.now() + days * 86_400_000);
  },
  getClockFormat(): ClockFormat {
    return (storage.getString(SettingKeys.clock) as ClockFormat) ?? '24';
  },
  setClockFormat(clock: ClockFormat) {
    storage.set(SettingKeys.clock, clock);
  },
  /** Ids of the quick actions pinned to Home, or null if never customized. */
  getPinnedActions(): string[] | null {
    const raw = storage.getString(SettingKeys.pinnedActions);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  },
  setPinnedActions(ids: string[]) {
    storage.set(SettingKeys.pinnedActions, JSON.stringify(ids));
  },
  hasOnboarded(): boolean {
    return storage.getBoolean(SettingKeys.onboarded) ?? false;
  },
  setOnboarded(value: boolean) {
    storage.set(SettingKeys.onboarded, value);
  },
  /** Whether the one-time premium/data intro has been shown. */
  hasSeenPremiumIntro(): boolean {
    return storage.getBoolean(SettingKeys.premiumIntroSeen) ?? false;
  },
  setPremiumIntroSeen(value: boolean) {
    storage.set(SettingKeys.premiumIntroSeen, value);
  },
  /** Announcement ids the user dismissed (see features/announcements). */
  getDismissedAnnouncements(): string[] {
    const raw = storage.getString(SettingKeys.dismissedAnnouncements);
    return raw ? (JSON.parse(raw) as string[]) : [];
  },
  addDismissedAnnouncement(id: string) {
    const seen = new Set(settings.getDismissedAnnouncements());
    seen.add(id);
    storage.set(SettingKeys.dismissedAnnouncements, JSON.stringify([...seen]));
  },
  /** Master switch for app-scheduled notifications (reminders). Default on;
   * the OS permission is still requested lazily the first time it matters. */
  getNotificationsEnabled(): boolean {
    return storage.getBoolean(SettingKeys.notificationsEnabled) ?? true;
  },
  setNotificationsEnabled(value: boolean) {
    storage.set(SettingKeys.notificationsEnabled, value);
  },
  /** Per-event notification config (see features/notifications/events). */
  getEventConfig<T>(eventId: string, defaults: T): T {
    const raw = storage.getString(`notifications.event.${eventId}`);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<T>) } : defaults;
  },
  setEventConfig(eventId: string, config: unknown) {
    storage.set(`notifications.event.${eventId}`, JSON.stringify(config));
  },
  /** OS notification ids scheduled for an event (cancel-then-reschedule). */
  getEventIds(eventId: string): string[] {
    const raw = storage.getString(`notifications.ids.${eventId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  },
  setEventIds(eventId: string, ids: string[]) {
    storage.set(`notifications.ids.${eventId}`, JSON.stringify(ids));
  },
};

/**
 * Auth session — the id of the signed-in user. Stored in MMKV so the app can
 * resolve "am I logged in?" synchronously on launch, with no spinner flash.
 */
export const session = {
  getUserId(): string | null {
    return storage.getString(SettingKeys.sessionUserId) ?? null;
  },
  setUserId(id: string) {
    storage.set(SettingKeys.sessionUserId, id);
  },
  clear() {
    storage.remove(SettingKeys.sessionUserId);
  },
};
