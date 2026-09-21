import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bodyGoals,
  bodyMeasurements,
  customFoods,
  foodLogs,
  exercises,
  programs,
  progressPhotos,
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

describe('buildExport — data freedom guarantees', () => {
  beforeEach(() => {
    wipe();
    db.delete(progressPhotos).run();
    seedWorld(U1);
  });

  it('ships photo metadata but never the on-device file paths', () => {
    db.insert(progressPhotos)
      .values({
        id: `${U1}-ph`,
        userId: U1,
        uri: 'file:///data/user/0/app/photo.jpg',
        thumbUri: 'file:///data/user/0/app/thumb.jpg',
        takenAt: new Date('2026-09-01T08:00:00Z'),
        weightKg: 80.5,
        note: 'morning',
      })
      .run();

    const doc = JSON.parse(JSON.stringify(buildExport(U1)));

    expect(doc.exportVersion).toBe(4);
    expect(doc.data.progressPhotos).toHaveLength(1);
    const [photo] = doc.data.progressPhotos;
    // The weight/date timeline is extractable...
    expect(photo).toMatchObject({ weightKg: 80.5, note: 'morning' });
    // ...while the binaries and their device paths stay on the device.
    expect(photo).not.toHaveProperty('uri');
    expect(photo).not.toHaveProperty('thumbUri');
    expect(JSON.stringify(doc)).not.toContain('file:///');
  });

  it('round-trips into another LOCAL user — export never requires an account', () => {
    const local2 = 'u-local-2';
    db.insert(users).values({ id: local2, email: null, authKind: 'local' }).run();

    const doc = JSON.parse(JSON.stringify(buildExport(U1)));
    expect(validateImport(doc)).toEqual({ ok: true });
    const summary = importUserData(local2, doc);

    expect(summary.programs).toBe(1);
    const [prog] = db.select().from(programs).where(eq(programs.userId, local2)).all();
    expect(prog.id).not.toBe(`${U1}-p`);
  });

  it('still imports a v2 file, which has no progressPhotos key', () => {
    const v3 = JSON.parse(JSON.stringify(buildExport(U1)));
    const { progressPhotos: _dropped, ...data } = v3.data;
    const v2 = { ...v3, exportVersion: 2, data };

    expect(validateImport(v2)).toEqual({ ok: true });
    expect(importUserData(U1, v2).programs).toBe(1);
  });
});

describe('body tables round-trip', () => {
  const goal = (id: string, userId: string, endedAt: Date | null = null) => ({
    id,
    userId,
    phase: 'cut' as const,
    startDate: '2026-09-01',
    startWeightKg: 80,
    rateKgPerWeek: -0.4,
    durationWeeks: 12,
    checkinWeekday: 2,
    targetKcal: 2200,
    proteinG: 150,
    fatG: 60,
    carbsG: 265,
    endedAt,
  });

  beforeEach(() => {
    wipe();
    db.delete(bodyMeasurements).run();
    db.delete(bodyGoals).run();
    seedWorld(U1);
    db.insert(users).values({ id: U2, email: 'b@b.co', authKind: 'remote' }).run();
  });

  it('carries tape measurements and the running phase to the importer', () => {
    db.insert(bodyMeasurements)
      .values({ id: 'm1', userId: U1, date: '2026-09-01', site: 'waist', valueCm: 84 })
      .run();
    db.insert(bodyGoals).values(goal('g1', U1)).run();

    const summary = importUserData(U2, JSON.parse(JSON.stringify(buildExport(U1))));

    expect(summary.bodyMeasurements).toBe(1);
    expect(summary.bodyGoals).toBe(1);
    const [m] = db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, U2)).all();
    expect(m).toMatchObject({ site: 'waist', valueCm: 84 });
    const [g] = db.select().from(bodyGoals).where(eq(bodyGoals.userId, U2)).all();
    expect(g.endedAt).toBeNull(); // nothing was running, so the imported phase stays active
  });

  it('closes an imported active phase when the importer already has one running', () => {
    db.insert(bodyGoals).values(goal('g-src', U1)).run();
    db.insert(bodyGoals).values(goal('g-own', U2)).run();

    importUserData(U2, JSON.parse(JSON.stringify(buildExport(U1))));

    const rows = db.select().from(bodyGoals).where(eq(bodyGoals.userId, U2)).all();
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.endedAt == null).map((r) => r.id)).toEqual(['g-own']);
  });

  it('keeps an existing measurement over the file for the same day and site', () => {
    db.insert(bodyMeasurements)
      .values({ id: 'src', userId: U1, date: '2026-09-01', site: 'waist', valueCm: 90 })
      .run();
    db.insert(bodyMeasurements)
      .values({ id: 'own', userId: U2, date: '2026-09-01', site: 'waist', valueCm: 84 })
      .run();

    importUserData(U2, JSON.parse(JSON.stringify(buildExport(U1))));

    const rows = db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, U2)).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].valueCm).toBe(84);
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

describe('importUserData — food tables', () => {
  beforeEach(() => {
    wipe();
    db.delete(foodLogs).run();
    db.delete(customFoods).run();
    seedWorld(U1);
    db.insert(users).values({ id: U2, email: 'b@b.co', authKind: 'remote' }).run();
  });

  // The risky link in the whole import: a log points at a custom food by id, and
  // every id is regenerated on the way in. If the rewrite misses this one, the
  // log survives pointing at the EXPORTER's food — another user's row.
  it('repoints a log at the importer copy of its custom food', () => {
    db.insert(customFoods)
      .values({ id: 'f-src', userId: U1, name: 'Protein bar', kcal: 200, proteinG: 20 })
      .run();
    db.insert(foodLogs)
      .values({
        id: 'l-src',
        userId: U1,
        date: '2026-09-20',
        meal: 'snack',
        foodId: 'f-src',
        name: 'Protein bar',
        kcal: 200,
      })
      .run();

    const summary = importUserData(U2, JSON.parse(JSON.stringify(buildExport(U1))));

    expect(summary.customFoods).toBe(1);
    expect(summary.foodLogs).toBe(1);
    const [food] = db.select().from(customFoods).where(eq(customFoods.userId, U2)).all();
    const [log] = db.select().from(foodLogs).where(eq(foodLogs.userId, U2)).all();
    expect(food.id).not.toBe('f-src');
    expect(log.foodId).toBe(food.id);
  });

  // Catalogue foods are not rows in this database, so their ids are not the
  // importer's to rewrite — a remapped slug would point at nothing.
  it('leaves a catalogue reference untouched', () => {
    db.insert(foodLogs)
      .values({
        id: 'l-cat',
        userId: U1,
        date: '2026-09-20',
        meal: 'lunch',
        foodId: 'catalog:chicken-breast',
        name: 'Chicken breast',
        kcal: 165,
      })
      .run();

    importUserData(U2, JSON.parse(JSON.stringify(buildExport(U1))));

    const [log] = db.select().from(foodLogs).where(eq(foodLogs.userId, U2)).all();
    expect(log.foodId).toBe('catalog:chicken-breast');
  });
});
