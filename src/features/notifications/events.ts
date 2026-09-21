import type { TranslationKey } from '@/i18n/en';

/**
 * The fixed catalogue of app-scheduled notification events. Feature-owned: the
 * user tunes each one, and shipping a new feature adds its event HERE — the
 * settings screen picks it up and sections it by `group`.
 */
type NotificationEventId =
  'training-time' | 'session-checkin' | 'metri-tips' | 'weigh-in' | 'calories';

/**
 * Ids that shipped in an earlier build and no longer exist. Their OS
 * notifications outlive the catalogue entry, so the reconciler still has to
 * cancel them — otherwise a retired reminder fires forever.
 */
export const RETIRED_EVENT_IDS = ['daily-checkin'] as const;

/**
 * What the settings card offers beyond on/off:
 * - `program`   — derived from the enrolled program's schedule; nothing to set.
 * - `offset`    — program-derived, plus how long after the session it lands.
 * - `frequency` — how many times a day it fires, and when each one lands.
 * - `time`      — a single time of day.
 */
type EventTuning = 'program' | 'offset' | 'frequency' | 'time';

/** Section of the settings screen: what the notification IS, not what it does. */
export type EventGroup = 'events' | 'knowledge' | 'reminders';

export type EventConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Days it fires, expo-numbered (1 = Sun … 7 = Sat); all 7 = daily. */
  weekdays: number[];
  /** Program-driven events: one explicit (weekday, time) per scheduled split.
   * When present it replaces `hour`/`minute` × `weekdays`. */
  schedule?: { weekday: number; hour: number; minute: number }[];
  /** `offset` events only: minutes after the session start that it lands. */
  offsetMinutes?: number;
  /** `frequency` events only: how many times a day they fire. */
  timesPerDay?: number;
  /** `frequency` events only: when each of those fires — one entry per time. */
  slots?: { hour: number; minute: number }[];
};

export type NotificationEvent = {
  id: NotificationEventId;
  group: EventGroup;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  notifTitleKey: TranslationKey;
  notifBodyKey: TranslationKey;
  tuning: EventTuning;
  defaults: EventConfig;
};

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
/** Long enough to cover the session and the shower, early enough to still recall it. */
export const DEFAULT_CHECKIN_OFFSET_MIN = 180;
export const CHECKIN_OFFSET_RANGE = { min: 60, max: 360, step: 60 };

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    id: 'training-time',
    group: 'events',
    titleKey: 'notifEvent.trainingTitle',
    descKey: 'notifEvent.trainingDesc',
    notifTitleKey: 'notif.trainingTitle',
    notifBodyKey: 'notif.trainingBody',
    tuning: 'program',
    // Time and days come from the enrolled program; the defaults only matter
    // until `syncTrainingReminder` writes the real schedule.
    defaults: { enabled: true, hour: 18, minute: 0, weekdays: [] },
  },
  {
    id: 'session-checkin',
    group: 'events',
    titleKey: 'notifEvent.checkinTitle',
    descKey: 'notifEvent.checkinDesc',
    notifTitleKey: 'notif.checkinTitle',
    notifBodyKey: 'notif.checkinBody',
    tuning: 'offset',
    // Rides the training schedule rather than a fixed hour: a day is only worth
    // asking about once the session it was planned for has been and gone.
    defaults: {
      enabled: true,
      hour: 21,
      minute: 0,
      weekdays: [],
      offsetMinutes: DEFAULT_CHECKIN_OFFSET_MIN,
    },
  },
  {
    id: 'metri-tips',
    group: 'knowledge',
    titleKey: 'notifEvent.tipsTitle',
    descKey: 'notifEvent.tipsDesc',
    // Copy comes from the rotating pool in `tips.ts`, not from these keys;
    // they stay as the fallback the scheduler never normally reaches.
    notifTitleKey: 'notifEvent.tipsTitle',
    notifBodyKey: 'notifEvent.tipsDesc',
    tuning: 'frequency',
    defaults: { enabled: true, hour: 10, minute: 0, weekdays: ALL_DAYS, timesPerDay: 2 },
  },
  {
    id: 'weigh-in',
    group: 'reminders',
    titleKey: 'notifEvent.weighTitle',
    descKey: 'notifEvent.weighDesc',
    notifTitleKey: 'notif.weighTitle',
    notifBodyKey: 'notif.weighBody',
    tuning: 'time',
    // Sunday morning: same conditions every week.
    defaults: { enabled: true, hour: 9, minute: 0, weekdays: [1] },
  },
  {
    id: 'calories',
    group: 'reminders',
    titleKey: 'notifEvent.caloriesTitle',
    descKey: 'notifEvent.caloriesDesc',
    notifTitleKey: 'notif.caloriesTitle',
    notifBodyKey: 'notif.caloriesBody',
    tuning: 'time',
    defaults: { enabled: true, hour: 13, minute: 0, weekdays: ALL_DAYS },
  },
];

/** Render order of the settings sections. */
export const EVENT_GROUPS: { group: EventGroup; labelKey: TranslationKey }[] = [
  { group: 'events', labelKey: 'notifGroup.events' },
  { group: 'knowledge', labelKey: 'notifGroup.knowledge' },
  { group: 'reminders', labelKey: 'notifGroup.reminders' },
];
