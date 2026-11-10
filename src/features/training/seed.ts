import { and, asc, eq, gte, inArray, isNotNull, isNull, notInArray } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  appMeta,
  exerciseSettings,
  exercises,
  programs,
  routines,
  setLogs,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  warmupRoutines,
  type SetGroup,
} from '@/db/schema';
import type { Locale } from '@/i18n';
import { randomId } from '@/lib/crypto';

import { deleteRoutine } from './authoring.repo';
import { copyTemplateRoutines, refreshTrainingWeekdays } from './enroll';
import { EXERCISE_SEEDS } from './exercises.seed';
import { PROGRAM_SEEDS, type ProgramSeed } from './programs';
import { badgeLabel } from './programs/badge-copy';
import { warmupSeeds } from './warmup-content';

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
 *
 * v5 rewrites catalog muscle values onto the canonical `MuscleHead` vocabulary
 * (`quadriceps`→`quads`, `core`→`abs`). `seedExercises` refreshes those columns
 * on conflict, so the bump alone migrates existing installs — no id changes.
 *
 * v6 adds the shipped warm-up and mobility routines.
 *
 * v7 adds `cable-crunch`, `standing-leg-curl` and `seated-barbell-press`, and
 * Metri Foundations prescribes them. Template slot ids embed the exercise id,
 * so `seedProgram` prunes template slots the seed no longer lists and
 * refreshes the meta of the ones it keeps. Enrolled copies are user rows and
 * keep whatever they were enrolled with.
 *
 * v8 upserts template week configs too (they used to be insert-only, so a
 * prescription edit never reached an existing install). Editing a preset's
 * prescription or slot meta needs a bump to land.
 *
 * v9 adds `unilateral` to the catalog (per-side logging); the upsert below is
 * what flips it on existing installs.
 *
 * v10 adds equipment variants (one row per kit, grouped in `variants.ts`).
 *
 * v11 drops the "O similar" cue from Metri Foundations (the swap arrows carry
 * that meaning) and renames the overhead dumbbell extension so it reads as
 * the dumbbell French press it is. Enrolled copies keep their badges; a
 * custom migration strips the retired cue from them (see `session-badges.ts`
 * for the open-snapshot side).
 *
 * v12 reshapes Foundations phase 3 into three fixed sessions a week like the
 * other phases: two 2-week routines (A·B·A, then B·A·B) replace the 2-split
 * `r3`, whose TEMPLATE rows are retired here; routines may now declare their
 * own `durationWeeks`. Enrolled copies of the old phase are user rows and stay.
 *
 * v13 marks the RM-test week on the presets (`routines.rm_test_week`): the
 * routine upsert now refreshes that ONE column on template rows, so the flag
 * reaches existing installs; names and descriptions still never move.
 *
 * v14 corrects the presets against the source PDFs: the French press family
 * splits into lying (`skullcrusher`, new `barbell-skullcrusher`) and overhead
 * (`overhead-tricep-extension`, `cable-overhead-extension`, `french-press`),
 * Foundations phase 1 trains the lying dumbbell press, Progression's incline
 * is the dumbbell exercise (no badge) and its paused seated press the barbell.
 *
 * v15 carries that fix into ENROLLED Foundations copies (`correctFoundationsFrenchPress`):
 * phase 1 enrolled before v14 still planned the seated one-dumbbell press.
 * v17 re-reads both presets against their sheets (PB1 → Foundations, PB2 →
 * Progression): new catalog exercises for the grips and the machines the
 * sheets draw, 2-minute rests where Foundations had 90 s, phase 3 week by
 * week, and the enrolled copies, history included, carried along
 * (`correctEnrolledCopies`).
 */
const SEED_KEY = 'training_seed_version';
const SEED_VERSION = '17';

const alreadySeeded = (): boolean => {
  const [row] = db.select().from(appMeta).where(eq(appMeta.key, SEED_KEY)).all();
  return row?.value === SEED_VERSION;
};

/** Template programs shipped by older versions — v3 retired them (all-custom).
 * Only TEMPLATE rows die (`user_program_id IS NULL`); a user's enrolled copies
 * are user-owned rows and survive untouched. */
const RETIRED_PROGRAM_IDS = ['pb-2-0', 'ul-4', 'fb-3'];
/** Template routines a preset no longer lists (v12: Foundations' 2-split phase 3). Never reuse an id. */
const RETIRED_ROUTINE_IDS = [
  'metri-foundations-r3',
  // v17: phase 3 became four 1-week routines (r3w1…r3w4).
  'metri-foundations-r3a',
  'metri-foundations-r3b',
];

/** Delete the TEMPLATE tree under these routine ids (days, slots, week configs, the routines). */
const retireTemplateRoutines = (routineIds: string[]): void => {
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
    db.delete(routines)
      .where(and(inArray(routines.id, routineIds), isNull(routines.userProgramId)))
      .run();
  }
};

const cleanupRetiredTemplates = (): void => {
  retireTemplateRoutines(
    db
      .select({ id: routines.id })
      .from(routines)
      .where(and(inArray(routines.programId, RETIRED_PROGRAM_IDS), isNull(routines.userProgramId)))
      .all()
      .map((r) => r.id),
  );
  db.delete(programs)
    .where(and(inArray(programs.id, RETIRED_PROGRAM_IDS), isNull(programs.userProgramId)))
    .run();
  retireTemplateRoutines(RETIRED_ROUTINE_IDS);
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
        unilateral: ex.unilateral ?? false,
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
          unilateral: ex.unilateral ?? false,
          isCustom: false,
          // A legacy id demoted to a custom row (v4) and shipped again later
          // (v10) comes back as catalog: the owner it was handed to must go too.
          userId: null,
          updatedAt: new Date(),
        },
      })
      .run();
  }
};

/** Drop a template day's slots the seed no longer lists (and their week configs). */
const pruneTemplateSlots = (dayIds: string[], keep: string[]): void => {
  if (!dayIds.length) return;
  const stale = db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(
      and(
        inArray(workoutDayExercises.workoutDayId, dayIds),
        isNull(workoutDayExercises.userProgramId),
        notInArray(workoutDayExercises.id, keep),
      ),
    )
    .all()
    .map((r) => r.id);
  if (!stale.length) return;
  db.delete(weekConfigs).where(inArray(weekConfigs.workoutDayExerciseId, stale)).run();
  db.delete(workoutDayExercises).where(inArray(workoutDayExercises.id, stale)).run();
};

const seedProgram = (p: ProgramSeed): void => {
  const seededDayIds: string[] = [];
  const seededSlotIds: string[] = [];
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
        durationWeeks: routine.durationWeeks ?? 4,
        rmTestWeek: routine.rmTestWeek ?? null,
      })
      .onConflictDoUpdate({
        target: routines.id,
        // Only the test-week flag follows the preset; names and durations stay
        // as the install has them (an enrolled copy never carries a seed id).
        set: { rmTestWeek: routine.rmTestWeek ?? null },
        setWhere: isNull(routines.userProgramId),
      })
      .run();

    routine.days.forEach((day, dayIndex) => {
      const dayId = `${routineId}-${day.slug}`;
      seededDayIds.push(dayId);
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
        seededSlotIds.push(slotId);
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
          .onConflictDoUpdate({
            target: workoutDayExercises.id,
            // Template rows only (ids are deterministic seed ids): copy edits land.
            set: {
              orderIndex: slotIndex + 1,
              defaultRestSeconds: slot.restSeconds,
              notes: slot.notes ?? null,
              badges: slot.badges ?? null,
              alternativeExerciseIds: slot.alternativeExerciseIds ?? null,
            },
          })
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
            .onConflictDoUpdate({
              target: weekConfigs.id,
              // Prescription edits land like slot meta does. The deterministic id
              // is template-only, and the guard keeps an enrolled copy out even
              // if one ever carried it.
              set: {
                sets: week.sets,
                reps: week.reps,
                repsMax: week.repsMax ?? null,
                rirMin: week.rirMin ?? null,
                rirMax: week.rirMax ?? null,
                toFailure: week.toFailure ?? false,
                restSeconds: week.restSeconds,
                setGroups: week.setGroups ?? null,
              },
              setWhere: isNull(weekConfigs.userProgramId),
            })
            .run();
        });
      });
    });
  }
  pruneTemplateSlots(seededDayIds, seededSlotIds);
};

/** Shipped warm-up / mobility routines. Upsert: copy edits land on re-seed,
 * and a user's own routines (`is_custom`) are never touched. */
const seedWarmups = (): void => {
  for (const seed of warmupSeeds()) {
    db.insert(warmupRoutines)
      .values({
        id: seed.id,
        userId: null,
        kind: seed.kind,
        name: seed.name,
        description: seed.description,
        steps: seed.steps,
        orderIndex: seed.orderIndex,
        isCustom: false,
      })
      .onConflictDoUpdate({
        target: warmupRoutines.id,
        set: {
          name: seed.name,
          description: seed.description,
          steps: seed.steps,
          orderIndex: seed.orderIndex,
          updatedAt: new Date(),
        },
      })
      .run();
  }
};

/**
 * v15: Foundations phase 1 plans the LYING two-dumbbell French press
 * (`skullcrusher`); copies enrolled before v14 still plan the seated
 * one-dumbbell press there. Their slot moves to the lying press and keeps the
 * seated one among its alternatives, so it is one swap away. A slot whose
 * alternatives already hold the lying press is a lifter's choice (a "rest of
 * the cycle" swap writes the planned exercise there) and is left alone.
 * `updatedAt` is stamped so sync carries the fix.
 */
const correctFoundationsFrenchPress = (): void => {
  const dayIds = db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .innerJoin(routines, eq(routines.id, workoutDays.routineId))
    .where(
      and(
        eq(routines.programId, 'metri-foundations'),
        eq(routines.orderIndex, 1),
        isNotNull(routines.userProgramId),
      ),
    )
    .all()
    .map((d) => d.id);
  if (!dayIds.length) return;
  const slots = db
    .select()
    .from(workoutDayExercises)
    .where(
      and(
        inArray(workoutDayExercises.workoutDayId, dayIds),
        eq(workoutDayExercises.exerciseId, 'overhead-tricep-extension'),
      ),
    )
    .all();
  const now = new Date();
  for (const slot of slots) {
    const alternatives = slot.alternativeExerciseIds ?? [];
    if (alternatives.includes('skullcrusher')) continue;
    db.update(workoutDayExercises)
      .set({
        exerciseId: 'skullcrusher',
        alternativeExerciseIds: [...alternatives, 'overhead-tricep-extension'],
        updatedAt: now,
      })
      .where(eq(workoutDayExercises.id, slot.id))
      .run();
  }
};

const FOUNDATIONS = 'metri-foundations';
const PROGRESSION = 'metri-progression';

/** Enrolled slots of a preset, with the day each sits on (routine orderIndex filter optional). */
const enrolledSlots = (programId: string, routineOrders?: number[]) =>
  db
    .select({ slot: workoutDayExercises, routineOrder: routines.orderIndex })
    .from(workoutDayExercises)
    .innerJoin(workoutDays, eq(workoutDays.id, workoutDayExercises.workoutDayId))
    .innerJoin(routines, eq(routines.id, workoutDays.routineId))
    .where(
      and(
        eq(routines.programId, programId),
        isNotNull(routines.userProgramId),
        routineOrders ? inArray(routines.orderIndex, routineOrders) : undefined,
      ),
    )
    .orderBy(asc(workoutDayExercises.orderIndex))
    .all();

/**
 * Slots the old seed planned on the wrong exercise: a grip told apart only by
 * a cue (the cue goes; the grip is the exercise now), or kit the sheet does
 * not draw. `dayHas` tells Side A from Side B where the phase holds both.
 */
type SlotFix = {
  programId: string;
  routines?: number[];
  from: string;
  badge?: string;
  dayHas?: string;
  to: string;
};
const SLOT_FIXES: SlotFix[] = [
  {
    programId: FOUNDATIONS,
    from: 'lat-pulldown',
    badge: 'Agarre supino',
    to: 'supinated-lat-pulldown',
  },
  {
    programId: FOUNDATIONS,
    from: 'lat-pulldown',
    badge: 'Agarre estrecho',
    to: 'close-grip-lat-pulldown',
  },
  {
    programId: FOUNDATIONS,
    from: 'lat-pulldown',
    badge: 'Agarre ancho',
    to: 'wide-grip-lat-pulldown',
  },
  {
    programId: FOUNDATIONS,
    routines: [3, 4],
    from: 'cable-crunch',
    dayHas: 'barbell-bench-press',
    to: 'machine-crunch',
  },
  { programId: FOUNDATIONS, routines: [3, 4], from: 'dumbbell-fly', to: 'machine-fly' },
  {
    programId: PROGRESSION,
    from: 'lat-pulldown',
    badge: 'Agarre supino',
    to: 'supinated-lat-pulldown',
  },
  { programId: PROGRESSION, from: 'hammer-curl', badge: 'Polea', to: 'cable-hammer-curl' },
  { programId: PROGRESSION, routines: [1], from: 'dumbbell-fly', to: 'machine-fly' },
  { programId: PROGRESSION, from: 'pullover', to: 'cable-pullover' },
  { programId: PROGRESSION, routines: [1, 2], from: 'spider-curl', to: 'barbell-spider-curl' },
  { programId: PROGRESSION, routines: [1, 2], from: 'rear-delt-fly', to: 'machine-rear-delt-fly' },
];

/** Stored cues are either language's spelling; compare on the Spanish one the seed writes. */
const sameCue = (badge: string, cue: string): boolean => badgeLabel(badge, 'es') === cue;

const applySlotFixes = (now: Date): void => {
  for (const fix of SLOT_FIXES) {
    const rows = enrolledSlots(fix.programId, fix.routines);
    for (const { slot } of rows) {
      if (slot.exerciseId !== fix.from) continue;
      const badges = slot.badges ?? [];
      if (fix.badge && !badges.some((b) => sameCue(b, fix.badge!))) continue;
      if (
        fix.dayHas &&
        !rows.some(
          (r) => r.slot.workoutDayId === slot.workoutDayId && r.slot.exerciseId === fix.dayHas,
        )
      )
        continue;
      const kept = fix.badge ? badges.filter((b) => !sameCue(b, fix.badge!)) : badges;
      db.update(workoutDayExercises)
        .set({ exerciseId: fix.to, badges: kept.length ? kept : null, updatedAt: now })
        .where(eq(workoutDayExercises.id, slot.id))
        .run();
    }
  }
};

/**
 * Foundations phase 2 Side B plans two abdominal rows: the sheet draws a
 * decline-bench sit-up, then the kneeling cable crunch. Older seeds planned
 * one exercise twice, and sets are counted per exercise, so the second copy
 * always read as the first one's sets.
 */
const correctSideBAbs = (now: Date): void => {
  const abs = enrolledSlots(FOUNDATIONS, [2]).filter((r) =>
    ['crunch', 'cable-crunch'].includes(r.slot.exerciseId),
  );
  const days = new Set(abs.map((r) => r.slot.workoutDayId));
  for (const dayId of days) {
    const [first, second] = abs.filter((r) => r.slot.workoutDayId === dayId).map((r) => r.slot);
    if (!first || !second || first.exerciseId !== second.exerciseId) continue;
    const set = (id: string, exerciseId: string) =>
      db
        .update(workoutDayExercises)
        .set({ exerciseId, updatedAt: now })
        .where(eq(workoutDayExercises.id, id))
        .run();
    set(first.id, 'decline-sit-up');
    if (second.exerciseId !== 'cable-crunch') set(second.id, 'cable-crunch');
  }
};

/** The sheets rest 2 to 3 minutes on every exercise: Foundations' old 90 s light band goes to 2. */
const correctFoundationsRest = (now: Date): void => {
  const rows = enrolledSlots(FOUNDATIONS);
  for (const { slot } of rows) {
    if (slot.defaultRestSeconds === 90)
      db.update(workoutDayExercises)
        .set({ defaultRestSeconds: 120, updatedAt: now })
        .where(eq(workoutDayExercises.id, slot.id))
        .run();
  }
  const ids = rows.map((r) => r.slot.id);
  if (ids.length)
    db.update(weekConfigs)
      .set({ restSeconds: 120, updatedAt: now })
      .where(and(inArray(weekConfigs.workoutDayExerciseId, ids), eq(weekConfigs.restSeconds, 90)))
      .run();
};

/**
 * Progression: the sheets print no length for three pauses (only phase 2's
 * bench says 2 s), and phase 2's seated press peaks at "1X6 FALLO 2X8 RIR3".
 * A week row moves only while it still holds what the old seed wrote.
 */
const OLD_P2_PRESS_PEAK: SetGroup[] = [
  { sets: 1, reps: 6, rirMin: 0, rirMax: 0 },
  { sets: 2, reps: 6, rirMin: 3, rirMax: 4 },
];
const P2_PRESS_PEAK: SetGroup[] = [
  { sets: 1, reps: 6, toFailure: true },
  { sets: 2, reps: 8, rirMin: 3, rirMax: 3 },
];
const correctProgressionCopies = (now: Date): void => {
  for (const { slot } of enrolledSlots(PROGRESSION)) {
    const badges = slot.badges ?? [];
    // An unprinted pause length goes; the retired drawing cue goes too (the
    // render hides it on snapshots, but the editor shows a slot's cues raw).
    const next = badges
      .filter((b) => b !== 'Similar al dibujo')
      .map((b) => (sameCue(b, 'Pausa 1s') ? 'Pausa' : b));
    if (JSON.stringify(next) === JSON.stringify(badges)) continue;
    db.update(workoutDayExercises)
      .set({ badges: next.length ? next : null, updatedAt: now })
      .where(eq(workoutDayExercises.id, slot.id))
      .run();
  }
  const presses = enrolledSlots(PROGRESSION, [2])
    .filter((r) => r.slot.exerciseId === 'seated-barbell-press')
    .map((r) => r.slot.id);
  if (!presses.length) return;
  const peaks = db
    .select()
    .from(weekConfigs)
    .where(and(inArray(weekConfigs.workoutDayExerciseId, presses), eq(weekConfigs.weekNumber, 4)))
    .all();
  for (const week of peaks) {
    if (JSON.stringify(week.setGroups) !== JSON.stringify(OLD_P2_PRESS_PEAK)) continue;
    db.update(weekConfigs)
      .set({
        setGroups: P2_PRESS_PEAK,
        rirMin: null,
        rirMax: null,
        toFailure: true,
        updatedAt: now,
      })
      .where(eq(weekConfigs.id, week.id))
      .run();
  }
};

/** How long after the enrollment row its copied tree may still be stamped by the copy itself. */
const ENROLL_COPY_WINDOW_MS = 10 * 60 * 1000;

/** Rows written at enrollment and never edited since: a lifter's own phase is theirs. */
const untouchedSince = (enrolledAt: Date, stamps: (Date | null | undefined)[]): boolean =>
  stamps.every((at) => !at || at.getTime() - enrolledAt.getTime() < ENROLL_COPY_WINDOW_MS);

/**
 * Phase 3 alternates its sides WEEK BY WEEK (A·B·A, B·A·B, A·B·A, B·A·B); the
 * old copy ran two weeks of each. An enrollment that has not reached phase 3,
 * never trained it and never edited it gets the new four 1-week routines in
 * place of the old two, on the same weekdays. Anyone already in it — or who
 * shaped it — keeps theirs.
 */
const reclonePhase3 = (): void => {
  const templateIds = db
    .select({ id: routines.id })
    .from(routines)
    .where(
      and(
        eq(routines.programId, FOUNDATIONS),
        isNull(routines.userProgramId),
        gte(routines.orderIndex, 3),
      ),
    )
    .orderBy(asc(routines.orderIndex))
    .all()
    .map((r) => r.id);
  if (templateIds.length !== 4) return;
  const templateDays = db
    .select()
    .from(workoutDays)
    .where(inArray(workoutDays.routineId, templateIds))
    .all();
  const enrollments = db
    .select()
    .from(userPrograms)
    .where(
      and(
        eq(userPrograms.programId, FOUNDATIONS),
        inArray(userPrograms.status, ['active', 'paused']),
      ),
    )
    .all();
  for (const enrollment of enrollments) {
    const old = db
      .select()
      .from(routines)
      .where(and(eq(routines.userProgramId, enrollment.id), gte(routines.orderIndex, 3)))
      .orderBy(asc(routines.orderIndex))
      .all();
    if (old.length !== 2 || old.some((r) => r.durationWeeks !== 2)) continue;
    if (old.some((r) => r.id === enrollment.currentRoutineId)) continue;
    const oldDays = db
      .select()
      .from(workoutDays)
      .where(
        inArray(
          workoutDays.routineId,
          old.map((r) => r.id),
        ),
      )
      .all();
    const dayIds = oldDays.map((d) => d.id);
    const trained =
      dayIds.length > 0 &&
      db
        .select({ id: workoutLogs.id })
        .from(workoutLogs)
        .where(inArray(workoutLogs.workoutDayId, dayIds))
        .limit(1)
        .all().length > 0;
    if (trained) continue;
    const slots = dayIds.length
      ? db
          .select()
          .from(workoutDayExercises)
          .where(inArray(workoutDayExercises.workoutDayId, dayIds))
          .all()
      : [];
    const configs = slots.length
      ? db
          .select({ updatedAt: weekConfigs.updatedAt })
          .from(weekConfigs)
          .where(
            inArray(
              weekConfigs.workoutDayExerciseId,
              slots.map((s) => s.id),
            ),
          )
          .all()
      : [];
    const enrolledAt = enrollment.createdAt;
    if (
      !untouchedSince(enrolledAt, [
        ...old.map((r) => r.updatedAt),
        ...oldDays.map((d) => d.updatedAt),
        ...slots.map((s) => s.updatedAt),
        ...configs.map((c) => c.updatedAt),
      ])
    )
      continue;
    // Same weekdays, by position: the old first week's days.
    const schedule = oldDays
      .filter((d) => d.routineId === old[0].id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    // The copy's names are in the language it was enrolled in.
    const locale: Locale = /^Fase\b/.test(old[0].name) ? 'es' : 'en';
    for (const routine of old) deleteRoutine(routine.id);
    copyTemplateRoutines({
      programId: FOUNDATIONS,
      routineIds: templateIds,
      userProgramId: enrollment.id,
      scheduleFor: (templateDayId) => {
        const day = templateDays.find((d) => d.id === templateDayId);
        const source = day ? schedule[day.orderIndex - 1] : undefined;
        return source ? { weekday: source.weekday, startMinute: source.startMinute } : undefined;
      },
      locale,
      idFor: (templateId) => `${enrollment.id}:${templateId}`,
    });
    refreshTrainingWeekdays(enrollment.id);
  }
};

/** The grip a pulldown cue stood for, now its own exercise. */
const GRIP_EXERCISES: Record<string, string> = {
  'Agarre supino': 'supinated-lat-pulldown',
  'Agarre estrecho': 'close-grip-lat-pulldown',
  'Agarre ancho': 'wide-grip-lat-pulldown',
};
const gripOf = (badges: readonly string[] | undefined): string | null =>
  (badges ?? []).map((b) => GRIP_EXERCISES[badgeLabel(b, 'es')]).find(Boolean) ?? null;

/**
 * The sets already logged on a grip cue belong to that grip's exercise, so its
 * prefill, "Last training" and records carry over. The session snapshot is
 * the evidence: a session with ONE pulldown slot carrying a grip cue moves
 * that slot and its sets; two pulldowns in one session cannot be told apart
 * and stay. The pulldown's saved machine picture goes with them.
 */
const rekeyGripHistory = (now: Date): void => {
  const logs = db.select().from(workoutLogs).all();
  const moved = new Map<string, Set<string>>();
  for (const log of logs) {
    const snapshot = log.plannedSnapshot ?? [];
    const pulldowns = snapshot.filter((p) => p.exerciseId === 'lat-pulldown');
    if (pulldowns.length !== 1) continue;
    const [slot] = pulldowns;
    if (slot.originalExerciseId && slot.originalExerciseId !== 'lat-pulldown') continue;
    const target = gripOf(slot.badges);
    if (!target) continue;
    // Only where the plan itself now trains that grip (a preset copy the
    // fixes above moved): a custom program keeps its pulldown, and its history.
    const [planned] = db
      .select({ exerciseId: workoutDayExercises.exerciseId })
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.id, slot.slotId))
      .all();
    if (planned?.exerciseId !== target) continue;
    db.update(setLogs)
      .set({ exerciseId: target, updatedAt: now })
      .where(and(eq(setLogs.workoutLogId, log.id), eq(setLogs.exerciseId, 'lat-pulldown')))
      .run();
    db.update(workoutLogs)
      .set({
        plannedSnapshot: snapshot.map((p) =>
          p === slot
            ? {
                ...p,
                exerciseId: target,
                badges: (p.badges ?? []).filter((b) => !GRIP_EXERCISES[badgeLabel(b, 'es')]),
              }
            : p,
        ),
        updatedAt: now,
      })
      .where(eq(workoutLogs.id, log.id))
      .run();
    const targets = moved.get(log.userId) ?? new Set<string>();
    moved.set(log.userId, targets.add(target));
  }
  for (const [userId, targets] of moved) {
    const [setting] = db
      .select()
      .from(exerciseSettings)
      .where(
        and(eq(exerciseSettings.userId, userId), eq(exerciseSettings.exerciseId, 'lat-pulldown')),
      )
      .all();
    if (!setting?.load) continue;
    for (const exerciseId of targets)
      db.insert(exerciseSettings)
        .values({ id: randomId(), userId, exerciseId, load: setting.load })
        .onConflictDoNothing()
        .run();
  }
};

/** v17: the enrolled copies follow the presets' re-read (see each step). */
const correctEnrolledCopies = (): void => {
  const now = new Date();
  reclonePhase3();
  correctSideBAbs(now);
  applySlotFixes(now);
  correctFoundationsRest(now);
  correctProgressionCopies(now);
  rekeyGripHistory(now);
};

export const seedTraining = async (): Promise<void> => {
  if (alreadySeeded()) return;

  cleanupRetiredTemplates();
  migrateLegacyExercises();
  seedExercises();
  seedWarmups();
  for (const program of PROGRAM_SEEDS) seedProgram(program);
  correctFoundationsFrenchPress();
  correctEnrolledCopies();

  db.insert(appMeta)
    .values({ key: SEED_KEY, value: SEED_VERSION })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: SEED_VERSION, updatedAt: new Date() },
    })
    .run();
};
