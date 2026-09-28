/**
 * Postponing the trained/rested/missed check-in while a workout is in
 * progress: nobody can answer "did you finish today's session?" mid-set. The
 * prompt is pushed ~1h out instead of asking on top of the training screen.
 */

export const CHECKIN_DELAY_MIN = 60;
const DELAY_MS = CHECKIN_DELAY_MIN * 60_000;

export type CheckinDelay = {
  /** A session is on right now. */
  sessionActive: boolean;
  /** Epoch ms until which a previous postponement still stands. */
  snoozedUntil: number;
  /** Epoch ms now (injected for tests). */
  now: number;
};

export type CheckinDecision = { ask: true } | { ask: false; snoozeUntil: number };

/**
 * Ask only when no session runs and no postponement stands. An active session
 * always re-arms the snooze (a long session keeps the prompt away without the
 * screen needing to re-check every minute); an expired snooze with the session
 * over lets the prompt through.
 */
export const decideCheckin = ({
  sessionActive,
  snoozedUntil,
  now,
}: CheckinDelay): CheckinDecision => {
  if (sessionActive) return { ask: false, snoozeUntil: now + DELAY_MS };
  if (snoozedUntil > now) return { ask: false, snoozeUntil: snoozedUntil };
  return { ask: true };
};
