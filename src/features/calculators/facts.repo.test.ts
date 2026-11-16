import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bodyGoals,
  bodyMeasurements,
  bodyMetrics,
  calculationHistory,
  users,
  type PublicUser,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

import { bodyfat } from './configs/body';
import { tdeeConfig } from './configs/energy';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { readCalcFacts } = await import('./facts.repo');

const U = 'u-1';
const CONFIGS = { tdee: tdeeConfig, bodyfat };

const lifter = (over: Partial<PublicUser> = {}): PublicUser =>
  db
    .insert(users)
    .values({ id: U, email: null, authKind: 'local', ...over })
    .returning()
    .all()[0];

const metric = (date: string, weightKg: number | null, bodyFatPct: number | null) =>
  db.insert(bodyMetrics).values({ id: date, userId: U, date, weightKg, bodyFatPct }).run();

const tape = (date: string, site: string, valueCm: number) =>
  db
    .insert(bodyMeasurements)
    .values({ id: `${date}-${site}`, userId: U, date, site, valueCm })
    .run();

const kept = (calcId: string, inputs: Record<string, number | string>, createdAt: string) =>
  db
    .insert(calculationHistory)
    .values({
      id: createdAt,
      userId: U,
      calcId,
      inputs,
      primaryValue: '-',
      createdAt: new Date(createdAt),
    })
    .run();

const goal = (startDate: string, over: Partial<typeof bodyGoals.$inferInsert> = {}) =>
  db
    .insert(bodyGoals)
    .values({
      id: startDate,
      userId: U,
      phase: 'cut',
      startDate,
      startWeightKg: 82,
      rateKgPerWeek: -0.5,
      durationWeeks: 10,
      checkinWeekday: 2,
      tdeeAtStart: 2500,
      targetKcal: 2000,
      proteinG: 160,
      fatG: 60,
      carbsG: 200,
      ...over,
    })
    .run();

describe('readCalcFacts', () => {
  // A kept age is aged forward from `now`: pin the clock.
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-16T12:00:00Z'));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    for (const table of [users, bodyMetrics, bodyMeasurements, bodyGoals, calculationHistory])
      db.delete(table).run();
  });

  it('finds the newest weigh-in and the newest body-fat reading on their own days', () => {
    metric('2026-11-01', 80, 21);
    metric('2026-11-10', 79.2, null);
    metric('2026-11-12', null, 20.5);
    metric('2026-11-14', 0, 0);
    const facts = readCalcFacts(lifter(), CONFIGS);
    expect(facts.weightKg).toBe(79.2);
    expect(facts.bodyFatPct).toBe(20.5);
  });

  it('reads the newest tape per site and the running phase, never an ended one', () => {
    tape('2026-10-01', 'waist', 88);
    tape('2026-11-01', 'waist', 86.5);
    tape('2026-10-01', 'neck', 39);
    goal('2026-09-01', { phase: 'bulk', endedAt: new Date('2026-10-01') });
    goal('2026-10-02');
    const facts = readCalcFacts(lifter({ sex: 'male' }), CONFIGS);
    expect(facts).toMatchObject({
      waistCm: 86.5,
      neckCm: 39,
      hipsCm: null,
      goal: 'cut',
      targetWeightKg: 77,
      rateKgPerWeek: 0.5,
      maintenanceKcal: 2500,
    });
  });

  it("never reads back an input the kept run's own formula ignored", () => {
    kept('tdee', { formula: 'mifflin', bodyFat: 18, age: 40 }, '2026-11-02T10:00:00Z');
    expect(readCalcFacts(lifter(), CONFIGS)).toMatchObject({ bodyFatPct: null, age: 40 });

    db.delete(users).run();
    kept('tdee', { formula: 'katch', bodyFat: 16, age: 30 }, '2026-11-03T10:00:00Z');
    expect(readCalcFacts(lifter(), CONFIGS)).toMatchObject({ bodyFatPct: 16, age: 40 });
  });

  it('keeps a tape input whose gate the run never stored (a check-in without a sex)', () => {
    kept('bodyfat', { neck: 33, waist: 76, hip: 99 }, '2026-11-02T10:00:00Z');
    expect(readCalcFacts(lifter(), CONFIGS).hipsCm).toBe(99);
  });
});
