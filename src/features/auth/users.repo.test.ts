import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { users } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { adoptLocalUser, createLocalUser, findById, upsertRemoteUser } =
  await import('./users.repo');

describe('local-account lifecycle', () => {
  beforeEach(() => db.delete(users).run());

  it('creates a device-only user: no email, authKind local', async () => {
    const u = await createLocalUser({ displayName: 'Ric' });

    expect(u.email).toBeNull();
    expect(u.authKind).toBe('local');
    expect(u.displayName).toBe('Ric');
  });

  it('adoption keeps the SAME id — the invariant all training data hangs on', async () => {
    const local = await createLocalUser({ displayName: 'Ric' });

    const adopted = adoptLocalUser(local.id, {
      email: 'Ric@Example.com',
      displayName: 'Ricardo',
      plan: 'premium',
    });

    expect(adopted?.id).toBe(local.id);
    expect(adopted?.email).toBe('ric@example.com'); // normalized
    expect(adopted?.authKind).toBe('remote');
    expect(adopted?.plan).toBe('premium');
    expect(adopted?.displayName).toBe('Ricardo');
  });

  it('detaches a stale remote mirror already holding the email, without data loss', async () => {
    // Arrange: an old signed-out account row anchors the email...
    const stale = await upsertRemoteUser({ email: 'a@b.co', displayName: 'Old' });
    // ...and a fresh local user wants to adopt into that same account.
    const local = await createLocalUser({ displayName: 'New' });

    const adopted = adoptLocalUser(local.id, { email: 'a@b.co' });

    expect(adopted?.id).toBe(local.id);
    expect(adopted?.email).toBe('a@b.co');
    const staleAfter = findById(stale.id);
    expect(staleAfter?.email).toBeNull(); // orphaned, not deleted
    expect(staleAfter?.authKind).toBe('local');
  });

  it('re-sign-in refreshes the cached plan on the anchored row', async () => {
    const first = await upsertRemoteUser({ email: 'a@b.co', plan: 'free' });

    const second = await upsertRemoteUser({ email: 'a@b.co', plan: 'premium' });

    expect(second.id).toBe(first.id);
    expect(second.plan).toBe('premium');
    expect(db.select().from(users).where(eq(users.email, 'a@b.co')).all()).toHaveLength(1);
  });
});
