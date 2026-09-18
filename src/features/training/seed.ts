import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  appMeta,
  exercises,
  programs,
  routines,
  setLogs,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';

import { EXERCISE_SEEDS } from './exercises.seed';
import { PROGRAM_SEEDS, type ProgramSeed } from './programs';

/**
 * Seed the global exercise library and the built-in program templates.
 *
 * Runs INSIDE the app (the SQLite DB lives on the device) and is idempotent: a
 * version flag in `app_meta` short-circuits re-runs, and every insert uses
 * deterministic ids + conflict handling, so bumping `SEED_VERSION` safely
 * migrates existing installs without duplicating rows.
 *
 * All seeded rows are TEMPLATES (`userProgramId` null, `userId` null).
 * Enrolling deep-copies them into user-owned rows.
 */
const SEED_KEY = 'training_seed_version';
const SEED_VERSION = '4';

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

/**
 * v4: the catalog was re-curated. Old built-ins that survive get their
 * fields refreshed in place (same id → history keeps meaning). Old built-ins
 * NOT in the new catalog stop being built-in: rows referenced by any program
 * slot or logged set are DEMOTED to that user's custom exercise (they keep
 * working and start syncing as the user's own); unreferenced rows are deleted.
 */
const migrateLegacyExercises = (): void => {
  const keepIds = EXERCISE_SEEDS.map((e) => e.id);
  const legacy = db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.isCustom, false), notInArray(exercises.id, keepIds)))
    .all()
    .map((r) => r.id);
  if (!legacy.length) return;

  for (const id of legacy) {
    const [slotRef] = db
      .select({ userProgramId: workoutDayExercises.userProgramId })
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.exerciseId, id))
      .limit(1)
      .all();
    const [logRef] = db
      .select({ id: setLogs.id, workoutLogId: setLogs.workoutLogId })
      .from(setLogs)
      .where(eq(setLogs.exerciseId, id))
      .limit(1)
      .all();

    if (!slotRef && !logRef) {
      db.delete(exercises).where(eq(exercises.id, id)).run();
      continue;
    }
    // Owner of the referencing data. Slots on custom/enrolled trees and set
    // logs both trace to a user; a single-user device makes this exact, and on
    // a multi-user device the first referencing user adopts it (edge accepted).
    const ownerId = findReferencingUser(id);
    db.update(exercises)
      .set({ isCustom: true, userId: ownerId, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .run();
  }
};

/** First user whose data references the exercise (set logs win — most direct). */
const findReferencingUser = (exerciseId: string): string | null => {
  const [viaLog] = db
    .select({ userId: workoutLogs.userId })
    .from(setLogs)
    .innerJoin(workoutLogs, eq(workoutLogs.id, setLogs.workoutLogId))
    .where(eq(setLogs.exerciseId, exerciseId))
    .limit(1)
    .all();
  if (viaLog) return viaLog.userId;

  // Enrolled-copy slots carry the enrollment; walk it to its owner.
  const [viaEnrolled] = db
    .select({ userId: userPrograms.userId })
    .from(workoutDayExercises)
    .innerJoin(userPrograms, eq(userPrograms.id, workoutDayExercises.userProgramId))
    .where(eq(workoutDayExercises.exerciseId, exerciseId))
    .limit(1)
    .all();
  if (viaEnrolled) return viaEnrolled.userId;

  // Custom-authored template slots: day → routine → program → creator.
  const [viaCustom] = db
    .select({ userId: programs.userId })
    .from(workoutDayExercises)
    .innerJoin(workoutDays, eq(workoutDays.id, workoutDayExercises.workoutDayId))
    .innerJoin(routines, eq(routines.id, workoutDays.routineId))
    .innerJoin(programs, eq(programs.id, routines.programId))
    .where(eq(workoutDayExercises.exerciseId, exerciseId))
    .limit(1)
    .all();
  return viaCustom?.userId ?? null;
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
        imageUrl: null,
        isCustom: false,
      })
      .onConflictDoUpdate({
        target: exercises.id,
        // Refresh catalog fields on reused ids; never touch custom rows (their
        // ids are random, they can't collide with seed ids).
        set: {
          name: ex.name,
          category: ex.category,
          primaryMuscles: ex.primaryMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          equipment: ex.equipment,
          isCustom: false,
          updatedAt: new Date(),
        },
      })
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
        durationWeeks: 4,
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
        // Index-prefixed: a day may legitimately repeat a base exercise (variants).
        const slotId = `${dayId}-${slotIndex + 1}-${slot.exerciseId}`;
        db.insert(workoutDayExercises)
          .values({
            id: slotId,
            workoutDayId: dayId,
            exerciseId: slot.exerciseId,
            orderIndex: slotIndex + 1,
            defaultRestSeconds: slot.restSeconds,
            notes: slot.notes ?? null,
            badges: slot.badges ?? null,
            alternativeExerciseIds: slot.alternativeExerciseIds ?? null,
          })
          .onConflictDoNothing()
          .run();

        slot.weeks.forEach((week, weekIndex) => {
          const weekNumber = weekIndex + 1;
          db.insert(weekConfigs)
            .values({
              id: `${slotId}-w${weekNumber}`,
              workoutDayExerciseId: slotId,
              weekNumber,
              sets: week.sets,
              reps: week.reps,
              repsMax: week.repsMax ?? null,
              rirMin: week.rirMin ?? null,
              rirMax: week.rirMax ?? null,
              toFailure: week.toFailure ?? false,
              restSeconds: week.restSeconds,
              intensityType: 'rir',
              setGroups: week.setGroups ?? null,
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
  migrateLegacyExercises();
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
