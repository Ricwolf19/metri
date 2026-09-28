import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isSessionInProgress } from '@/features/training/session-state';
import { settings } from '@/lib/storage';

import { decideCheckin } from './checkin-delay';

/**
 * The app's single gateway to expo-notifications. Every schedule goes through a
 * registered channel kind, so adding a new notification type is: add the kind
 * here, then call `scheduleDaily`/`scheduleWeekly` from a policy — no screen
 * ever talks to expo-notifications directly.
 */

export type ChannelKind = 'reminders';

/** Rides on every scheduled notification so the foreground handler knows which
 * catalogue event fired. */
type NotificationData = { event?: string };
type Content = { title: string; body?: string; data?: NotificationData };

/** The event whose question has no answer mid-workout (see checkin-delay). */
const CHECKIN_EVENT_ID = 'session-checkin';

const SHOW = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};
const HIDE = {
  shouldShowBanner: false,
  shouldShowList: false,
  shouldPlaySound: false,
  shouldSetBadge: false,
};

/**
 * A check-in landing mid-workout is swallowed and re-sent once the delay
 * passes (the re-send runs through here again, so a session still going
 * pushes it further). Only reachable while the app is in the foreground —
 * which a workout on screen is — since the OS draws background ones itself.
 */
const postponeCheckin = (content: Notifications.NotificationContent): boolean => {
  const data = content.data as NotificationData | undefined;
  if (data?.event !== CHECKIN_EVENT_ID) return false;
  const now = Date.now();
  const decision = decideCheckin({
    sessionActive: isSessionInProgress(now),
    snoozedUntil: settings.getCheckinSnoozedUntil(),
    now,
  });
  if (decision.ask) return false;
  settings.setCheckinSnoozedUntil(decision.snoozeUntil);
  void Notifications.scheduleNotificationAsync({
    content: {
      title: content.title ?? '',
      body: content.body ?? '',
      sound: SOUND,
      data: { event: CHECKIN_EVENT_ID },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: decision.snoozeUntil,
      channelId: 'reminders',
    },
  }).catch(() => {});
  return true;
};

/** Bundled via the expo-notifications plugin (app.json → `sounds`). Android
 * resolves it per channel, iOS per notification, so both are set below. */
const SOUND = 'notify.wav';

// The rest timer lives in `rest-notification.ts` (react-native-notify-kit).
const CHANNELS: Record<
  ChannelKind,
  { name: string; importance: Notifications.AndroidImportance; sound: string }
> = {
  reminders: {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: SOUND,
  },
};

/** Run once at startup: foreground display behavior + Android channels. */
export const initNotifications = async (): Promise<void> => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) =>
      postponeCheckin(notification.request.content) ? HIDE : SHOW,
  });
  if (Platform.OS === 'android') {
    await Promise.all(
      (Object.keys(CHANNELS) as ChannelKind[]).map((kind) =>
        Notifications.setNotificationChannelAsync(kind, CHANNELS[kind]),
      ),
    );
  }
};

/** Ask for permission lazily (first time a notification feature is enabled). */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

/** Daily repeating notification at a local time; returns the OS id. */
export const scheduleDaily = (
  kind: ChannelKind,
  hour: number,
  minute: number,
  content: Content,
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '', sound: SOUND, data: content.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: kind,
    },
  });

/** Weekly repeating notification (weekday: 1=Sunday…7=Saturday); returns the id. */
export const scheduleWeekly = (
  kind: ChannelKind,
  weekday: number,
  hour: number,
  minute: number,
  content: Content,
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '', sound: SOUND, data: content.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
      channelId: kind,
    },
  });

export const cancelNotifications = async (ids: (string | null)[] | null): Promise<void> => {
  if (!ids?.length) return;
  await Promise.all(
    ids
      .filter((id): id is string => !!id)
      .map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
};
