import type { ActiveRest } from '@/features/training/rest-state';
import type { ActiveSession } from '@/features/training/session-state';

/**
 * Body of the training foreground service, kept pure (clock, sleep, state and
 * effects injected) so the state machine is testable without notifee.
 *
 * The service spans the WHOLE session, not just a rest: it holds the runtime
 * open so the countdown can ring with the screen off, and it is what lets the
 * one notification survive from the first set to finish/abandon. Between rests
 * it only polls slowly. The countdown lives here rather than on an
 * `AlarmManager` trigger because exact alarms are denied by default from
 * Android 14 on for anything that is not a clock, so a trigger can land minutes
 * late in Doze; the trigger stays armed only as a fallback for a service the
 * OS killed, and `onRestOver` cancels it before ringing so nothing sounds twice.
 */
export type ServiceDeps = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  session: () => ActiveSession | null;
  rest: () => ActiveRest | null;
  /** The rest reached its end: cancel the fallback, redraw "rest over", start the alarm. */
  onRestOver: (rest: ActiveRest) => Promise<void>;
  /** A ringing rest was extended: silence, redraw the countdown. */
  onRestResumed: (rest: ActiveRest) => Promise<void>;
  /** Silence when the ringing rest goes away (skipped, next set logged, session ended). */
  onStop: () => void;
};

/** Clock check cadence while a rest runs; the chronometer itself is OS-drawn. */
export const REST_TICK_MS = 1000;
/** Between rests nothing is timed; `startRest` redraws on its own, so the
 * loop only needs to notice the rest before it ends. */
export const IDLE_TICK_MS = 5000;

/** Returns once the session is gone — what tells Android it may stop the service. */
export const runSessionService = async (workoutId: string, deps: ServiceDeps): Promise<void> => {
  let alarming = false;
  try {
    for (;;) {
      const session = deps.session();
      if (!session || session.workoutId !== workoutId) return;

      const current = deps.rest();
      const rest = current && current.workoutId === workoutId ? current : null;
      if (!rest) {
        if (alarming) {
          alarming = false;
          deps.onStop();
        }
        await deps.sleep(IDLE_TICK_MS);
        continue;
      }

      if (deps.now() < rest.endsAt) {
        if (alarming) {
          alarming = false;
          await deps.onRestResumed(rest).catch(() => {});
        }
        await deps.sleep(REST_TICK_MS);
        continue;
      }

      if (!alarming) {
        alarming = true;
        await deps.onRestOver(rest).catch(() => {});
      }
      await deps.sleep(REST_TICK_MS);
    }
  } finally {
    if (alarming) deps.onStop();
  }
};
