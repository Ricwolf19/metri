import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bodyGoals,
  bodyMetrics,
  foodLogs,
  setLogs,
  trainingDays,
  userPrograms,
  users,
  workoutLogs,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { seedTraining } = await import('@/features/training/seed');
const { seedDemoData, wipeDemoData } = await import('./demo-seed');

const U = 'dev-user';

describe('demo seed (dev only)', () => {
  beforeEach(async () => {
    for (const t of [
      foodLogs,
      bodyGoals,
      bodyMetrics,
      trainingDays,
      setLogs,
      workoutLogs,
      userPrograms,
    ])
      db.delete(t).run();
    db.delete(users).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
    await seedTraining();
  });

  it('writes eleven finished weeks across every section and parks the plan in week 12', () => {
    const summary = seedDemoData(U, 'en');
    expect(summary).not.toBeNull();
    expect(summary!.sessions + summary!.skipped).toBe(33);
    expect(db.select().from(setLogs).all().length).toBeGreaterThan(300);
    expect(db.select().from(trainingDays).where(eq(trainingDays.userId, U)).all()).toHaveLength(33);
    expect(db.select().from(bodyMetrics).all()).toHaveLength(13);
    expect(db.select().from(bodyGoals).all()).toHaveLength(1);
    expect(summary!.days).toBeGreaterThan(60);
    const [enrollment] = db.select().from(userPrograms).where(eq(userPrograms.userId, U)).all();
    expect(enrollment.status).toBe('active');
    expect(enrollment.currentWeek).toBe(2);
  });

  it('refuses to seed over an enrollment and wipes everything it wrote', () => {
    expect(seedDemoData(U, 'es')).not.toBeNull();
    expect(seedDemoData(U, 'es')).toBeNull();
    wipeDemoData(U);
    expect(db.select().from(workoutLogs).all()).toHaveLength(0);
    expect(db.select().from(foodLogs).all()).toHaveLength(0);
    expect(db.select().from(userPrograms).all()).toHaveLength(0);
  });
});
