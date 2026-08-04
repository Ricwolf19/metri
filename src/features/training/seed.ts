import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  appMeta,
  exercises,
  programs,
  routines,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
} from '@/db/schema';

import { EXERCISE_SEEDS } from './exercises.seed';
import { PROGRAM_SEEDS, WEEK_PROGRESSION, type ProgramSeed } from './programs';

/**
 * Seed the global exercise library and the built-in program templates.
 *
 * Like `seedAdmin`, this runs INSIDE the app (the SQLite DB lives on the device)
 * and is idempotent: a version flag in `app_meta` short-circuits re-runs, and
 * every insert uses deterministic ids + `onConflictDoNothing`, so bumping
 * `SEED_VERSION` safely back-fills new rows without duplicating existing ones.
 *
 * All seeded rows are TEMPLATES (`userProgramId` is null). Enrolling deep-copies
 * them into user-owned rows — that lives in the Phase-2 workout engine.
 */
const SEED_KEY = 'training_seed_version';
const SEED_VERSION = '3';

const alreadySeeded = (): boolean => {
  const [row] = db.select().from(appMeta).where(eq(appMeta.key, SEED_KEY)).all();
  return row?.value === SEED_VERSION;
};

/** Template programs shipped by older versions — v3 retired them (all-custom).
 * Only TEMPLATE rows die (`user_program_id IS NULL`); a user's enrolled copies
 * are user-owned rows and survive untouched. */
const RETIRED_PROGRAM_IDS = ['pb-2-0', 'ul-4', 'fb-3'];

const cleanupRetiredTemplates = (): void => {
  const routineIds = db
    .select({ id: routines.id })
    .from(routines)
    .where(and(inArray(routines.programId, RETIRED_PROGRAM_IDS), isNull(routines.userProgramId)))
    .all()
    .map((r) => r.id);
  if (routineIds.length) {
    const dayIds = db
      .select({ id: workoutDays.id })
      .from(workoutDays)
      .where(and(inArray(workoutDays.routineId, routineIds), isNull(workoutDays.userProgramId)))
      .all()
      .map((d) => d.id);
    if (dayIds.length) {
      const slotIds = db
        .select({ id: workoutDayExercises.id })
        .from(workoutDayExercises)
        .where(
          and(
            inArray(workoutDayExercises.workoutDayId, dayIds),
            isNull(workoutDayExercises.userProgramId),
          ),
        )
        .all()
        .map((sl) => sl.id);
      if (slotIds.length) {
        db.delete(weekConfigs).where(inArray(weekConfigs.workoutDayExerciseId, slotIds)).run();
        db.delete(workoutDayExercises).where(inArray(workoutDayExercises.id, slotIds)).run();
      }
      db.delete(workoutDays).where(inArray(workoutDays.id, dayIds)).run();
    }
    db.delete(routines).where(inArray(routines.id, routineIds)).run();
  }
  db.delete(programs)
    .where(and(inArray(programs.id, RETIRED_PROGRAM_IDS), isNull(programs.userProgramId)))
    .run();
};

const seedExercises = (): void => {
  for (const ex of EXERCISE_SEEDS) {
    db.insert(exercises)
      .values({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        instructions: ex.instructions,
        imageUrl: null,
        isCustom: false,
      })
      .onConflictDoNothing()
      .run();
  }
};

const seedProgram = (p: ProgramSeed): void => {
  db.insert(programs)
    .values({
      id: p.id,
      name: p.name,
      description: p.description,
      durationWeeks: p.durationWeeks,
      difficulty: p.difficulty,
      goal: p.goal,
      isCustom: false,
    })
    .onConflictDoNothing()
    .run();

  for (const routine of p.routines) {
    const routineId = `${p.id}-${routine.slug}`;
    db.insert(routines)
      .values({
        id: routineId,
        programId: p.id,
        name: routine.name,
        orderIndex: routine.orderIndex,
        durationWeeks: WEEK_PROGRESSION.length,
      })
      .onConflictDoNothing()
      .run();

    routine.days.forEach((day, dayIndex) => {
      const dayId = `${routineId}-${day.slug}`;
      db.insert(workoutDays)
        .values({
          id: dayId,
          routineId,
          name: day.name,
          focusMuscles: day.focusMuscles,
          orderIndex: dayIndex + 1,
        })
        .onConflictDoNothing()
        .run();

      day.exercises.forEach((slot, slotIndex) => {
        const slotId = `${dayId}-${slot.exerciseId}`;
        db.insert(workoutDayExercises)
          .values({
            id: slotId,
            workoutDayId: dayId,
            exerciseId: slot.exerciseId,
            orderIndex: slotIndex + 1,
            defaultRestSeconds: slot.restSeconds,
            notes: slot.notes ?? null,
            badges: slot.badges ?? null,
          })
          .onConflictDoNothing()
          .run();

        WEEK_PROGRESSION.forEach((step, weekIndex) => {
          const weekNumber = weekIndex + 1;
          db.insert(weekConfigs)
            .values({
              id: `${slotId}-w${weekNumber}`,
              workoutDayExerciseId: slotId,
              weekNumber,
              sets: slot.sets,
              reps: slot.reps,
              repsMax: slot.repsMax ?? null,
              rirMin: step.rirMin,
              rirMax: step.rirMax,
              toFailure: step.toFailure,
              restSeconds: slot.restSeconds,
              intensityType: step.intensityType,
            })
            .onConflictDoNothing()
            .run();
        });
      });
    });
  }
};

export const seedTraining = async (): Promise<void> => {
  if (alreadySeeded()) return;

  cleanupRetiredTemplates();
  seedExercises();
  for (const program of PROGRAM_SEEDS) seedProgram(program);

  db.insert(appMeta)
    .values({ key: SEED_KEY, value: SEED_VERSION })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: SEED_VERSION, updatedAt: new Date() },
    })
    .run();
};
