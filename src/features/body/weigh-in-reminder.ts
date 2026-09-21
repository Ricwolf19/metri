import { NOTIFICATION_EVENTS } from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { settings } from '@/lib/storage';

const WEIGH_IN_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'weigh-in')!;

/**
 * Point the weigh-in reminder at the phase's check-in weekday. Same contract as
 * `syncTrainingReminder`: only the schedule moves — whether the reminder is on,
 * and at what time, stays the user's call.
 */
export const syncWeighInReminder = async (checkinWeekday: number): Promise<void> => {
  const current = getEventConfig(WEIGH_IN_EVENT);
  settings.setEventConfig(WEIGH_IN_EVENT.id, { ...current, weekdays: [checkinWeekday] });
  await syncNotificationEvents();
};
