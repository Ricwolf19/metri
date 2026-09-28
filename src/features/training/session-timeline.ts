import type { LoggedSet } from './day-events';

export type TimelineEntry = LoggedSet & {
  exerciseId: string;
  exerciseName: string;
  /** Seconds since the previous set of the session; null for the first. */
  restSeconds: number | null;
};

/**
 * A session's sets in the order they were logged. Set numbers restart per
 * exercise, so the log time is the only axis that shows how the session really
 * ran — supersets, reorders, and the rest actually taken between sets.
 */
export const buildTimeline = (
  exercises: { exerciseId: string; name: string; sets: LoggedSet[] }[],
): TimelineEntry[] => {
  const sorted = exercises
    .flatMap((ex) =>
      ex.sets.map((s) => ({ ...s, exerciseId: ex.exerciseId, exerciseName: ex.name })),
    )
    .sort((a, b) => a.loggedAt - b.loggedAt);
  return sorted.map((s, i) => ({
    ...s,
    restSeconds: i === 0 ? null : Math.round((s.loggedAt - sorted[i - 1]!.loggedAt) / 1000),
  }));
};

/** "2:05" — the gap between two sets. */
export const formatRest = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
