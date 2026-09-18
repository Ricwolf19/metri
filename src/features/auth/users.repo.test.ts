import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, users, workoutLogs } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { adoptLocalUser, createLocalUser, findById, upsertRemoteUser } =
  await import('./users.repo');

const seedOwnedData = (userId: string) => {
  db.insert(programs)
    .values({ id: `p-${userId}`, name: 'Mine', isCustom: true, userId })
    .run();
  db.insert(workoutLogs)
    .values({
      id: `w-${userId}`,
      userId,
      userProgramId: 'up-1',
      workoutDayId: 'd-1',
      weekNumber: 1,
      status: 'completed',
    })
    .run();
};

describe('local → account adoption', () => {
  beforeEach(() => {
    db.delete(workoutLogs).run();
    db.delete(programs).run();
    db.delete(users).run();
  });

  it('keeps the same user id, so every owned row survives sign-up', async () => {
    const local = await createLocalUser({ displayName: 'Ric' });
    seedOwnedData(local.id);

    const adopted = adoptLocalUser(local.id, { email: 'Ric@Example.com', plan: 'free' });

    expect(adopted?.id).toBe(local.id);
    expect(adopted?.authKind).toBe('remote');
    expect(adopted?.email).toBe('ric@example.com');
    expect(adopted?.displayName).toBe('Ric');
    expect(db.select().from(programs).where(eq(programs.userId, local.id)).all()).toHaveLength(1);
    expect(
      db.select().from(workoutLogs).where(eq(workoutLogs.userId, local.id)).all(),
    ).toHaveLength(1);
    expect(db.select().from(users).all()).toHaveLength(1);
  });

  it('detaches a stale mirror holding the same email instead of duplicating the person', async () => {
    const stale = await upsertRemoteUser({ email: 'ric@example.com', displayName: 'Old' });
    seedOwnedData(stale.id);
    const local = await createLocalUser({ displayName: 'Ric' });
    seedOwnedData(local.id);

    const adopted = adoptLocalUser(local.id, { email: 'ric@example.com' });

    expect(adopted?.id).toBe(local.id);
    const staleRow = findById(stale.id);
    expect(staleRow?.email).toBeNull();
    expect(staleRow?.authKind).toBe('local');
    // Neither side loses data: the stale account's rows stay as an orphan.
    expect(db.select().from(programs).all()).toHaveLength(2);
  });

  it('caches the premium entitlement from the remote session', async () => {
    const local = await createLocalUser({ displayName: 'Ric' });
    const adopted = adoptLocalUser(local.id, { email: 'ric@example.com', plan: 'premium' });
    expect(adopted?.plan).toBe('premium');
  });

  it('upsertRemoteUser reuses the mirror row and refreshes its plan', async () => {
    const first = await upsertRemoteUser({ email: 'ric@example.com', plan: 'free' });
    const again = await upsertRemoteUser({ email: 'ric@example.com', plan: 'premium' });
    expect(again.id).toBe(first.id);
    expect(again.plan).toBe('premium');
    expect(db.select().from(users).all()).toHaveLength(1);
  });
});
