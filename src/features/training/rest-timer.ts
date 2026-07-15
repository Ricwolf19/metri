import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Rest-timer notifications: a one-shot local notification scheduled when a set is
 * logged, so the countdown still fires if the app is backgrounded. Reuses the
 * global handler set by `reminders/scheduler.ts`; only the channel differs (its
 * own HIGH-importance channel so the alert cuts through mid-workout).
 */

const CHANNEL_ID = 'rest-timer';

/** Run once at startup, next to `initNotifications()`. */
export const initRestNotifications = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rest timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
};

/** Schedule the "rest over" notification `seconds` from now; returns its id. */
export const scheduleRestNotification = (
  seconds: number,
  title: string,
  body: string,
): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: CHANNEL_ID,
    },
  });

export const cancelRestNotification = async (id: string | null): Promise<void> => {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
};
