import { and, eq, isNull, like, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exercises,
  programs,
  routines,
  setLogs,
  userPrograms,
  users,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { seedTraining } = await import('./seed');
const { EXERCISE_SEEDS } = await import('./exercises.seed');
const { enrollInProgram } = await import('./enroll');

const wipe = () => {
  for (const table of [
    weekConfigs,
    workoutDayExercises,
    workoutDays,
    routines,
    programs,
    setLogs,
    workoutLogs,
    userPrograms,
    exercises,
    users,
  ]) {
    db.delete(table).run();
  }
  db.run(sql`DELETE FROM app_meta`);
};

describe('seedTraining v4', () => {
  beforeEach(wipe);

  // AAA per case; the suite runs the real migration SQL via sql.js.
  it('seeds the course catalog and both presets on a fresh install', async () => {
    await seedTraining();

    const all = db.select().from(exercises).all();
    expect(all).toHaveLength(EXERCISE_SEEDS.length);
    expect(all.every((e) => !e.isCustom && e.userId === null)).toBe(true);

    const templates = db.select().from(programs).where(isNull(programs.userProgramId)).all();
    expect(templates.map((p) => p.id).sort()).toEqual(['metri-foundations', 'metri-progression']);

    // Foundations: 3 phases; phase 1 = 3 days × 10 slots × 4 weeks each.
    const f1Days = db
      .select()
      .from(workoutDays)
      .where(like(workoutDays.routineId, 'metri-foundations-r1%'))
      .all();
    expect(f1Days).toHaveLength(3);
    const f1Slots = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.workoutDayId, f1Days[0].id))
      .all();
    expect(f1Slots).toHaveLength(10);
    const cfg = db
      .select()
      .from(weekConfigs)
      .where(eq(weekConfigs.workoutDayExerciseId, f1Slots[0].id))
      .all();
    expect(cfg).toHaveLength(4);
    // PB1 rule: everything to failure, no RIR.
    expect(cfg.every((c) => c.toFailure && c.rirMin === null && c.rirMax === null)).toBe(true);

    // Progression: 3 phases × 4 caras; RIR ladder present in week 1.
    const pRoutines = db
      .select()
      .from(routines)
      .where(eq(routines.programId, 'metri-progression'))
      .all();
    expect(pRoutines).toHaveLength(3);
    const pDays = db
      .select()
      .from(workoutDays)
      .where(eq(workoutDays.routineId, pRoutines[0].id))
      .all();
    expect(pDays).toHaveLength(4);
  });

  it('is idempotent per version flag', async () => {
    await seedTraining();
    await seedTraining();
    expect(db.select().from(exercises).all()).toHaveLength(EXERCISE_SEEDS.length);
  });

  it('demotes referenced legacy built-ins to the referencing user and deletes the rest', async () => {
    // Arrange: a pre-v4 world — legacy seeds, one referenced by a logged set.
    db.insert(users).values({ id: 'u-1', email: null, authKind: 'local', displayName: 'R' }).run();
    db.insert(exercises)
      .values({ id: 'pull-up', name: 'Pull-Up', category: 'back', isCustom: false })
      .run();
    db.insert(exercises)
      .values({ id: 'russian-twist', name: 'Russian Twist', category: 'core', isCustom: false })
      .run();
    db.insert(workoutLogs)
      .values({
        id: 'log-1',
        userId: 'u-1',
        userProgramId: 'up-x',
        workoutDayId: 'day-x',
        weekNumber: 1,
        status: 'completed',
        startedAt: new Date(),
      })
      .run();
    db.insert(setLogs)
      .values({
        id: 'set-1',
        workoutLogId: 'log-1',
        exerciseId: 'pull-up',
        setNumber: 1,
        weightKg: 0,
        reps: 8,
      })
      .run();

    // Act
    await seedTraining();

    // Assert: referenced → demoted custom owned by u-1; unreferenced → gone.
    const [pullUp] = db.select().from(exercises).where(eq(exercises.id, 'pull-up')).all();
    expect(pullUp?.isCustom).toBe(true);
    expect(pullUp?.userId).toBe('u-1');
    const twist = db.select().from(exercises).where(eq(exercises.id, 'russian-twist')).all();
    expect(twist).toHaveLength(0);
    // History untouched.
    const [set] = db.select().from(setLogs).where(eq(setLogs.id, 'set-1')).all();
    expect(set?.exerciseId).toBe('pull-up');
  });

  it('week-4 intensification carries the RIR-0 top set + back-offs', async () => {
    await seedTraining();
    // Phase 3 deadlift week 4 must be the top-set + back-off ladder.
    const [slot] = db
      .select()
      .from(workoutDayExercises)
      .innerJoin(workoutDays, eq(workoutDays.id, workoutDayExercises.workoutDayId))
      .where(
        and(
          eq(workoutDayExercises.exerciseId, 'deadlift'),
          like(workoutDays.routineId, 'metri-progression-p3%'),
        ),
      )
      .all();
    expect(slot).toBeTruthy();
    const [w4] = db
      .select()
      .from(weekConfigs)
      .where(
        and(
          eq(weekConfigs.workoutDayExerciseId, slot.workout_day_exercises.id),
          eq(weekConfigs.weekNumber, 4),
        ),
      )
      .all();
    expect(w4?.setGroups?.length).toBe(2);
    expect(w4?.setGroups?.[0]).toMatchObject({ sets: 1, rirMin: 0, rirMax: 0 });
  });

  it('v7 re-seed swaps Foundations onto the new exercises without leaving stale slots', async () => {
    // Arrange: a v6 install whose phase-1 template still has the floor crunch slot.
    await seedTraining();
    const day = 'metri-foundations-r1-d1';
    const staleId = `${day}-2-crunch`;
    db.insert(workoutDayExercises)
      .values({ id: staleId, workoutDayId: day, exerciseId: 'crunch', orderIndex: 2 })
      .run();
    db.insert(weekConfigs)
      .values({
        id: `${staleId}-w1`,
        workoutDayExerciseId: staleId,
        weekNumber: 1,
        sets: 2,
        reps: 20,
      })
      .run();
    db.run(sql`UPDATE app_meta SET value = '6' WHERE key = 'training_seed_version'`);

    // Act
    await seedTraining();

    // Assert
    const slots = db
      .select()
      .from(workoutDayExercises)
      .where(eq(workoutDayExercises.workoutDayId, day))
      .all();
    const ids = slots.map((sl) => sl.exerciseId);
    expect(slots).toHaveLength(10);
    expect(ids).toContain('cable-crunch');
    expect(ids).toContain('standing-leg-curl');
    expect(ids).toContain('seated-barbell-press');
    expect(ids).not.toContain('crunch');
    expect(ids).not.toContain('overhead-press');
    expect(
      db.select().from(weekConfigs).where(eq(weekConfigs.workoutDayExerciseId, staleId)).all(),
    ).toHaveLength(0);
    const curl = slots.find((sl) => sl.exerciseId === 'standing-leg-curl');
    expect(curl?.badges).toEqual(['O similar']);
  });

  it('v8 re-seed refreshes template week configs and never touches an enrolled copy', async () => {
    // Arrange: a v7 install enrolled in Foundations, mid-session, whose template
    // still carries an outdated prescription.
    await seedTraining();
    const tplDays = db
      .select({ id: workoutDays.id })
      .from(workoutDays)
      .where(
        and(like(workoutDays.routineId, 'metri-foundations%'), isNull(workoutDays.userProgramId)),
      )
      .all();
    const enrollment = enrollInProgram(
      'u-1',
      'metri-foundations',
      tplDays.map((d) => ({ dayId: d.id, weekday: 2, startMinute: 600 })),
    );
    const [tplSlot] = db
      .select()
      .from(workoutDayExercises)
      .where(
        and(
          eq(workoutDayExercises.workoutDayId, 'metri-foundations-r1-d1'),
          isNull(workoutDayExercises.userProgramId),
        ),
      )
      .all();
    const tplConfigId = `${tplSlot.id}-w1`;
    const [seeded] = db.select().from(weekConfigs).where(eq(weekConfigs.id, tplConfigId)).all();
    db.update(weekConfigs)
      .set({ sets: 99, restSeconds: 5 })
      .where(eq(weekConfigs.id, tplConfigId))
      .run();
    const [copyDay] = db
      .select()
      .from(workoutDays)
      .where(eq(workoutDays.userProgramId, enrollment.id))
      .all();
    db.insert(workoutLogs)
      .values({
        id: 'live',
        userId: 'u-1',
        userProgramId: enrollment.id,
        workoutDayId: copyDay.id,
        weekNumber: 1,
        status: 'in_progress',
        plannedSnapshot: [],
      })
      .run();
    const enrolled = () => ({
      slots: db
        .select()
        .from(workoutDayExercises)
        .where(eq(workoutDayExercises.userProgramId, enrollment.id))
        .all(),
      configs: db
        .select()
        .from(weekConfigs)
        .where(eq(weekConfigs.userProgramId, enrollment.id))
        .all(),
      log: db.select().from(workoutLogs).where(eq(workoutLogs.id, 'live')).all(),
    });
    const before = enrolled();
    expect(before.configs.length).toBeGreaterThan(0);
    db.run(sql`UPDATE app_meta SET value = '7' WHERE key = 'training_seed_version'`);

    // Act
    await seedTraining();

    // Assert
    const [refreshed] = db.select().from(weekConfigs).where(eq(weekConfigs.id, tplConfigId)).all();
    expect(refreshed.sets).toBe(seeded.sets);
    expect(refreshed.restSeconds).toBe(seeded.restSeconds);
    expect(enrolled()).toEqual(before);
  });
});
