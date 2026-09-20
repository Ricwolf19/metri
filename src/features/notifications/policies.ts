import { resolveLocale } from '@/i18n';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { settings } from '@/lib/storage';

import { NOTIFICATION_EVENTS, type EventConfig, type NotificationEvent } from './events';
import { isDailyAtOneTime, scheduleEntries } from './schedule-entries';
import { TIP_SLOTS, tipFor } from './tips';
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

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export const getEventConfig = (event: NotificationEvent): EventConfig =>
  settings.getEventConfig<EventConfig>(event.id, event.defaults);

export const syncNotificationEvents = async (): Promise<void> => {
  const masterOn = settings.getNotificationsEnabled();
  const locale = resolveLocale();
  const dict = strings();

  for (const event of NOTIFICATION_EVENTS) {
    await cancelNotifications(settings.getEventIds(event.id));
    settings.setEventIds(event.id, []);

    if (!masterOn) continue;
    const cfg = getEventConfig(event);
    if (!cfg.enabled) continue;
    // Frequency events carry their own slots; the rest need real entries.
    const entries = scheduleEntries(cfg);
    if (event.tuning !== 'frequency' && !entries.length) continue;

    const granted = await ensureNotificationPermission();
    if (!granted) return; // no permission — nothing else can schedule either

    // Tips rotate: one distinct entry per (slot, weekday), so a week of
    // notifications never says the same thing twice.
    if (event.tuning === 'frequency') {
      const slots = TIP_SLOTS[cfg.timesPerDay ?? 3] ?? TIP_SLOTS[3];
      const tipIds = await Promise.all(
        slots.flatMap((slot, i) =>
          WEEKDAYS.map((weekday) =>
            scheduleWeekly(
              'reminders',
              weekday,
              slot.hour,
              slot.minute,
              tipFor(locale, i, weekday),
            ),
          ),
        ),
      );
      settings.setEventIds(event.id, tipIds);
      continue;
    }

    const content = { title: dict[event.notifTitleKey], body: dict[event.notifBodyKey] };
    const ids = isDailyAtOneTime(entries)
      ? [await scheduleDaily('reminders', entries[0].hour, entries[0].minute, content)]
      : await Promise.all(
          entries.map((e) => scheduleWeekly('reminders', e.weekday, e.hour, e.minute, content)),
        );
    settings.setEventIds(event.id, ids);
  }
};
