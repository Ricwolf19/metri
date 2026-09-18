import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exercises,
  programs,
  routines,
  setLogs,
  trainingDays,
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
const { importUserData } = await import('./import');
const { validateImport } = await import('./validate-import');
const { buildExport } = await import('./export-data');

const U1 = 'u-src';
const U2 = 'u-dst';

/** Builder fixture: a minimal but complete one-slot program world for `userId`. */
const seedWorld = (userId: string) => {
  db.insert(users).values({ id: userId, email: null, authKind: 'local' }).run();
  // Catalog (seeded, userId NULL) + one custom exercise owned by the user.
  db.insert(exercises)
    .values({ id: 'barbell-back-squat', name: 'Squat', category: 'legs', isCustom: false })
    .onConflictDoNothing()
    .run();
  db.insert(exercises)
    .values({ id: `${userId}-custom`, name: 'My Move', category: 'core', isCustom: true, userId })
    .run();
  db.insert(programs)
    .values({ id: `${userId}-p`, name: 'P', isCustom: true, userId })
    .run();
  db.insert(routines)
    .values({ id: `${userId}-r`, programId: `${userId}-p`, name: 'R', orderIndex: 1 })
    .run();
  db.insert(workoutDays)
    .values({ id: `${userId}-d`, routineId: `${userId}-r`, name: 'D', orderIndex: 1 })
    .run();
  db.insert(workoutDayExercises)
    .values({
      id: `${userId}-s`,
      workoutDayId: `${userId}-d`,
      exerciseId: `${userId}-custom`,
      orderIndex: 1,
      alternativeExerciseIds: ['barbell-back-squat'],
    })
    .run();
  db.insert(weekConfigs)
    .values({
      id: `${userId}-w1`,
      workoutDayExerciseId: `${userId}-s`,
      weekNumber: 1,
      sets: 3,
      reps: 8,
      toFailure: false,
    })
    .run();
  db.insert(userPrograms)
    .values({ id: `${userId}-up`, userId, programId: `${userId}-p`, status: 'active' })
    .run();
  db.insert(workoutLogs)
    .values({
      id: `${userId}-log`,
      userId,
      userProgramId: `${userId}-up`,
      workoutDayId: `${userId}-d`,
      weekNumber: 1,
      status: 'completed',
      startedAt: new Date('2026-09-01T10:00:00Z'),
      completedAt: new Date('2026-09-01T11:00:00Z'),
      plannedSnapshot: [
        {
          slotId: `${userId}-s`,
          exerciseId: `${userId}-custom`,
          name: 'My Move',
          setGroups: [{ sets: 3, reps: 8 }],
          restSeconds: 120,
          badges: [],
          alternativeExerciseIds: ['barbell-back-squat'],
        },
      ],
    })
    .run();
  db.insert(setLogs)
    .values({
      id: `${userId}-set`,
      workoutLogId: `${userId}-log`,
      exerciseId: `${userId}-custom`,
      setNumber: 1,
      weightKg: 100,
      reps: 8,
    })
    .run();
  db.insert(trainingDays)
    .values({ id: `${userId}-td`, userId, date: '2026-09-01', status: 'trained' })
    .run();
};

const wipe = () => {
  for (const table of [
    setLogs,
    workoutLogs,
    trainingDays,
    weekConfigs,
    workoutDayExercises,
    workoutDays,
    routines,
    userPrograms,
    programs,
    exercises,
    users,
  ]) {
    db.delete(table).run();
  }
};

describe('validateImport against a real export', () => {
  // Shape/enum rejection tables live in validate-import.test.ts; this file
  // only proves the ACTUAL export output passes the gate.
  it('accepts a real export document', () => {
    wipe();
    seedWorld(U1);
    const doc = JSON.parse(JSON.stringify(buildExport(U1)));
    expect(validateImport(doc)).toEqual({ ok: true });
  });
});

describe('importUserData round-trip', () => {
  beforeEach(() => {
    wipe();
    seedWorld(U1);
    db.insert(users).values({ id: U2, email: 'b@b.co', authKind: 'remote' }).run();
    // The catalog row exists on the destination too (seeded on every device).
  });

  it('recreates the tree under the importer with fresh ids and remapped refs', () => {
    // Arrange: serialize exactly like the real file (Dates → ISO strings).
    const doc = JSON.parse(JSON.stringify(buildExport(U1)));

    // Act
    const summary = importUserData(U2, doc);

    // Assert: one of each row landed, owned by U2, with regenerated ids.
    expect(summary.programs).toBe(1);
    expect(summary.setLogs).toBe(1);
    const [prog] = db.select().from(programs).where(eq(programs.userId, U2)).all();
    expect(prog).toBeTruthy();
    expect(prog.id).not.toBe(`${U1}-p`);

    const [log] = db.select().from(workoutLogs).where(eq(workoutLogs.userId, U2)).all();
    expect(log.userId).toBe(U2);
    // Timestamps revived from ISO strings.
    expect(log.startedAt).toBeInstanceOf(Date);

    // FK remap reaches INSIDE JSON: the snapshot's custom-exercise id is fresh,
    // while the seeded catalog id passes through untouched.
    const snap = log.plannedSnapshot?.[0];
    expect(snap?.exerciseId).not.toBe(`${U1}-custom`);
    expect(snap?.alternativeExerciseIds).toEqual(['barbell-back-squat']);

    const [set] = db.select().from(setLogs).where(eq(setLogs.workoutLogId, log.id)).all();
    expect(set.exerciseId).toBe(snap?.exerciseId);

    // Source user's rows are untouched.
    const [srcLog] = db.select().from(workoutLogs).where(eq(workoutLogs.userId, U1)).all();
    expect(srcLog.id).toBe(`${U1}-log`);
  });

  it('skips training days already logged on the same date', () => {
    db.insert(trainingDays)
      .values({ id: 'existing', userId: U2, date: '2026-09-01', status: 'rest' })
      .run();
    const doc = JSON.parse(JSON.stringify(buildExport(U1)));

    importUserData(U2, doc);

    const rows = db.select().from(trainingDays).where(eq(trainingDays.userId, U2)).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('rest'); // the pre-existing row wins
  });
});
