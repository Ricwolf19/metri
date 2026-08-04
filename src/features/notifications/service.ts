import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * The app's single gateway to expo-notifications. Every schedule goes through a
 * registered channel kind, so adding a new notification type is: add the kind
 * here, then call `scheduleDaily`/`scheduleOneShot` from a policy — no screen
 * ever talks to expo-notifications directly.
 */

export type ChannelKind = 'reminders' | 'rest-timer';

const CHANNELS: Record<ChannelKind, { name: string; importance: Notifications.AndroidImportance }> =
  {
    reminders: { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT },
    // HIGH so the "rest over" alert cuts through mid-workout.
    'rest-timer': { name: 'Rest timer', importance: Notifications.AndroidImportance.HIGH },
  };

/** Run once at startup: foreground display behavior + Android channels. */
export const initNotifications = async (): Promise<void> => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Promise.all(
      (Object.keys(CHANNELS) as ChannelKind[]).map((kind) =>
        Notifications.setNotificationChannelAsync(kind, {
          ...CHANNELS[kind],
          ...(kind === 'rest-timer' ? { vibrationPattern: [0, 250, 250, 250] } : {}),
        }),
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
  content: { title: string; body?: string },
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '' },
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
  content: { title: string; body?: string },
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
      channelId: kind,
    },
  });

/** One-shot notification `seconds` from now (the rest timer); returns its id. */
export const scheduleOneShot = (
  kind: ChannelKind,
  seconds: number,
  content: { title: string; body?: string },
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: kind,
    },
  });

/**
 * Present an ongoing (sticky) notification NOW — Android only by design: it is
 * the background rest indicator ("resting until HH:MM"). Returns the id for
 * `dismissOngoing`. On iOS this is a no-op (no sticky concept; the one-shot
 * "rest over" notification still fires).
 */
export const presentOngoing = async (
  kind: ChannelKind,
  content: { title: string; body?: string },
): Promise<string | null> => {
  if (Platform.OS !== 'android') return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body ?? '',
      sticky: true,
      autoDismiss: false,
    },
    trigger: { channelId: kind },
  });
};

export const dismissOngoing = async (id: string | null): Promise<void> => {
  if (!id) return;
  await Notifications.dismissNotificationAsync(id).catch(() => {});
};

export const cancelNotifications = async (ids: (string | null)[] | null): Promise<void> => {
  if (!ids?.length) return;
  await Promise.all(
    ids
      .filter((id): id is string => !!id)
      .map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
};
