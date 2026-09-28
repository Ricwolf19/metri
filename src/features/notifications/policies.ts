import { localDateKey } from '@/features/training/dates';
import { resolveLocale } from '@/i18n';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { settings } from '@/lib/storage';

import { planCheckinAfterSession, planHeldCheckin, type CheckinHold } from './checkin-hold';
import {
  DEFAULT_CHECKIN_OFFSET_MIN,
  NOTIFICATION_EVENTS,
  RETIRED_EVENT_IDS,
  type EventConfig,
  type NotificationEvent,
} from './events';
import { isDailyAtOneTime, scheduleEntries, shiftEntries } from './schedule-entries';
import { tipFor, tipSlotsFor } from './tips';
import {
  cancelNotifications,
  ensureNotificationPermission,
  scheduleDaily,
  scheduleOnce,
  scheduleWeekly,
} from './service';

/**
 * Reconciles the OS schedule with the notification-event catalogue: for every
 * event, cancel what was scheduled before and reschedule from its current
 * config. Idempotent — call it whenever an input changes (boot, master switch,
 * any event edit).
 */

// resolveLocale, not settings.getLocale(): with no explicit choice the UI falls
// back to the device language, and notification copy must match it.
const strings = () => (resolveLocale() === 'es' ? es : en);

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export const getEventConfig = (event: NotificationEvent): EventConfig =>
  settings.getEventConfig<EventConfig>(event.id, event.defaults);

/** The (weekday, time) slots an event actually fires at, after its tuning is applied. */
const firingEntries = (event: NotificationEvent, cfg: EventConfig) => {
  const entries = scheduleEntries(cfg);
  return event.tuning === 'offset'
    ? shiftEntries(entries, cfg.offsetMinutes ?? DEFAULT_CHECKIN_OFFSET_MIN)
    : entries;
};

const CHECKIN_EVENT_ID: NotificationEvent['id'] = 'session-checkin';
const CHECKIN_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === CHECKIN_EVENT_ID)!;

/**
 * The check-in's weekly entries plus any one-shots, with a session's hold
 * applied (see checkin-hold). An expired hold is dropped here, so the next
 * reconcile after its moment passes restores the plain weekly schedule.
 */
const checkinEntries = (cfg: EventConfig) => {
  const offset = cfg.offsetMinutes ?? DEFAULT_CHECKIN_OFFSET_MIN;
  const raw = scheduleEntries(cfg);
  const hold = settings.getCheckinHold<CheckinHold>();
  const plan = hold
    ? planHeldCheckin({ entries: raw, offsetMinutes: offset, hold, now: Date.now() })
    : null;
  if (!plan || plan.expired) {
    if (hold) settings.clearCheckinHold();
    return { entries: shiftEntries(raw, offset), once: [] };
  }
  return { entries: plan.weekly, once: plan.once };
};

const reconcile = async (): Promise<void> => {
  const masterOn = settings.getNotificationsEnabled();
  const locale = resolveLocale();
  const dict = strings();

  // Events that no longer exist still own OS notifications from an older build.
  for (const retired of RETIRED_EVENT_IDS) {
    const stale = settings.getEventIds(retired);
    if (stale.length) await cancelNotifications(stale);
    // Clear the config too: the catalogue will never read it again.
    settings.clearEvent(retired);
  }

  for (const event of NOTIFICATION_EVENTS) {
    await cancelNotifications(settings.getEventIds(event.id));
    settings.setEventIds(event.id, []);

    if (!masterOn) continue;
    const cfg = getEventConfig(event);
    if (!cfg.enabled) continue;
    // Frequency events carry their own slots; the rest need real entries.
    const { entries, once } =
      event.id === CHECKIN_EVENT_ID
        ? checkinEntries(cfg)
        : { entries: firingEntries(event, cfg), once: [] as number[] };
    if (event.tuning !== 'frequency' && !entries.length && !once.length) continue;

    const granted = await ensureNotificationPermission();
    if (!granted) return; // no permission — nothing else can schedule either

    // Tips rotate: one distinct entry per (slot, weekday), so a week of
    // notifications never says the same thing twice.
    if (event.tuning === 'frequency') {
      const times = cfg.timesPerDay ?? 2;
      // A stale `slots` from a different count would silently drop or duplicate
      // a tip, so the length decides whether the user's times still apply.
      const slots = cfg.slots?.length === times ? cfg.slots : tipSlotsFor(times);
      // Recorded as they land: anything the OS already accepted must stay
      // cancellable even if a later call throws (expo caps pending
      // notifications) — an id we forget can never be unscheduled again.
      const tipIds: string[] = [];
      try {
        for (const [i, slot] of slots.entries()) {
          for (const weekday of WEEKDAYS) {
            tipIds.push(
              await scheduleWeekly(
                'reminders',
                weekday,
                slot.hour,
                slot.minute,
                tipFor(locale, i, weekday),
              ),
            );
          }
        }
      } finally {
        settings.setEventIds(event.id, tipIds);
      }
      continue;
    }

    const content = {
      title: dict[event.notifTitleKey],
      body: dict[event.notifBodyKey],
      data: { event: event.id },
    };
    const ids: string[] = [];
    try {
      if (isDailyAtOneTime(entries)) {
        ids.push(await scheduleDaily('reminders', entries[0].hour, entries[0].minute, content));
      } else {
        for (const e of entries) {
          ids.push(await scheduleWeekly('reminders', e.weekday, e.hour, e.minute, content));
        }
      }
      for (const at of once) ids.push(await scheduleOnce('reminders', new Date(at), content));
    } finally {
      settings.setEventIds(event.id, ids);
    }
  }
};

/**
 * One reconcile at a time. Every edit on the settings screen fires this, and two
 * overlapping runs interleave their cancel/schedule passes — the second cancels
 * ids the first has not recorded yet, orphaning a whole batch.
 */
let inFlight: Promise<void> = Promise.resolve();

/** Queue `step` behind every earlier reconcile. State the reconciler reads (the
 * check-in hold) is written in here too: written outside, a run already in
 * flight could clear a hold it read as expired a moment before. */
const enqueue = (step: () => Promise<void>): Promise<void> => {
  inFlight = inFlight.then(step, step);
  return inFlight;
};

export const syncNotificationEvents = (): Promise<void> => enqueue(reconcile);

/** A session started: hold back that day's planned check-in while it runs. */
export const holdCheckin = (startedAt: number): Promise<void> =>
  enqueue(() => {
    settings.setCheckinHold({ day: localDateKey(new Date(startedAt)), askAt: null });
    return reconcile();
  });

/** A session ended: ask once at end + delay, or keep quiet when the day is answered. */
export const releaseCheckin = (session: {
  startedAt: number;
  endedAt: number;
  dayResolved: boolean;
}): Promise<void> =>
  enqueue(() => {
    const cfg = getEventConfig(CHECKIN_EVENT);
    const hold = planCheckinAfterSession({
      ...session,
      delayMinutes: cfg.offsetMinutes ?? DEFAULT_CHECKIN_OFFSET_MIN,
      enabled: cfg.enabled,
      masterEnabled: settings.getNotificationsEnabled(),
    });
    if (hold) settings.setCheckinHold(hold);
    else settings.clearCheckinHold();
    return reconcile();
  });
