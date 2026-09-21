import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bodyGoals, bodyMeasurements, syncDeletions, users } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { saveMeasurements, measurementsQuery, latestPerSite } =
  await import('./body-measurements.repo');
const { startGoal, endGoal, applyAdjustment, activeGoalQuery } = await import('./body-goals.repo');

const U = 'u-1';

const wipe = () => {
  for (const table of [bodyMeasurements, bodyGoals, syncDeletions, users]) db.delete(table).run();
  db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
};

const goalInput = (over: Partial<Parameters<typeof startGoal>[1]> = {}) => ({
  phase: 'cut' as const,
  startDate: '2026-09-07',
  startWeightKg: 80,
  rateKgPerWeek: -0.4,
  durationWeeks: 12,
  checkinWeekday: 2,
  trainingLevel: null,
  bodyFatPctAtStart: 18,
  tdeeAtStart: 2600,
  targetKcal: 2160,
  proteinG: 144,
  fatG: 56,
  carbsG: 270,
  ...over,
});

describe('saveMeasurements', () => {
  beforeEach(wipe);
  const all = () => db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, U)).all();

  it('stores one row per site for the day', () => {
    saveMeasurements(U, '2026-09-07', { waist: 84, chest: 102 });
    expect(
      all()
        .map((r) => r.site)
        .sort(),
    ).toEqual(['chest', 'waist']);
  });

  it('corrects a site on re-measure instead of appending', () => {
    saveMeasurements(U, '2026-09-07', { waist: 84 });
    saveMeasurements(U, '2026-09-07', { waist: 83.5 });
    expect(all()).toHaveLength(1);
    expect(all()[0].valueCm).toBe(83.5);
  });

  it('clears a site passed as null and tombstones it for sync', () => {
    saveMeasurements(U, '2026-09-07', { waist: 84, hips: 98 });
    const waistId = all().find((r) => r.site === 'waist')!.id;

    saveMeasurements(U, '2026-09-07', { waist: null });

    expect(all().map((r) => r.site)).toEqual(['hips']);
    const tombstones = db.select().from(syncDeletions).all();
    expect(tombstones).toMatchObject([{ tableName: 'body_measurements', rowId: waistId }]);
  });

  it('does not tombstone a site that was never saved', () => {
    saveMeasurements(U, '2026-09-07', { neck: null });
    expect(db.select().from(syncDeletions).all()).toEqual([]);
  });
});

describe('latestPerSite', () => {
  beforeEach(wipe);

  it('pairs each site’s newest reading with the one before it', () => {
    saveMeasurements(U, '2026-09-07', { waist: 85 });
    saveMeasurements(U, '2026-09-14', { waist: 84, hips: 98 });

    const latest = latestPerSite(measurementsQuery(U, '2026-01-01').all());

    expect(latest.get('waist')).toMatchObject({
      latest: { valueCm: 84 },
      previous: { valueCm: 85 },
    });
    expect(latest.get('hips')).toMatchObject({ latest: { valueCm: 98 }, previous: null });
  });
});

describe('body goals', () => {
  beforeEach(wipe);
  const active = () => activeGoalQuery(U).all();

  it('starts a phase and reads it back as the active one', () => {
    startGoal(U, goalInput());
    expect(active()).toMatchObject([{ phase: 'cut', endedAt: null, adjustments: [] }]);
  });

  it('ends the running phase when a new one starts — never two active', () => {
    const first = startGoal(U, goalInput());
    startGoal(U, goalInput({ phase: 'bulk', startDate: '2026-12-01', rateKgPerWeek: 0.2 }));

    expect(active()).toMatchObject([{ phase: 'bulk' }]);
    const [old] = db.select().from(bodyGoals).where(eq(bodyGoals.id, first.id)).all();
    expect(old.endedAt).toBeInstanceOf(Date);
  });

  it('has no active phase once it is ended', () => {
    const goal = startGoal(U, goalInput());
    endGoal(goal.id);
    expect(active()).toEqual([]);
  });

  it('adjusts through carbs only, logs the step, and keeps the start point', () => {
    const goal = startGoal(U, goalInput());

    applyAdjustment(goal, '2026-09-21', -100);

    expect(active()[0]).toMatchObject({
      targetKcal: 2060,
      carbsG: 245,
      proteinG: 144,
      fatG: 56,
      startDate: '2026-09-07',
      startWeightKg: 80,
      adjustments: [{ date: '2026-09-21', kcalDelta: -100 }],
    });
  });
});
