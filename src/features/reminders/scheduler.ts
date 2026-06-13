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

/**
 * The OS trigger(s) for a reminder. A weekly reminder fires on each selected day,
 * so it needs one WEEKLY trigger per weekday; a daily reminder needs just one.
 */
const triggersFor = (r: Reminder): Notifications.SchedulableNotificationTriggerInput[] => {
  if (r.frequency === 'weekly') {
    const days = r.weekdays?.length ? r.weekdays : [1];
    return days.map((weekday) => ({
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour: r.hour,
      minute: r.minute,
      channelId: CHANNEL_ID,
    }));
  }
  return [
    {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: r.hour,
      minute: r.minute,
      channelId: CHANNEL_ID,
    },
  ];
};

/** Schedule the OS notification(s) for a reminder; returns every notification id. */
export const scheduleReminder = (r: Reminder): Promise<string[]> =>
  Promise.all(
    triggersFor(r).map((trigger) =>
      Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body ?? '' },
        trigger,
      }),
    ),
  );

export const cancelReminder = async (notificationIds?: string[] | null): Promise<void> => {
  if (!notificationIds?.length) return;
  await Promise.all(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
};
