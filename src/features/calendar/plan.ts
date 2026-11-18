import { dateFromKey, localDateKey, mondayOf } from '@/features/training/dates';
import { DAY_ORDER } from '@/features/training/labels';

/**
 * Which split lands on which date, for the phone-calendar mirror. Pure: the
 * sync (`sync.ts`) reads the enrollment and writes what this returns.
 *
 * The plan holds weekdays per phase, and the cursor (phase + program week)
 * moves only when a week's splits are done. Looking ahead, this assumes the
 * lifter keeps pace — this calendar week is the cursor's week, each later one
 * the next program week, rolling into the next phase when one runs out — and
 * the sync re-runs as the cursor really moves, so a slower week re-plans
 * itself. A finished program plans nothing past its last week.
 */

type PlanDay = { id: string; name: string; orderIndex: number; weekday: number | null };
export type PlanPhase = { id: string; durationWeeks: number; days: readonly PlanDay[] };

export type PlannedSession = {
  /** 'YYYY-MM-DD' (local). */
  date: string;
  day: PlanDay;
  /** Minutes after midnight: the training-time reminder's own time. */
  startMinute: number;
};

export type PlanInput = {
  /** In program order. */
  phases: readonly PlanPhase[];
  currentPhaseId: string;
  /** 1-based program week within the current phase. */
  currentWeek: number;
  today: string;
  /** Calendar weeks to plan, this one included. */
  weeks: number;
  startMinute: number;
};

/** Days after Monday for an expo weekday (1 = Sunday … 7 = Saturday). */
const offsetFromMonday = (weekday: number): number => DAY_ORDER.indexOf(weekday);

const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The phase in force `ahead` program weeks after the cursor, or null past the program's end. */
const phaseAhead = (
  phases: readonly PlanPhase[],
  start: number,
  week: number,
  ahead: number,
): PlanPhase | null => {
  let i = start;
  let w = week + ahead;
  while (i < phases.length && w > Math.max(1, phases[i].durationWeeks)) {
    w -= Math.max(1, phases[i].durationWeeks);
    i += 1;
  }
  return phases[i] ?? null;
};

export const planSessions = (input: PlanInput): PlannedSession[] => {
  const start = input.phases.findIndex((p) => p.id === input.currentPhaseId);
  if (start < 0) return [];
  const monday = mondayOf(dateFromKey(input.today));
  const out: PlannedSession[] = [];
  for (let k = 0; k < input.weeks; k++) {
    const phase = phaseAhead(input.phases, start, Math.max(1, input.currentWeek), k);
    if (!phase) break;
    const days = [...phase.days]
      .filter((d): d is PlanDay & { weekday: number } => d.weekday != null)
      .sort(
        (a, b) =>
          offsetFromMonday(a.weekday) - offsetFromMonday(b.weekday) || a.orderIndex - b.orderIndex,
      );
    for (const day of days) {
      const date = localDateKey(addDays(monday, k * 7 + offsetFromMonday(day.weekday)));
      // Earlier this week is history: the calendar only ever plans ahead.
      if (date < input.today) continue;
      out.push({ date, day, startMinute: input.startMinute });
    }
  }
  return out;
};
