import { resolveLocale } from '@/i18n';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { settings } from '@/lib/storage';

import { NOTIFICATION_EVENTS, type EventConfig, type NotificationEvent } from './events';
import {
  cancelNotifications,
  ensureNotificationPermission,
  scheduleDaily,
  scheduleWeekly,
} from './service';

/**
 * Reconciles the OS schedule with the notification-event catalogue: for every
 * event, cancel what was scheduled before and reschedule from its current
 * config. Idempotent — call it whenever an input changes (boot, master switch,
 * any event edit). The app decides the events; the user only tunes them.
 */

// resolveLocale, not settings.getLocale(): with no explicit choice the UI falls
// back to the device language, and notification copy must match it.
const strings = () => (resolveLocale() === 'es' ? es : en);

export const getEventConfig = (event: NotificationEvent): EventConfig =>
  settings.getEventConfig<EventConfig>(event.id, event.defaults);

export const syncNotificationEvents = async (): Promise<void> => {
  const masterOn = settings.getNotificationsEnabled();
  const dict = strings();

  for (const event of NOTIFICATION_EVENTS) {
    await cancelNotifications(settings.getEventIds(event.id));
    settings.setEventIds(event.id, []);

    if (!masterOn) continue;
    const cfg = getEventConfig(event);
    if (!cfg.enabled || !cfg.weekdays.length) continue;

    const granted = await ensureNotificationPermission();
    if (!granted) return; // no permission — nothing else can schedule either

    const content = { title: dict[event.notifTitleKey], body: dict[event.notifBodyKey] };
    const ids =
      cfg.weekdays.length === 7
        ? [await scheduleDaily('reminders', cfg.hour, cfg.minute, content)]
        : await Promise.all(
            cfg.weekdays.map((weekday) =>
              scheduleWeekly('reminders', weekday, cfg.hour, cfg.minute, content),
            ),
          );
    settings.setEventIds(event.id, ids);
  }
};
