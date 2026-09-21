import { createMMKV } from 'react-native-mmkv';

import { parseJson, parseJsonArray } from './safe-json';

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
/** Two session views: a scrolling list, or one exercise at a time. */
export type WorkoutLayout = 'list' | 'cards';
export type ClockFormat = '24' | '12';

export const SettingKeys = {
  units: 'settings.units',
  locale: 'settings.locale',
  theme: 'settings.theme',
  clock: 'settings.clock',
  // Read reactively through `useDateFormat`.
  dateFormat: 'settings.dateFormat',
  pinnedActions: 'settings.pinnedActions',
  // Optional tape sites the user switched on (see features/body/sites).
  proSites: 'body.proSites',
  onboarded: 'settings.onboarded',
  premiumIntroSeen: 'settings.premiumIntroSeen',
  dismissedAnnouncements: 'announcements.dismissed',
  notificationsEnabled: 'settings.notificationsEnabled',
  localBannerSnoozedUntil: 'settings.localBannerSnoozedUntil',
  workoutLayout: 'settings.workoutLayout',
  weightStep: 'settings.weightStep',
  repsStep: 'settings.repsStep',
  // Section order + hidden sections on the Metrics tab (see features/metrics).
  metricsLayout: 'metrics.layout',
  showExerciseArt: 'settings.showExerciseArt',
  widgetPromoSnoozedUntil: 'widget.promoSnoozedUntil',
  docsPromoSnoozedUntil: 'docs.promoSnoozedUntil',
  sessionUserId: 'auth.userId',
  // One-shot: seed body_metrics from progress-photo weights (see body-metrics.repo).
  bodyMetricsBackfilled: 'body.metricsBackfilled',
  // In-flight rest timer (see features/training/rest-state).
  activeRest: 'training.activeRest',
} as const;

/** Typed accessors for every `SettingKeys` entry — screens never touch `storage` directly. */
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
  hasBackfilledBodyMetrics(): boolean {
    return storage.getBoolean(SettingKeys.bodyMetricsBackfilled) ?? false;
  },
  markBodyMetricsBackfilled() {
    storage.set(SettingKeys.bodyMetricsBackfilled, true);
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
  // "Read the guides" banner snooze deadline (epoch ms).
  getDocsPromoSnoozedUntil(): number {
    return storage.getNumber(SettingKeys.docsPromoSnoozedUntil) ?? 0;
  },
  snoozeDocsPromo(days = 30) {
    storage.set(SettingKeys.docsPromoSnoozedUntil, Date.now() + days * 86_400_000);
  },
  /** Whether the movement illustrations render during a session. */
  getShowExerciseArt(): boolean {
    return storage.getBoolean(SettingKeys.showExerciseArt) ?? true;
  },
  setShowExerciseArt(value: boolean) {
    storage.set(SettingKeys.showExerciseArt, value);
  },
  /** Plate jump and rep jump the ± buttons apply; a lifter's does not change per set. */
  getWeightStep(): number {
    return storage.getNumber(SettingKeys.weightStep) ?? 5;
  },
  setWeightStep(value: number) {
    storage.set(SettingKeys.weightStep, value);
  },
  getRepsStep(): number {
    return storage.getNumber(SettingKeys.repsStep) ?? 1;
  },
  setRepsStep(value: number) {
    storage.set(SettingKeys.repsStep, value);
  },
  getWorkoutLayout(): WorkoutLayout {
    return (storage.getString(SettingKeys.workoutLayout) as WorkoutLayout) ?? 'list';
  },
  setWorkoutLayout(layout: WorkoutLayout) {
    storage.set(SettingKeys.workoutLayout, layout);
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
  getEnabledProSites(): string[] {
    return parseJsonArray<string>(storage.getString(SettingKeys.proSites), []);
  },
  setEnabledProSites(ids: string[]) {
    storage.set(SettingKeys.proSites, JSON.stringify(ids));
  },
  hasOnboarded(): boolean {
    return storage.getBoolean(SettingKeys.onboarded) ?? false;
  },
  setOnboarded(value: boolean) {
    storage.set(SettingKeys.onboarded, value);
  },
  hasSeenPremiumIntro(): boolean {
    return storage.getBoolean(SettingKeys.premiumIntroSeen) ?? false;
  },
  setPremiumIntroSeen(value: boolean) {
    storage.set(SettingKeys.premiumIntroSeen, value);
  },
  /** Announcement ids the user dismissed (see features/announcements). */
  getDismissedAnnouncements(): string[] {
    return parseJsonArray<string>(storage.getString(SettingKeys.dismissedAnnouncements), []);
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
    const stored = parseJson<Partial<T> | null>(
      storage.getString(`notifications.event.${eventId}`),
      null,
    );
    return stored ? { ...defaults, ...stored } : defaults;
  },
  setEventConfig(eventId: string, config: unknown) {
    storage.set(`notifications.event.${eventId}`, JSON.stringify(config));
  },
  /** OS notification ids scheduled for an event (cancel-then-reschedule). */
  getEventIds(eventId: string): string[] {
    return parseJsonArray<string>(storage.getString(`notifications.ids.${eventId}`), []);
  },
  /** Forget a retired event entirely — its config and its scheduled ids. */
  clearEvent(eventId: string) {
    storage.remove(`notifications.event.${eventId}`);
    storage.remove(`notifications.ids.${eventId}`);
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
