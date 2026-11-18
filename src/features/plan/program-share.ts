import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, weekConfigs, workoutDayExercises, type Exercise } from '@/db/schema';
import { exerciseHeads, knownHeads } from '@/features/training/muscles';
import { presetDayName, presetProgramCopy, presetRoutineName } from '@/features/training/programs';
import { getProgram, getProgramTree } from '@/features/training/programs.repo';
import type { Locale } from '@/i18n';
import { randomId } from '@/lib/crypto';
import { fold } from '@/lib/text';

import { importRows } from './import';
import {
  catalogRefs,
  customRef,
  parseSharedProgram,
  type SharedExercise,
  type SharedProgram,
} from './program-share-codec';
import { validateImport } from './validate-import';

/**
 * The database side of sharing a program by QR (the codec is pure, in
 * `program-share-codec.ts`). Building reads the tree the program screen shows —
 * the template, or the lifter's enrolled copy with their edits — and nothing
 * else. Importing writes a NEW custom template owned by the scanner through
 * the export importer (`importRows`: every id regenerated, ownership forced,
 * `updatedAt` stamped so sync pushes it); it is never enrolled for them.
 */

const clip = (s: string, max: number): string => s.slice(0, max);
const clipOrNull = (s: string | null | undefined, max: number): string | null =>
  s ? s.slice(0, max) : null;

const sharedExercise = (ex: Exercise): SharedExercise => ({
  name: clip(ex.name.trim(), 80),
  category: ex.category,
  equipment: ex.equipment ?? null,
  unilateral: ex.unilateral,
  // Older custom rows may name no muscles; the category's heads stand in, the
  // same fallback the analytics use.
  primaryMuscles: exerciseHeads(ex),
  secondaryMuscles: knownHeads(ex.secondaryMuscles),
  instructions: clipOrNull(ex.instructions, 2000),
});

/**
 * One program as its share payload, or null when there is nothing to share.
 * The result has been through the receiver's own parser, so a program the
 * sender can share is one the receiver can read.
 */
export const buildSharedProgram = (
  programId: string,
  userProgramId: string | null,
  locale: Locale,
): SharedProgram | null => {
  const program = getProgram(programId);
  if (!program) return null;
  const tree = getProgramTree(programId, userProgramId);
  const dayIds = tree.routines.flatMap((r) => r.days.map((d) => d.id));
  const slots = dayIds.length
    ? db
        .select()
        .from(workoutDayExercises)
        .where(inArray(workoutDayExercises.workoutDayId, dayIds))
        .orderBy(asc(workoutDayExercises.orderIndex))
        .all()
    : [];
  const configs = slots.length
    ? db
        .select()
        .from(weekConfigs)
        .where(
          inArray(
            weekConfigs.workoutDayExerciseId,
            slots.map((s) => s.id),
          ),
        )
        .orderBy(asc(weekConfigs.weekNumber))
        .all()
    : [];
  const exerciseIds = [
    ...new Set(slots.flatMap((s) => [s.exerciseId, ...(s.alternativeExerciseIds ?? [])])),
  ];
  const byId = new Map(
    (exerciseIds.length
      ? db.select().from(exercises).where(inArray(exercises.id, exerciseIds)).all()
      : []
    ).map((e) => [e.id, e]),
  );

  // Custom exercises are defined once in the payload and named by position.
  const custom: SharedExercise[] = [];
  const customIndex = new Map<string, number>();
  const ref = (id: string): string | null => {
    const ex = byId.get(id);
    if (!ex) return null;
    if (!ex.isCustom) return ex.id;
    let n = customIndex.get(id);
    if (n == null) {
      n = custom.push(sharedExercise(ex)) - 1;
      customIndex.set(id, n);
    }
    return `#${n}`;
  };

  const preset = presetProgramCopy(program.id, locale);
  const built: SharedProgram = {
    name: clip(preset?.name ?? program.name, 120),
    description: clipOrNull(preset?.description ?? program.description, 2000),
    durationWeeks: program.durationWeeks ?? null,
    exercises: custom,
    routines: tree.routines.map((r) => ({
      name: clip(presetRoutineName(program.id, r.id, r.name, locale), 120),
      durationWeeks: r.durationWeeks,
      rmTestWeek: r.rmTestWeek ?? null,
      days: r.days.map((d) => ({
        name: clip(presetDayName(program.id, r.id, d.id, d.name, locale), 120),
        slots: slots
          .filter((s) => s.workoutDayId === d.id)
          .flatMap((s) => {
            const exercise = ref(s.exerciseId);
            if (!exercise) return [];
            return [
              {
                exercise,
                restSeconds: s.defaultRestSeconds ?? null,
                notes: clipOrNull(s.notes, 500),
                badges: s.badges ?? [],
                alternatives: (s.alternativeExerciseIds ?? [])
                  .map(ref)
                  .filter((a): a is string => a != null),
                weeks: configs
                  .filter((c) => c.workoutDayExerciseId === s.id && c.weekNumber <= r.durationWeeks)
                  .map((c) => ({
                    weekNumber: c.weekNumber,
                    sets: c.sets,
                    reps: c.reps,
                    repsMax: c.repsMax,
                    rirMin: c.rirMin,
                    rirMax: c.rirMax,
                    toFailure: c.toFailure,
                    restSeconds: c.restSeconds,
                    intensityType: c.intensityType,
                    intensityValue: c.intensityValue,
                    setGroups: c.setGroups ?? null,
                  })),
              },
            ];
          }),
      })),
    })),
  };
  return parseSharedProgram(built);
};

/** Catalog exercises the program names that this install does not have (an older build). */
export const missingCatalogExercises = (program: SharedProgram): string[] => {
  const ids = catalogRefs(program);
  if (!ids.length) return [];
  const have = new Set(
    db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(inArray(exercises.id, ids), eq(exercises.isCustom, false)))
      .all()
      .map((e) => e.id),
  );
  return ids.filter((id) => !have.has(id));
};

const sameHeads = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((h) => b.includes(h));

/**
 * The scanner's own custom exercise that IS this one — same name (folded),
 * category, equipment and primary muscles — so a program shared twice between
 * the same two people does not fill the library with copies, and the history
 * the lifter already has on it carries on. Anything less than all four is a
 * different exercise and gets its own row.
 */
const matchingCustom = (mine: readonly Exercise[], shared: SharedExercise): string | null => {
  const name = fold(shared.name.trim());
  const match = mine.find(
    (e) =>
      fold(e.name.trim()) === name &&
      e.category === shared.category &&
      (e.equipment ?? null) === shared.equipment &&
      sameHeads(knownHeads(e.primaryMuscles), shared.primaryMuscles),
  );
  return match?.id ?? null;
};

/** Writes the program as the scanner's new custom template; returns its id. */
export const importSharedProgram = (userId: string, program: SharedProgram): string => {
  // The scanner's own customs, read once for every exercise the program defines.
  const mine = program.exercises.length
    ? db
        .select()
        .from(exercises)
        .where(and(eq(exercises.userId, userId), eq(exercises.isCustom, true)))
        .all()
    : [];
  const exerciseRows: Record<string, unknown>[] = [];
  const exerciseId = program.exercises.map((ex) => {
    const existing = matchingCustom(mine, ex);
    if (existing) return existing;
    const id = randomId();
    exerciseRows.push({
      id,
      name: ex.name,
      category: ex.category,
      equipment: ex.equipment,
      unilateral: ex.unilateral,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles.length ? ex.secondaryMuscles : null,
      instructions: ex.instructions,
      isCustom: true,
      userId,
    });
    return id;
  });
  const resolve = (ref: string) => {
    const n = customRef(ref);
    return n == null ? ref : exerciseId[n];
  };

  // Placeholder ids: `importRows` swaps every one for a fresh id (FKs included).
  const programId = randomId();
  const routines: Record<string, unknown>[] = [];
  const days: Record<string, unknown>[] = [];
  const slots: Record<string, unknown>[] = [];
  const weeks: Record<string, unknown>[] = [];
  program.routines.forEach((r, ri) => {
    const routineId = randomId();
    routines.push({
      id: routineId,
      programId,
      name: r.name,
      orderIndex: ri,
      durationWeeks: r.durationWeeks,
      rmTestWeek: r.rmTestWeek,
      userProgramId: null,
    });
    r.days.forEach((d, di) => {
      const dayId = randomId();
      days.push({
        id: dayId,
        routineId,
        name: d.name,
        orderIndex: di,
        weekday: null,
        startMinute: null,
        userProgramId: null,
      });
      d.slots.forEach((s, si) => {
        const slotId = randomId();
        const alternatives = s.alternatives.map(resolve);
        slots.push({
          id: slotId,
          workoutDayId: dayId,
          exerciseId: resolve(s.exercise),
          orderIndex: si,
          defaultRestSeconds: s.restSeconds,
          notes: s.notes,
          badges: s.badges.length ? s.badges : null,
          alternativeExerciseIds: alternatives.length ? alternatives : null,
          swap: null,
          userProgramId: null,
        });
        for (const w of s.weeks) {
          weeks.push({ id: randomId(), workoutDayExerciseId: slotId, ...w, userProgramId: null });
        }
      });
    });
  });

  const data = {
    exercises: exerciseRows,
    programs: [
      {
        id: programId,
        name: program.name,
        description: program.description,
        durationWeeks: program.durationWeeks,
        isCustom: true,
        userId,
        userProgramId: null,
      },
    ],
    routines,
    workoutDays: days,
    workoutDayExercises: slots,
    weekConfigs: weeks,
  };
  // The export importer's own gate, as a second line behind the codec's parser.
  if (!validateImport({ app: 'metri', exportVersion: 6, data }).ok) {
    throw new Error('Shared program failed import validation.');
  }
  const { ids } = importRows(userId, { data });
  const created = ids.get(programId);
  if (!created) throw new Error('Shared program import lost its program id.');
  return created;
};
