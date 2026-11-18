import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exercises,
  programs,
  routines,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { buildSharedProgram, importSharedProgram, missingCatalogExercises } =
  await import('./program-share');
const { addScannedCode, encodeProgramShare } = await import('./program-share-codec');

const SENDER = 'u-send';
const RECEIVER = 'u-recv';

/** A sender's program: one phase, one split, a catalog lift with a custom alternative. */
const seed = () => {
  db.insert(exercises)
    .values({ id: 'barbell-back-squat', name: 'Squat', category: 'legs', isCustom: false })
    .run();
  db.insert(exercises)
    .values({
      id: 'send-custom',
      name: 'Sissy squat',
      category: 'legs',
      equipment: 'bodyweight',
      primaryMuscles: ['quads'],
      isCustom: true,
      userId: SENDER,
    })
    .run();
  db.insert(programs)
    .values({ id: 'p', name: 'Legs', description: 'Two weeks', isCustom: true, userId: SENDER })
    .run();
  db.insert(routines)
    .values({ id: 'r', programId: 'p', name: '', orderIndex: 0, durationWeeks: 2 })
    .run();
  db.insert(workoutDays)
    .values({ id: 'd', routineId: 'r', name: 'Legs A', orderIndex: 0, weekday: 2 })
    .run();
  db.insert(workoutDayExercises)
    .values({
      id: 's',
      workoutDayId: 'd',
      exerciseId: 'barbell-back-squat',
      orderIndex: 0,
      defaultRestSeconds: 180,
      badges: ['Pausa'],
      alternativeExerciseIds: ['send-custom'],
      swap: { exerciseId: 'send-custom', sessionsLeft: 2, reason: 'busy' },
    })
    .run();
  for (const weekNumber of [1, 2]) {
    db.insert(weekConfigs)
      .values({
        id: `w${weekNumber}`,
        workoutDayExerciseId: 's',
        weekNumber,
        sets: 4,
        reps: 5,
        rirMin: 2,
        rirMax: 2,
        toFailure: false,
      })
      .run();
  }
};

/** Through the codes and back, as the scanner would receive it. */
const viaCodes = (programId: string) => {
  const built = buildSharedProgram(programId, null, 'en');
  if (!built) throw new Error('nothing built');
  let scan = null;
  for (const code of encodeProgramShare(built)) {
    const step = addScannedCode(scan, code);
    if (step.kind === 'complete') return step.program;
    if (step.kind !== 'progress') throw new Error(step.kind);
    scan = step.scan;
  }
  throw new Error('incomplete');
};

beforeEach(() => {
  for (const t of [
    weekConfigs,
    workoutDayExercises,
    workoutDays,
    routines,
    userPrograms,
    programs,
    exercises,
  ]) {
    db.delete(t).run();
  }
  seed();
});

describe('buildSharedProgram', () => {
  it('ships the tree and the custom exercise, never the schedule or a swap', () => {
    const shared = buildSharedProgram('p', null, 'en');
    expect(shared).toMatchObject({
      name: 'Legs',
      exercises: [{ name: 'Sissy squat', category: 'legs', primaryMuscles: ['quads'] }],
      routines: [
        {
          durationWeeks: 2,
          days: [
            {
              name: 'Legs A',
              slots: [
                {
                  exercise: 'barbell-back-squat',
                  alternatives: ['#0'],
                  restSeconds: 180,
                  badges: ['Pausa'],
                },
              ],
            },
          ],
        },
      ],
    });
    const text = JSON.stringify(shared);
    expect(text).not.toContain(SENDER);
    expect(text).not.toContain('weekday');
    expect(text).not.toContain('sessionsLeft');
  });
});

describe('importSharedProgram', () => {
  it('writes a fresh custom template owned by the scanner', () => {
    const id = importSharedProgram(RECEIVER, viaCodes('p'));
    const [program] = db.select().from(programs).where(eq(programs.id, id)).all();
    expect(program).toMatchObject({ name: 'Legs', isCustom: true, userId: RECEIVER });
    expect(program.userProgramId).toBeNull();

    const [routine] = db.select().from(routines).where(eq(routines.programId, id)).all();
    expect(routine.id).not.toBe('r');
    const [day] = db.select().from(workoutDays).where(eq(workoutDays.routineId, routine.id)).all();
    expect(day.weekday).toBeNull();
    const [slot] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.workoutDayId, day.id))
      .all();
    expect(slot.exerciseId).toBe('barbell-back-squat');
    expect(slot.swap).toBeNull();
    const weeks = db
      .select()
      .from(weekConfigs)
      .where(eq(weekConfigs.workoutDayExerciseId, slot.id))
      .all();
    expect(weeks.map((w) => [w.weekNumber, w.sets, w.reps])).toEqual([
      [1, 4, 5],
      [2, 4, 5],
    ]);

    // The custom alternative arrived as the scanner's own exercise.
    const [alt] = slot.alternativeExerciseIds ?? [];
    const [custom] = db.select().from(exercises).where(eq(exercises.id, alt)).all();
    expect(custom).toMatchObject({ name: 'Sissy squat', isCustom: true, userId: RECEIVER });
    // Never enrolled for them.
    expect(db.select().from(userPrograms).all()).toEqual([]);
  });

  it('reuses the scanner’s identical custom exercise instead of copying it', () => {
    db.insert(exercises)
      .values({
        id: 'mine',
        name: 'sissy SQUAT ',
        category: 'legs',
        equipment: 'bodyweight',
        primaryMuscles: ['quads'],
        isCustom: true,
        userId: RECEIVER,
      })
      .run();
    const id = importSharedProgram(RECEIVER, viaCodes('p'));
    const [routine] = db.select().from(routines).where(eq(routines.programId, id)).all();
    const [day] = db.select().from(workoutDays).where(eq(workoutDays.routineId, routine.id)).all();
    const [slot] = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.workoutDayId, day.id))
      .all();
    expect(slot.alternativeExerciseIds).toEqual(['mine']);
    expect(db.select().from(exercises).where(eq(exercises.userId, RECEIVER)).all()).toHaveLength(1);
  });

  it('names catalog exercises this install does not have', () => {
    const shared = viaCodes('p');
    expect(missingCatalogExercises(shared)).toEqual([]);
    shared.routines[0].days[0].slots[0].exercise = 'future-lift';
    expect(missingCatalogExercises(shared)).toEqual(['future-lift']);
  });
});
