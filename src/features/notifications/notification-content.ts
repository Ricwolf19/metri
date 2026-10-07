import type { ActiveRest } from '@/features/training/rest-state';
import type { ActiveSession } from '@/features/training/session-state';

/**
 * What the one training notification says in each of its three faces. Pure:
 * `rest-notification.ts` maps this onto the notifee payload, so the copy and
 * the action sets are testable without the native module.
 */

export type NotificationMode = 'training' | 'rest' | 'restOver';

export const ACTION = {
  open: 'rest-open',
  skip: 'rest-skip',
  plus30: 'rest-plus-30',
  plus60: 'rest-plus-60',
} as const;

type NotificationAction = {
  id: (typeof ACTION)['skip' | 'plus30' | 'plus60'];
  title: string;
};

export type NotificationContent = {
  mode: NotificationMode;
  title: string;
  /** Collapsed body: the first line. */
  body: string;
  /** Expanded body, one entry per line. */
  lines: string[];
  url: string;
  chronometer: { direction: 'up' | 'down'; timestamp: number } | null;
  actions: NotificationAction[];
  /** False only when the redraw itself must alert (the rest is over). */
  alertOnce: boolean;
};

/** Derived, never stored: the clock decides whether a rest is still running. */
export const notificationMode = (rest: ActiveRest | null, now: number): NotificationMode =>
  !rest ? 'training' : now < rest.endsAt ? 'rest' : 'restOver';

export const workoutUrl = (workoutId: string, slotId?: string): string =>
  `metri://training/workout/${workoutId}${slotId ? `?slot=${slotId}` : ''}`;

const nextLines = (session: ActiveSession): string[] => {
  const { next } = session;
  // A record written before `next` existed: title and clock only.
  if (next === undefined) return [];
  if (next === null) return session.doneLabel ? [session.doneLabel] : [];
  return [
    [next.exerciseName, next.setLabel].filter(Boolean).join(' · '),
    [next.targetLabel, next.weightLabel].filter(Boolean).join(' · '),
  ].filter(Boolean);
};

/**
 * The face for `mode`. `session` may be missing only for the rest-over
 * fallback trigger (armed from the rest alone); with neither there is nothing
 * to show.
 */
export const notificationContent = (
  session: ActiveSession | null,
  rest: ActiveRest | null,
  mode: NotificationMode,
): NotificationContent | null => {
  if (!session && !rest) return null;
  const workoutId = session?.workoutId ?? rest?.workoutId ?? '';
  const lines = session ? nextLines(session) : [];
  const base = {
    lines,
    body: lines[0] ?? '',
    url: workoutUrl(workoutId, session?.next?.slotId ?? rest?.slotId),
  };
  if (mode === 'training' || !rest) {
    return {
      ...base,
      mode: 'training',
      title: session?.title ?? '',
      chronometer: session ? { direction: 'up', timestamp: session.startedAt } : null,
      actions: [],
      alertOnce: true,
    };
  }
  const skip = { id: ACTION.skip, title: rest.copy.skipLabel };
  const plus30 = { id: ACTION.plus30, title: rest.copy.plus30Label };
  if (mode === 'rest') {
    return {
      ...base,
      mode,
      title: rest.copy.restingTitle,
      chronometer: { direction: 'down', timestamp: rest.endsAt },
      actions: [skip, plus30, { id: ACTION.plus60, title: rest.copy.plus60Label }],
      alertOnce: true,
    };
  }
  return {
    ...base,
    mode,
    title: rest.copy.overTitle,
    // Counts how long the lifter has been over: the overrun is the information.
    chronometer: { direction: 'up', timestamp: rest.endsAt },
    actions: [{ ...skip, title: rest.copy.readyLabel ?? rest.copy.skipLabel }, plus30],
    alertOnce: false,
  };
};
