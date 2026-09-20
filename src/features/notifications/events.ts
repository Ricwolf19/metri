import type { TranslationKey } from '@/i18n/en';

/**
 * The fixed catalogue of app-scheduled notification events. Feature-owned: the
 * user toggles each one, and that is usually the whole decision — shipping a
 * new feature adds its event HERE and the settings screen picks it up.
 *
 * Times are metri's call, not a setting: a reminder the app can place well
 * (training follows the program, the check-in lands at midday) is one less
 * thing to configure, and one less way to end up with a useless schedule.
 *
 * `weekdays` uses expo-notifications numbering: 1 = Sunday … 7 = Saturday.
 */
type NotificationEventId =
  'daily-checkin' | 'training-time' | 'metri-tips' | 'weigh-in' | 'calories';

/**
 * What the settings card offers beyond on/off:
 * - `toggle`    — nothing; the time ships with the event.
 * - `program`   — derived from the enrolled program's schedule.
 * - `frequency` — how many times a day it fires.
 */
type EventTuning = 'toggle' | 'program' | 'frequency';

export type EventConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Days it fires; all 7 = daily. */
  weekdays: number[];
  /** Program-driven events: one explicit (weekday, time) per scheduled split.
   * When present it replaces `hour`/`minute` × `weekdays`. */
  schedule?: { weekday: number; hour: number; minute: number }[];
  /** `frequency` events only: how many times a day they fire. */
  timesPerDay?: number;
};

export type NotificationEvent = {
  id: NotificationEventId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  notifTitleKey: TranslationKey;
  notifBodyKey: TranslationKey;
  tuning: EventTuning;
  defaults: EventConfig;
};

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    id: 'training-time',
    titleKey: 'notifEvent.trainingTitle',
    descKey: 'notifEvent.trainingDesc',
    notifTitleKey: 'notif.trainingTitle',
    notifBodyKey: 'notif.trainingBody',
    tuning: 'program',
    // Time and days come from the enrolled program; the defaults only matter
    // until `syncTrainingReminder` writes the real schedule.
    defaults: { enabled: false, hour: 18, minute: 0, weekdays: [] },
  },
  {
    id: 'daily-checkin',
    titleKey: 'notifEvent.checkinTitle',
    descKey: 'notifEvent.checkinDesc',
    notifTitleKey: 'notif.dailyTitle',
    notifBodyKey: 'notif.dailyBody',
    tuning: 'toggle',
    // Midday: late enough to have trained, early enough to still fix the day.
    defaults: { enabled: true, hour: 12, minute: 0, weekdays: ALL_DAYS },
  },
  {
    id: 'metri-tips',
    titleKey: 'notifEvent.tipsTitle',
    descKey: 'notifEvent.tipsDesc',
    // Copy comes from the rotating pool in `tips.ts`, not from these keys;
    // they stay as the fallback the scheduler never normally reaches.
    notifTitleKey: 'notifEvent.tipsTitle',
    notifBodyKey: 'notifEvent.tipsDesc',
    tuning: 'frequency',
    // Off by default: three notifications a day is a choice, not a default.
    defaults: { enabled: false, hour: 9, minute: 0, weekdays: ALL_DAYS, timesPerDay: 3 },
  },
  {
    id: 'weigh-in',
    titleKey: 'notifEvent.weighTitle',
    descKey: 'notifEvent.weighDesc',
    notifTitleKey: 'notif.weighTitle',
    notifBodyKey: 'notif.weighBody',
    tuning: 'toggle',
    // Sunday morning: same conditions every week.
    defaults: { enabled: false, hour: 9, minute: 0, weekdays: [1] },
  },
  {
    id: 'calories',
    titleKey: 'notifEvent.caloriesTitle',
    descKey: 'notifEvent.caloriesDesc',
    notifTitleKey: 'notif.caloriesTitle',
    notifBodyKey: 'notif.caloriesBody',
    tuning: 'toggle',
    defaults: { enabled: false, hour: 13, minute: 0, weekdays: ALL_DAYS },
  },
];
