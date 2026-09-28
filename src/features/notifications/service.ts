import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { appLinkFrom } from './app-link';

/**
 * The app's single gateway to expo-notifications. Every schedule goes through a
 * registered channel kind, so adding a new notification type is: add the kind
 * here, then call `scheduleDaily`/`scheduleWeekly` from a policy — no screen
 * ever talks to expo-notifications directly.
 */

export type ChannelKind = 'reminders';

/** Rides on every scheduled notification so a handler can tell which
 * catalogue event fired; `url` is an in-app deep link a tap opens. */
type NotificationData = { event?: string; url?: string };
type Content = { title: string; body?: string; data?: NotificationData };

const SHOW = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
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
    // No mid-session swallow here: the OS draws background notifications
    // itself, so the check-in is held back at schedule time (checkin-hold).
    handleNotification: async () => SHOW,
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

/** Whether notifications may be shown, WITHOUT prompting (for flows the user did not start). */
export const hasNotificationPermission = async (): Promise<boolean> =>
  (await Notifications.getPermissionsAsync()).granted;

/** Show a notification right away (a one-shot, never part of the reconciled catalogue). */
export const notifyNow = (kind: ChannelKind, content: Content): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '', sound: SOUND, data: content.data },
    trigger: { channelId: kind },
  });

const openDataUrl = (response: Notifications.NotificationResponse | null): void => {
  const url = appLinkFrom(response?.notification.request.content.data);
  if (url) void Linking.openURL(url).catch(() => {});
};

/**
 * Route taps on notifications that carry `data.url` — including the one that
 * cold-started the app. The last response is cleared once handled, so an OTA
 * restart (`reloadAsync`) does not replay it. Returns the unsubscribe.
 */
export const subscribeNotificationTaps = (): (() => void) => {
  const initial = Notifications.getLastNotificationResponse();
  if (initial) {
    openDataUrl(initial);
    Notifications.clearLastNotificationResponse();
  }
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    openDataUrl(response);
    Notifications.clearLastNotificationResponse();
  });
  return () => sub.remove();
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

/** One-shot notification at an exact moment; returns the OS id. */
export const scheduleOnce = (kind: ChannelKind, at: Date, content: Content): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: content.title, body: content.body ?? '', sound: SOUND, data: content.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
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
