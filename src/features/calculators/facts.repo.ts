import { and, desc, eq, gt } from 'drizzle-orm';

import { db } from '@/db/client';
import { bodyMetrics, calculationHistory, type PublicUser } from '@/db/schema';
import { activeGoalQuery } from '@/features/body/body-goals.repo';
import { latestTapeCm } from '@/features/body/body-measurements.repo';

import { buildCalcFacts, type LogFacts, type SavedCalc } from './facts';
import type { CalcFacts } from './prefill';
import { type CalcConfig, type CalcId, fieldInUse } from './types';

/** Enough recent kept runs to find the last of each calculator. */
const SAVED_LIMIT = 50;

/** The newest positive value of one `body_metrics` column, by day. */
const newestMetric = (
  userId: string,
  column: typeof bodyMetrics.weightKg | typeof bodyMetrics.bodyFatPct,
): number | null =>
  db
    .select({ value: column })
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), gt(column, 0)))
    .orderBy(desc(bodyMetrics.date))
    .limit(1)
    .all()[0]?.value ?? null;

/** The newest weigh-in, body-fat reading and tape, and the running phase. */
const latestBodyLogs = (userId: string): LogFacts => {
  const tape = latestTapeCm(userId);
  const goal = activeGoalQuery(userId).all()[0];
  return {
    weightKg: newestMetric(userId, bodyMetrics.weightKg),
    bodyFatPct: newestMetric(userId, bodyMetrics.bodyFatPct),
    tape: { waist: tape.waist, neck: tape.neck, hips: tape.hips },
    goal: goal
      ? {
          phase: goal.phase,
          startWeightKg: goal.startWeightKg,
          rateKgPerWeek: goal.rateKgPerWeek,
          durationWeeks: goal.durationWeeks,
          tdeeAtStart: goal.tdeeAtStart,
        }
      : null,
  };
};

/**
 * A kept run's inputs minus the ones its own formula ignored: a TDEE kept on
 * Mifflin still stores the (disabled) body-fat field, and reading that back
 * would seed every other calculator with a number nobody measured. A field
 * whose gate is missing from the inputs (a check-in's tape run carries no
 * `sex` for a profile without one) is kept.
 */
const inputsInUse = (config: CalcConfig | undefined, inputs: unknown): unknown =>
  typeof inputs === 'object' && inputs !== null
    ? Object.fromEntries(
        Object.entries(inputs).filter(([name]) => {
          const field = config?.fields.find((f) => f.name === name);
          return (
            !field?.usedWhen ||
            !(field.usedWhen.field in inputs) ||
            fieldInUse(field, inputs as Record<string, number | string>)
          );
        }),
      )
    : inputs;

const keptCalculations = (
  userId: string,
  configs: Partial<Record<CalcId, CalcConfig>>,
): SavedCalc[] =>
  db
    .select()
    .from(calculationHistory)
    .where(eq(calculationHistory.userId, userId))
    .orderBy(desc(calculationHistory.createdAt))
    .limit(SAVED_LIMIT)
    .all()
    .map((row) => ({
      calcId: row.calcId,
      inputs: inputsInUse(configs[row.calcId as CalcId], row.inputs),
      createdAt: row.createdAt,
    }));

/** Everything this phone knows that can seed a calculator (`buildCalcFacts`
 * sets the precedence). Synchronous SQLite reads, so a calculator opens on
 * the lifter's numbers in its first frame. */
export const readCalcFacts = (
  user: PublicUser,
  configs: Partial<Record<CalcId, CalcConfig>>,
): CalcFacts =>
  buildCalcFacts({
    profile: user,
    logs: latestBodyLogs(user.id),
    saved: keptCalculations(user.id, configs),
    now: new Date(),
  });
