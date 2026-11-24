import type { Locale } from '@/i18n';

import { exerciseDisplayName } from './labels';
import { buildSessionReport, type SessionReport } from './session-report';
import {
  getWorkout,
  previousSplitSession,
  sessionSummary,
  workingSetsOf,
  type SessionSummary,
} from './session.repo';
import { DEFAULT_REST } from './slot-draft';

export type FullSessionReport = SessionReport & { summary: SessionSummary };

/**
 * The summary screen's read of one session: the plain summary (records, top
 * exercise — what the share card draws) and the report built on it (each
 * exercise's sets, the comparison with last time, the time breakdown).
 * Synchronous; the screen re-reads it when its live rows change.
 */
export const sessionReport = (
  logId: string,
  userId: string,
  locale: Locale,
): FullSessionReport | null => {
  const log = getWorkout(logId);
  // Owner-scoped: the summary route is deep-linkable.
  if (!log || log.userId !== userId) return null;
  const summary = sessionSummary(logId, locale);
  const names = new Map(summary.exercises.map((e) => [e.exerciseId, e.name]));
  return {
    summary,
    ...buildSessionReport({
      log,
      sets: workingSetsOf(logId),
      nameOf: (id, fallback) =>
        names.get(id) ?? exerciseDisplayName({ id, name: fallback ?? id }, locale),
      prIds: new Set(summary.exercises.filter((e) => e.isPr).map((e) => e.exerciseId)),
      previous: previousSplitSession(log),
      // What the session screen rests a slot with none planned at.
      defaultRestSeconds: DEFAULT_REST,
    }),
  };
};
