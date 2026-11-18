import type { ProgressPose } from '@/db/schema';

import { POSES } from './checkins';

/**
 * The progress camera's rules, kept out of the screen so they can be tested:
 * the self-timer steps, where the walk through the poses goes after a save,
 * and how long a clip may be.
 */

/** Seconds; 0 = off. One tap on the timer button moves to the next. */
const TIMER_STEPS = [0, 3, 5, 10] as const;
export type TimerSeconds = (typeof TIMER_STEPS)[number];

export const nextTimer = (current: TimerSeconds): TimerSeconds =>
  TIMER_STEPS[(TIMER_STEPS.indexOf(current) + 1) % TIMER_STEPS.length];

/** A recorded clip stops by itself here: a posing round or one set, not a film. */
export const CLIP_MAX_S = 15;
const CLIP_MAX_MS = CLIP_MAX_S * 1000;
/** A clip picked from the gallery may run longer than one recorded here, up to this. */
export const CLIP_IMPORT_MAX_MS = 60_000;

/** The ghost's opacity when the camera opens: visible to line up against, not a double exposure. */
export const GHOST_OPACITY = 0.35;

/**
 * After `saved` is in, the pose to take next: the first one after it in
 * capture order (wrapping round) the check-in still lacks. Null when all five
 * are in — the check-in is complete.
 */
export const poseAfterSave = (
  done: ReadonlySet<ProgressPose>,
  saved: ProgressPose,
): ProgressPose | null => {
  const at = POSES.indexOf(saved);
  for (let step = 1; step < POSES.length; step += 1) {
    const pose = POSES[(at + step) % POSES.length];
    if (pose !== saved && !done.has(pose)) return pose;
  }
  return null;
};

/** How long a clip ran: from the tap to its end, never past the cap (the stop lands a little late). */
export const recordedMs = (startedAt: number, endedAt: number): number =>
  Math.max(0, Math.min(endedAt - startedAt, CLIP_MAX_MS));

/** "0:07 / 0:15" while recording. */
export const recordingText = (elapsedMs: number): string => {
  const s = Math.min(CLIP_MAX_S, Math.floor(elapsedMs / 1000));
  return `0:${String(s).padStart(2, '0')} / 0:${CLIP_MAX_S}`;
};
