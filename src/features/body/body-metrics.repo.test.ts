import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bodyMetrics, progressPhotos, users } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { saveBodyMetric, backfillFromPhotos, bodyMetricsQuery } =
  await import('./body-metrics.repo');

const U = 'u-1';

const wipe = () => {
  db.delete(bodyMetrics).run();
  db.delete(progressPhotos).run();
  db.delete(users).run();
};

const seedUser = (weightKg: number | null = null) =>
  db.insert(users).values({ id: U, email: null, authKind: 'local', weightKg }).run();

const rows = () => db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, U)).all();
const currentWeight = () =>
  db.select().from(users).where(eq(users.id, U)).all()[0]?.weightKg ?? null;

describe('saveBodyMetric', () => {
  beforeEach(() => {
    wipe();
    seedUser();
  });

  it('keeps one row per day — re-weighing corrects the day, never appends', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 80 });
    saveBodyMetric(U, '2026-09-19', { weightKg: 79.4 });

    expect(rows()).toHaveLength(1);
    expect(rows()[0].weightKg).toBe(79.4);
  });

  it('records distinct days separately', () => {
    saveBodyMetric(U, '2026-09-18', { weightKg: 80 });
    saveBodyMetric(U, '2026-09-19', { weightKg: 79 });
    expect(rows()).toHaveLength(2);
  });

  it('mirrors the newest weigh-in onto users.weightKg, which BMR/TDEE read', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 79 });
    expect(currentWeight()).toBe(79);
  });

  it('does NOT let a back-dated entry overwrite the current weight', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 79 });
    saveBodyMetric(U, '2026-09-12', { weightKg: 84 });

    expect(rows()).toHaveLength(2);
    expect(currentWeight()).toBe(79);
  });

  it('leaves the snapshot alone when a day records no weight', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 79 });
    saveBodyMetric(U, '2026-09-20', { bodyFatPct: 15 });
    expect(currentWeight()).toBe(79);
  });

  it('keeps a same-day body-fat reading when only the weight is re-saved', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 80, bodyFatPct: 15 });
    saveBodyMetric(U, '2026-09-19', { weightKg: 79.6 });
    expect(rows()[0]).toMatchObject({ weightKg: 79.6, bodyFatPct: 15 });
  });

  it('still clears a field when it is passed as null', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 80, bodyFatPct: 15 });
    saveBodyMetric(U, '2026-09-19', { bodyFatPct: null });
    expect(rows()[0]).toMatchObject({ weightKg: 80, bodyFatPct: null });
  });

  it('stores the optional measures it is given', () => {
    saveBodyMetric(U, '2026-09-19', { weightKg: 80, bodyFatPct: 14.2, note: 'morning' });
    expect(rows()[0]).toMatchObject({ weightKg: 80, bodyFatPct: 14.2, note: 'morning' });
  });
});

describe('bodyMetricsQuery', () => {
  beforeEach(() => {
    wipe();
    seedUser();
  });

  it('returns the window oldest → newest, excluding earlier days', () => {
    for (const date of ['2026-09-10', '2026-09-20', '2026-09-15']) {
      saveBodyMetric(U, date, { weightKg: 80 });
    }
    const dates = bodyMetricsQuery(U, '2026-09-14')
      .all()
      .map((r) => r.date);
    expect(dates).toEqual(['2026-09-15', '2026-09-20']);
  });

  it('never returns another user’s rows', () => {
    db.insert(users).values({ id: 'other', email: null, authKind: 'local' }).run();
    saveBodyMetric('other', '2026-09-19', { weightKg: 90 });
    expect(bodyMetricsQuery(U, '2026-01-01').all()).toEqual([]);
  });
});

describe('backfillFromPhotos', () => {
  const addPhoto = (id: string, takenAt: string, weightKg: number | null) =>
    db
      .insert(progressPhotos)
      .values({
        id,
        userId: U,
        uri: `file:///${id}.jpg`,
        thumbUri: `file:///${id}-t.jpg`,
        takenAt: new Date(takenAt),
        weightKg,
      })
      .run();

  beforeEach(() => {
    wipe();
    seedUser();
  });

  it('seeds the timeline from photos that carried a weight', () => {
    addPhoto('p1', '2026-09-10T08:00:00', 82);
    expect(backfillFromPhotos(U)).toBe(1);
    expect(rows()[0]).toMatchObject({ date: '2026-09-10', weightKg: 82 });
  });

  it('skips photos with no weight rather than writing null rows', () => {
    addPhoto('p1', '2026-09-10T08:00:00', null);
    expect(backfillFromPhotos(U)).toBe(0);
    expect(rows()).toEqual([]);
  });

  it('is idempotent — running twice does not duplicate a day', () => {
    addPhoto('p1', '2026-09-10T08:00:00', 82);
    backfillFromPhotos(U);
    expect(backfillFromPhotos(U)).toBe(0);
    expect(rows()).toHaveLength(1);
  });

  it('never overwrites a real weigh-in on the same day', () => {
    saveBodyMetric(U, '2026-09-10', { weightKg: 80 });
    addPhoto('p1', '2026-09-10T20:00:00', 82);

    backfillFromPhotos(U);

    expect(rows()).toHaveLength(1);
    expect(rows()[0].weightKg).toBe(80);
  });
});
