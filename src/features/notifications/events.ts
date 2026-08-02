import type { TranslationKey } from '@/i18n/en';

/**
 * The fixed catalogue of app-scheduled notification events. Feature-owned: the
 * user can toggle each one and tune when it fires (hour + weekdays), but never
 * add or remove entries — shipping a new feature adds its event HERE, and the
 * settings screen picks it up automatically.
 *
 * `weekdays` uses expo-notifications numbering: 1 = Sunday … 7 = Saturday.
 */
type NotificationEventId = 'daily-checkin' | 'training-time' | 'weigh-in' | 'calories';

export type EventConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Days it fires; all 7 = daily. */
  weekdays: number[];
};

export type NotificationEvent = {
  id: NotificationEventId;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  notifTitleKey: TranslationKey;
  notifBodyKey: TranslationKey;
  defaults: EventConfig;
};

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  {
    id: 'daily-checkin',
    titleKey: 'notifEvent.checkinTitle',
    descKey: 'notifEvent.checkinDesc',
    notifTitleKey: 'notif.dailyTitle',
    notifBodyKey: 'notif.dailyBody',
    defaults: { enabled: true, hour: 20, minute: 0, weekdays: ALL_DAYS },
  },
  {
    id: 'training-time',
    titleKey: 'notifEvent.trainingTitle',
    descKey: 'notifEvent.trainingDesc',
    notifTitleKey: 'notif.trainingTitle',
    notifBodyKey: 'notif.trainingBody',
    // Mon / Wed / Fri — the most common 3-day split rhythm.
    defaults: { enabled: false, hour: 18, minute: 0, weekdays: [2, 4, 6] },
  },
  {
    id: 'weigh-in',
    titleKey: 'notifEvent.weighTitle',
    descKey: 'notifEvent.weighDesc',
    notifTitleKey: 'notif.weighTitle',
    notifBodyKey: 'notif.weighBody',
    // Sunday morning: same conditions every week.
    defaults: { enabled: false, hour: 9, minute: 0, weekdays: [1] },
  },
  {
    id: 'calories',
    titleKey: 'notifEvent.caloriesTitle',
    descKey: 'notifEvent.caloriesDesc',
    notifTitleKey: 'notif.caloriesTitle',
    notifBodyKey: 'notif.caloriesBody',
    defaults: { enabled: false, hour: 13, minute: 0, weekdays: ALL_DAYS },
  },
];
