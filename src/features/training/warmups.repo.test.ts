import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { syncDeletions, users, warmupRoutines } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { createWarmup, deleteWarmup, getWarmup, updateWarmup, warmupsQuery } =
  await import('./warmups.repo');

const U = 'u1';
const OTHER = 'u2';

const shipped = (id: string, orderIndex: number) => ({
  id,
  userId: null,
  kind: 'warmup' as const,
  name: id,
  steps: [{ name: 'Easy cardio', detail: '5 min' }],
  orderIndex,
  isCustom: false,
});

describe('warm-up routines', () => {
  beforeEach(() => {
    for (const table of [syncDeletions, warmupRoutines, users]) db.delete(table).run();
    for (const id of [U, OTHER]) {
      db.insert(users).values({ id, email: null, authKind: 'local' }).run();
    }
    db.insert(warmupRoutines).values(shipped('warmup-general', 0)).run();
  });

  it('lists the shipped routines plus the caller own, in display order', () => {
    const mine = createWarmup(U, { kind: 'mobility', name: 'My mobility', steps: [] });
    createWarmup(OTHER, { kind: 'warmup', name: 'Theirs', steps: [] });

    const ids = warmupsQuery(U)
      .all()
      .map((r) => r.id);
    expect(ids).toEqual(['warmup-general', mine.id]);
  });

  it('files a new routine behind the shipped ones', () => {
    const created = createWarmup(U, { kind: 'warmup', name: 'Mine', steps: [] });
    expect(created.orderIndex).toBeGreaterThan(0);
    expect(created.isCustom).toBe(true);
  });

  it('keeps the steps it was given', () => {
    const steps = [{ name: 'Band pull-apart', detail: '2 x 15' }, { name: 'Dead bug' }];
    const created = createWarmup(U, { kind: 'warmup', name: 'Mine', steps });
    expect(getWarmup(created.id)?.steps).toEqual(steps);

    updateWarmup(created.id, { steps: [{ name: 'Glute bridge' }] });
    expect(getWarmup(created.id)?.steps).toEqual([{ name: 'Glute bridge' }]);
  });

  it('deletes the caller own routine and records it for sync', () => {
    const created = createWarmup(U, { kind: 'warmup', name: 'Mine', steps: [] });

    expect(deleteWarmup(created.id, U)).toBe(true);
    expect(getWarmup(created.id)).toBeNull();
    const tombstones = db
      .select()
      .from(syncDeletions)
      .where(eq(syncDeletions.rowId, created.id))
      .all();
    expect(tombstones).toHaveLength(1);
    expect(tombstones[0].tableName).toBe('warmup_routines');
  });

  it('refuses to delete a shipped routine', () => {
    expect(deleteWarmup('warmup-general', U)).toBe(false);
    expect(getWarmup('warmup-general')).not.toBeNull();
    expect(db.select().from(syncDeletions).all()).toHaveLength(0);
  });

  it('refuses to delete someone else routine', () => {
    const theirs = createWarmup(OTHER, { kind: 'warmup', name: 'Theirs', steps: [] });

    expect(deleteWarmup(theirs.id, U)).toBe(false);
    expect(getWarmup(theirs.id)).not.toBeNull();
  });
});
