import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { routines, userPrograms, workoutDays } from '@/db/schema';
import { NOTIFICATION_EVENTS } from '@/features/notifications/events';
import { getEventConfig } from '@/features/notifications/policies';
import { dateFromKey, localDateKey } from '@/features/training/dates';
import { dayDisplayName } from '@/features/training/labels';
import { resolveLocale, tFor } from '@/i18n';
import { settings } from '@/lib/storage';
import { captureError } from '@/lib/telemetry';
import { tokenHex } from '@/theme/tokens';

import { planSessions, type PlanPhase, type PlannedSession } from './plan';

/**
 * The ONLY module importing `expo-calendar`. Opt-in (`settings.calendarSync`):
 * metri writes the active enrollment's planned training days, for the next
 * `WEEKS_AHEAD` weeks, into a calendar of its OWN — on Android a local-account
 * calendar, so nothing rides a Google account's sync. It never reads another
 * calendar's events: it lists calendars only to find its own again after a
 * reinstall, and diffs against the ids it wrote (`settings.calendarState`).
 * Past events stay as they were; turning it off deletes metri's calendar and
 * everything in it. Every call is guarded, and a refused permission is an
 * answer: the sync simply writes nothing.
 */

const CALENDAR_NAME = 'metri';
const WEEKS_AHEAD = 4;
const SESSION_MINUTES = 60;
const TRAINING_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'training-time')!;

type WrittenEvent = { id: string; key: string; date: string };
type CalendarState = { calendarId: string; events: WrittenEvent[] };

/** The stored state, or null for anything an older build (or a bad write) left behind. */
const parseCalendarState = (raw: unknown): CalendarState | null => {
  if (!raw || typeof raw !== 'object') return null;
  const { calendarId, events } = raw as Record<string, unknown>;
  if (typeof calendarId !== 'string' || !Array.isArray(events)) return null;
  return {
    calendarId,
    events: events.filter(
      (e): e is WrittenEvent =>
        !!e &&
        typeof (e as WrittenEvent).id === 'string' &&
        typeof (e as WrittenEvent).key === 'string' &&
        typeof (e as WrittenEvent).date === 'string',
    ),
  };
};

/** What makes two planned events the same: a re-sync keeps an event whose key still stands. */
const sessionKey = (s: PlannedSession, title: string): string =>
  `${s.date}|${s.startMinute}|${title}`;

/** The active enrollment's phases and cursor, or null (none, paused, finished). */
const readPlan = (userId: string) => {
  const [enrollment] = db
    .select()
    .from(userPrograms)
    .where(and(eq(userPrograms.userId, userId), eq(userPrograms.status, 'active')))
    .orderBy(desc(userPrograms.createdAt))
    .limit(1)
    .all();
  if (!enrollment?.currentRoutineId) return null;
  // The enrolled copy's phases are the current one's siblings: rows from builds
  // before the copy was tagged carry no `user_program_id`, but always a parent.
  const [current] = db
    .select({ programId: routines.programId })
    .from(routines)
    .where(eq(routines.id, enrollment.currentRoutineId))
    .all();
  if (!current) return null;
  const phaseRows = db
    .select()
    .from(routines)
    .where(eq(routines.programId, current.programId))
    .orderBy(asc(routines.orderIndex))
    .all();
  const dayRows = phaseRows.length
    ? db
        .select()
        .from(workoutDays)
        .where(
          inArray(
            workoutDays.routineId,
            phaseRows.map((r) => r.id),
          ),
        )
        .all()
    : [];
  const phases: PlanPhase[] = phaseRows.map((r) => ({
    id: r.id,
    durationWeeks: r.durationWeeks,
    days: dayRows.filter((d) => d.routineId === r.id),
  }));
  return {
    phases,
    currentPhaseId: enrollment.currentRoutineId,
    currentWeek: enrollment.currentWeek,
  };
};

const granted = async (): Promise<boolean> => {
  try {
    return (await Calendar.getCalendarPermissions()).granted;
  } catch {
    return false;
  }
};

/** Ask once, from the switch. A refusal is an answer, never an error. */
export const requestCalendarAccess = async (): Promise<boolean> => {
  try {
    return (await Calendar.requestCalendarPermissions()).granted;
  } catch {
    return false;
  }
};

/**
 * A calendar metri made before (a reinstall lost the stored id). The title alone
 * is not proof: adopting someone's own "metri" calendar would write into it, and
 * turning the mirror off deletes the adopted calendar whole. Android: metri's own
 * local account. iOS: the on-device source only — a "metri" calendar in an
 * account is never ours to take (a reinstall there makes a new one instead).
 */
const isOurs = (c: Calendar.ExpoCalendar): boolean =>
  c.title === CALENDAR_NAME &&
  (Platform.OS === 'android'
    ? !!c.source?.isLocalAccount && c.source.name === CALENDAR_NAME
    : c.source?.type === Calendar.SourceType.LOCAL);

const createOwnCalendar = async (): Promise<Calendar.ExpoCalendar> => {
  const base = {
    title: CALENDAR_NAME,
    name: CALENDAR_NAME,
    color: tokenHex('--brand'),
    entityType: Calendar.EntityTypes.EVENT,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    ownerAccount: CALENDAR_NAME,
  };
  if (Platform.OS === 'android') {
    // A local account: the events live on this phone and no account syncs them.
    return Calendar.createCalendar({
      ...base,
      source: { name: CALENDAR_NAME, isLocalAccount: true, type: 'LOCAL' },
    });
  }
  // iOS: the on-device source when the phone has one, else where it keeps calendars.
  const local = Calendar.getSourcesSync().find((s) => s.type === Calendar.SourceType.LOCAL);
  const sourceId = local?.id ?? Calendar.getDefaultCalendarSync().source?.id;
  return Calendar.createCalendar({ ...base, sourceId });
};

/** metri's calendar: the one it stored, else one it made before (a reinstall), else a new one. */
const ownCalendar = async (known: string | null): Promise<Calendar.ExpoCalendar> => {
  if (known) {
    try {
      return await Calendar.ExpoCalendar.get(known);
    } catch {
      // Deleted from the phone's own settings: find or make it again.
    }
  }
  const mine = (await Calendar.getCalendars(Calendar.EntityTypes.EVENT)).find(isOurs);
  return mine ?? createOwnCalendar();
};

const deleteEvent = async (id: string): Promise<void> => {
  try {
    await (await Calendar.ExpoCalendarEvent.get(id)).delete();
  } catch {
    // The lifter deleted it in their calendar app already.
  }
};

/** One reconcile at a time: two overlapping ones would each write the same days. */
let inFlight: Promise<void> = Promise.resolve();

const reconcile = async (userId: string): Promise<void> => {
  if (!settings.getCalendarSync() || !userId || !(await granted())) return;
  const stored = parseCalendarState(settings.getCalendarState());
  const calendar = await ownCalendar(stored?.calendarId ?? null);
  // A different calendar means the old ids point nowhere we own.
  const written = stored?.calendarId === calendar.id ? stored.events : [];

  const t = tFor(resolveLocale());
  const plan = readPlan(userId);
  const cfg = getEventConfig(TRAINING_EVENT);
  const sessions = plan
    ? planSessions({
        ...plan,
        today: localDateKey(),
        weeks: WEEKS_AHEAD,
        startMinute: cfg.hour * 60 + cfg.minute,
      })
    : [];
  const wanted = sessions.map((s) => {
    const title = t('calendar.eventTitle', { split: dayDisplayName(s.day, t) });
    return { session: s, title, key: sessionKey(s, title) };
  });
  const wantedKeys = new Set(wanted.map((w) => w.key));
  const today = localDateKey();

  // Past events are history: kept in the calendar, dropped from what we track.
  const upcoming = written.filter((e) => e.date >= today);
  const keep = upcoming.filter((e) => wantedKeys.has(e.key));
  for (const e of upcoming) if (!wantedKeys.has(e.key)) await deleteEvent(e.id);

  // Recorded as it goes, like the notification reconciler: an event created and
  // then lost to a throw (or a killed process) further down would never be
  // deleted again, and the next run would write its day a second time.
  const next: WrittenEvent[] = [...keep];
  const save = () =>
    settings.setCalendarState({ calendarId: calendar.id, events: next } satisfies CalendarState);
  save();
  const keptKeys = new Set(keep.map((e) => e.key));
  for (const w of wanted) {
    if (keptKeys.has(w.key)) continue;
    const start = dateFromKey(w.session.date);
    start.setMinutes(w.session.startMinute);
    const event = await calendar.createEvent({
      title: w.title,
      notes: t('calendar.eventNotes'),
      startDate: start,
      endDate: new Date(start.getTime() + SESSION_MINUTES * 60_000),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // metri reminds on its own schedule; a second alarm from the calendar is noise.
      alarms: [],
    });
    next.push({ id: event.id, key: w.key, date: w.session.date });
    save();
  }
};

/** Bring metri's calendar up to date with the plan. Never throws. */
export const syncTrainingCalendar = (userId: string): Promise<void> => {
  inFlight = inFlight
    .then(() => reconcile(userId))
    .catch((error) => {
      // Permission and missing-calendar paths return early; anything here is a surprise.
      captureError(error);
    });
  return inFlight;
};

/** Switch the mirror off: metri's calendar and every event in it go. */
export const removeTrainingCalendar = (): Promise<void> => {
  inFlight = inFlight
    .then(async () => {
      settings.setCalendarSync(false);
      const stored = parseCalendarState(settings.getCalendarState());
      settings.clearCalendarState();
      if (!stored || !(await granted())) return;
      try {
        await (await Calendar.ExpoCalendar.get(stored.calendarId)).delete();
      } catch {
        // Already gone from the phone's settings.
      }
    })
    .catch(captureError);
  return inFlight;
};
