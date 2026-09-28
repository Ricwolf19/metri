import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculationHistory } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { recordCalculation, calculationHistoryQuery } = await import('./history.repo');

const U = 'u1';

describe('calculation history', () => {
  beforeEach(() => {
    db.delete(calculationHistory).run();
  });

  it('keeps results newest-first per calculator', () => {
    recordCalculation(U, 'tdee', { weight: 80 }, '2450 kcal');
    recordCalculation(U, 'bodyfat', { waist: 86 }, '18.5 %');
    recordCalculation(U, 'tdee', { weight: 79 }, '2420 kcal');

    const tdee = calculationHistoryQuery(U, 'tdee').all();
    expect(tdee.map((r) => r.primaryValue)).toEqual(['2420 kcal', '2450 kcal']);
    expect(tdee[0].inputs).toEqual({ weight: 79 });

    expect(calculationHistoryQuery(U, 'bodyfat').all()).toHaveLength(1);
    expect(calculationHistoryQuery('other', 'tdee').all()).toHaveLength(0);
  });
});
