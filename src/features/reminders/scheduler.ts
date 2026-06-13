import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/db/schema';

const CHANNEL_ID = 'reminders';

/** Run once at startup: foreground display behavior + Android channel. */
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
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

/** Ask for permission lazily (the first time a reminder is enabled). */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

const triggerFor = (r: Reminder): Notifications.SchedulableNotificationTriggerInput =>
  r.frequency === 'weekly'
    ? {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: r.weekday ?? 1,
        hour: r.hour,
        minute: r.minute,
        channelId: CHANNEL_ID,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
        channelId: CHANNEL_ID,
      };

/** Schedule the OS notification for a reminder; returns its notification id. */
export const scheduleReminder = (r: Reminder): Promise<string> =>
  Notifications.scheduleNotificationAsync({
    content: { title: r.title, body: r.body ?? '' },
    trigger: triggerFor(r),
  });

export const cancelReminder = async (notificationId?: string | null): Promise<void> => {
  if (notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId);
};
