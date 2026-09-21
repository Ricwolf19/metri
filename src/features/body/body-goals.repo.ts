import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { bodyGoals, type BodyGoal, type BodyPhase, type TrainingLevel } from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { adjustCarbs } from './targets';

export type NewGoal = {
  phase: BodyPhase;
  startDate: string;
  startWeightKg: number;
  rateKgPerWeek: number;
  durationWeeks: number;
  checkinWeekday: number;
  trainingLevel: TrainingLevel | null;
  bodyFatPctAtStart: number | null;
  tdeeAtStart: number | null;
  targetKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

/** Live query for the running phase: newest row with no end. */
export const activeGoalQuery = (userId: string) =>
  db
    .select()
    .from(bodyGoals)
    .where(and(eq(bodyGoals.userId, userId), isNull(bodyGoals.endedAt)))
    .orderBy(desc(bodyGoals.startDate), desc(bodyGoals.createdAt))
    .limit(1);

/**
 * Start a phase. Whatever was running ends in the SAME transaction — there is
 * no unique index to lean on (see the schema note), so this is the only thing
 * keeping "one active phase" true.
 */
export const startGoal = (userId: string, input: NewGoal): BodyGoal => {
  const now = new Date();
  return db.transaction((tx) => {
    tx.update(bodyGoals)
      .set({ endedAt: now, updatedAt: now })
      .where(and(eq(bodyGoals.userId, userId), isNull(bodyGoals.endedAt)))
      .run();
    const [row] = tx
      .insert(bodyGoals)
      .values({ id: randomId(), userId, ...input, adjustments: [] })
      .returning()
      .all();
    return row;
  });
};

export const endGoal = (goalId: string): void => {
  const now = new Date();
  db.update(bodyGoals).set({ endedAt: now, updatedAt: now }).where(eq(bodyGoals.id, goalId)).run();
};

/**
 * Apply a calorie step to a running phase: carbs move, protein and fat do not,
 * and the step is logged on the row. The phase keeps its start point — an
 * adjustment corrects the plan, it does not restart the calendar.
 */
export const applyAdjustment = (goal: BodyGoal, date: string, kcalDelta: number): void => {
  const next = adjustCarbs({ kcal: goal.targetKcal, carbsG: goal.carbsG }, kcalDelta);
  db.update(bodyGoals)
    .set({
      targetKcal: next.kcal,
      carbsG: next.carbsG,
      adjustments: [...(goal.adjustments ?? []), { date, kcalDelta }],
      updatedAt: new Date(),
    })
    .where(eq(bodyGoals.id, goal.id))
    .run();
};
