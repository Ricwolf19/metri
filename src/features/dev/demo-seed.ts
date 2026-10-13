import { and, eq, inArray, isNull, like } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  bodyGoals,
  bodyMeasurements,
  bodyMetrics,
  exercises,
  foodLogs,
  routines,
  setLogs,
  trainingDays,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  type Equipment,
  type Meal,
} from '@/db/schema';
import { MEASUREMENT_SITES } from '@/features/body/sites';
import { FOODS } from '@/features/nutrition/foods.data';
import { markTrainingDay } from '@/features/training/adherence.repo';
import { localDateKey } from '@/features/training/dates';
import {
  abandonEnrollment,
  activeEnrollmentQuery,
  enrollInProgram,
  setEnrollmentPosition,
} from '@/features/training/enroll';
import { upsertExerciseSetting } from '@/features/training/exercise-settings.repo';
import { roundToPlate } from '@/features/training/progression';
import type { Locale } from '@/i18n';
import { randomId } from '@/lib/crypto';

/**
 * DEVELOPMENT ONLY — three months of plausible history for one user, so every
 * screen can be exercised with data that moves: an enrollment in Metri
 * Foundations with eleven finished weeks of sessions (loads rising, a few
 * splits skipped), the adherence marks, weekly weigh-ins and tape, a cut phase
 * and a daily food diary. Deterministic (a seeded generator), so two runs on
 * two phones look the same. Never reachable from a release build: the Profile
 * section that calls it renders under `__DEV__` only.
 */

const DAY_MS = 86_400_000;
const WEEKS = 12;
const PROGRAM_ID = 'metri-foundations';
const SESSION_HOUR = 18;

/** Tiny LCG: the data is pretend, the determinism is the point. */
const rng = (seed: number) => {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
};

/** A believable starting load per kind of equipment (kg), before 12 weeks of progress. */
const baseKg = (equipment: Equipment | null, category: string): number => {
  switch (equipment) {
    case 'barbell':
      return category === 'legs' || category === 'back' ? 60 : 40;
    case 'dumbbell':
    case 'kettlebell':
      return 12;
    case 'machine':
      return category === 'legs' ? 80 : 45;
    case 'cable':
      return 25;
    default:
      return 0;
  }
};

const dateAt = (daysAgo: number, hour = SESSION_HOUR): Date => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return new Date(d.getTime() - daysAgo * DAY_MS);
};

export type DemoSeedSummary = { sessions: number; skipped: number; days: number };

/** Refuses to run on top of an enrollment: wipe first (`wipeDemoData`). */
export const seedDemoData = (userId: string, locale: Locale): DemoSeedSummary | null => {
  if (activeEnrollmentQuery(userId).all().length) return null;
  const random = rng(42);

  /* ── Enrollment: every template day on Mon / Wed / Fri at 18:00 ───────── */
  const tplDays = db
    .select({ id: workoutDays.id, orderIndex: workoutDays.orderIndex })
    .from(workoutDays)
    .where(and(like(workoutDays.routineId, `${PROGRAM_ID}-%`), isNull(workoutDays.userProgramId)))
    .all();
  const weekdayFor = (orderIndex: number) => [2, 4, 6][(orderIndex - 1) % 3];
  const enrollment = enrollInProgram(
    userId,
    PROGRAM_ID,
    tplDays.map((d) => ({ dayId: d.id, weekday: weekdayFor(d.orderIndex), startMinute: 1080 })),
    locale,
  );
  const owned = db
    .select()
    .from(routines)
    .where(eq(routines.userProgramId, enrollment.id))
    .orderBy(routines.orderIndex)
    .all();
  const ownedDays = db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.userProgramId, enrollment.id))
    .all();
  const facts = new Map(
    db
      .select({ id: exercises.id, equipment: exercises.equipment, category: exercises.category })
      .from(exercises)
      .all()
      .map((e) => [e.id, e]),
  );

  /** Program week → routine + routine-relative week. */
  const position = (programWeek: number) => {
    let left = programWeek;
    for (const r of owned) {
      if (left <= r.durationWeeks) return { routine: r, week: left };
      left -= r.durationWeeks;
    }
    const last = owned[owned.length - 1];
    return { routine: last, week: last.durationWeeks };
  };

  /* ── Sessions: the last 11 weeks finished, this week in progress ──────── */
  let sessions = 0;
  let skipped = 0;
  const firstDay = WEEKS * 7;
  for (let daysAgo = firstDay; daysAgo >= 1; daysAgo--) {
    const programWeek = Math.floor((firstDay - daysAgo) / 7) + 1;
    if (programWeek >= WEEKS) break;
    const { routine, week } = position(programWeek);
    const at = dateAt(daysAgo);
    const weekday = at.getDay() + 1;
    const day = ownedDays.find((d) => d.routineId === routine.id && d.weekday === weekday);
    if (!day) continue;
    const date = localDateKey(at);

    if (random() < 0.08) {
      db.insert(workoutLogs)
        .values({
          id: randomId(),
          userId,
          userProgramId: enrollment.id,
          workoutDayId: day.id,
          weekNumber: week,
          status: 'skipped',
          startedAt: at,
          completedAt: at,
          durationSeconds: 0,
          plannedSnapshot: [],
        })
        .run();
      markTrainingDay(userId, {
        date,
        status: 'skipped',
        skipReason: 'busy',
        workoutDayId: day.id,
      });
      skipped++;
      continue;
    }

    const logId = randomId();
    const slots = db
      .select({ slot: workoutDayExercises, config: weekConfigs })
      .from(workoutDayExercises)
      .leftJoin(
        weekConfigs,
        and(
          eq(weekConfigs.workoutDayExerciseId, workoutDayExercises.id),
          eq(weekConfigs.weekNumber, week),
        ),
      )
      .where(eq(workoutDayExercises.workoutDayId, day.id))
      .orderBy(workoutDayExercises.orderIndex)
      .all();
    let clock = at.getTime() + 5 * 60_000;
    for (const { slot, config } of slots) {
      const fact = facts.get(slot.exerciseId);
      const base = baseKg(fact?.equipment ?? null, fact?.category ?? 'other');
      const progressed = base * (1 + 0.015 * programWeek) * (0.97 + random() * 0.06);
      const weightKg = base ? roundToPlate(progressed, 2.5) : 0;
      const sets = config?.sets ?? 3;
      const reps = config?.reps ?? 10;
      for (let n = 1; n <= sets; n++) {
        db.insert(setLogs)
          .values({
            id: randomId(),
            workoutLogId: logId,
            exerciseId: slot.exerciseId,
            setNumber: n,
            weightKg,
            reps: n === sets && random() < 0.4 ? Math.max(1, reps - 1) : reps,
            rir: config?.toFailure ? null : 2,
            isFailure: !!config?.toFailure && n === sets,
            isWarmup: false,
            createdAt: new Date(clock),
          })
          .run();
        clock += (slot.defaultRestSeconds ?? 120) * 1000 + 40_000;
      }
    }
    const completedAt = new Date(clock);
    db.insert(workoutLogs)
      .values({
        id: logId,
        userId,
        userProgramId: enrollment.id,
        workoutDayId: day.id,
        weekNumber: week,
        status: 'completed',
        startedAt: at,
        completedAt,
        durationSeconds: Math.round((completedAt.getTime() - at.getTime()) / 1000),
        warmupDone: random() < 0.8,
        plannedSnapshot: [],
      })
      .run();
    markTrainingDay(userId, { date, status: 'trained', workoutLogId: logId, workoutDayId: day.id });
    sessions++;
  }
  const now = position(WEEKS);
  setEnrollmentPosition(enrollment.id, now.routine.id, now.week);

  /* ── A load config, so the sheet and the breakdown have something saved ── */
  upsertExerciseSetting(userId, 'barbell-bench-press', {
    load: { kind: 'barbell', barKg: 20, platesKg: [20, 2.5] },
  });

  /* ── Body: weekly weigh-ins trending down, tape, a cut phase ──────────── */
  const startWeight = 82;
  for (let w = WEEKS; w >= 0; w--) {
    const d = dateAt(w * 7, 8);
    const date = localDateKey(d);
    const weightKg =
      Math.round((startWeight - (WEEKS - w) * 0.35 + (random() - 0.5) * 0.6) * 10) / 10;
    db.insert(bodyMetrics)
      .values({
        id: randomId(),
        userId,
        date,
        weightKg,
        bodyFatPct: Math.round((20 - (WEEKS - w) * 0.25) * 10) / 10,
      })
      .onConflictDoNothing()
      .run();
    const waist = 92 - (WEEKS - w) * 0.3;
    for (const site of MEASUREMENT_SITES.filter((s) => s.set === 'core').slice(0, 3)) {
      const valueCm = site.id === 'waist' ? waist : site.id === 'hips' ? 98 : 101;
      db.insert(bodyMeasurements)
        .values({
          id: randomId(),
          userId,
          date,
          site: site.id,
          valueCm: Math.round(valueCm * 10) / 10,
        })
        .onConflictDoNothing()
        .run();
    }
  }
  db.insert(bodyGoals)
    .values({
      id: randomId(),
      userId,
      phase: 'cut',
      startDate: localDateKey(dateAt(WEEKS * 7, 8)),
      startWeightKg: startWeight,
      rateKgPerWeek: -0.35,
      durationWeeks: 16,
      checkinWeekday: 2,
      trainingLevel: 'beginner',
      bodyFatPctAtStart: 20,
      tdeeAtStart: 2700,
      targetKcal: 2300,
      proteinG: 170,
      fatG: 70,
      carbsG: 230,
      adjustments: [],
    })
    .run();

  /* ── Food diary: four meals a day from the catalogue ──────────────────── */
  const picks: Record<Meal, { index: number; grams: number }[]> = {
    breakfast: [
      { index: 1, grams: 80 },
      { index: 2, grams: 200 },
    ],
    lunch: [
      { index: 0, grams: 150 },
      { index: 3, grams: 180 },
    ],
    dinner: [
      { index: 4, grams: 200 },
      { index: 5, grams: 150 },
    ],
    snack: [{ index: 6, grams: 120 }],
  };
  let days = 0;
  for (let daysAgo = WEEKS * 7; daysAgo >= 0; daysAgo--) {
    if (random() < 0.12) continue;
    const date = localDateKey(dateAt(daysAgo, 12));
    for (const meal of Object.keys(picks) as Meal[]) {
      for (const { index, grams } of picks[meal]) {
        const food = FOODS[index % FOODS.length];
        const g = grams * (0.85 + random() * 0.3);
        const f = g / 100;
        db.insert(foodLogs)
          .values({
            id: randomId(),
            userId,
            date,
            meal,
            foodId: food.id,
            name: locale === 'es' ? food.es : food.en,
            grams: Math.round(g),
            kcal: Math.round(food.kcal * f),
            proteinG: Math.round(food.proteinG * f * 10) / 10,
            carbsG: Math.round(food.carbsG * f * 10) / 10,
            fatG: Math.round(food.fatG * f * 10) / 10,
            fiberG: Math.round(food.fiberG * f * 10) / 10,
          })
          .run();
      }
    }
    days++;
  }

  return { sessions, skipped, days };
};

/** DEVELOPMENT ONLY — everything the seeder writes, gone (plus any real rows of the same kinds). */
export const wipeDemoData = (userId: string): void => {
  for (const e of activeEnrollmentQuery(userId).all()) abandonEnrollment(e.id);
  const logIds = db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, userId))
    .all()
    .map((r) => r.id);
  if (logIds.length) db.delete(setLogs).where(inArray(setLogs.workoutLogId, logIds)).run();
  db.delete(workoutLogs).where(eq(workoutLogs.userId, userId)).run();
  db.delete(trainingDays).where(eq(trainingDays.userId, userId)).run();
  db.delete(bodyMetrics).where(eq(bodyMetrics.userId, userId)).run();
  db.delete(bodyMeasurements).where(eq(bodyMeasurements.userId, userId)).run();
  db.delete(bodyGoals).where(eq(bodyGoals.userId, userId)).run();
  db.delete(foodLogs).where(eq(foodLogs.userId, userId)).run();
  db.delete(userPrograms).where(eq(userPrograms.userId, userId)).run();
};
