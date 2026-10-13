/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workoutDayExercises } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));

const { db } = await import('@/db/client');

/**
 * The migration ran once on the empty test database; here it is replayed over
 * rows shaped like an enrolled copy, since that is the only way to assert what
 * it does to data that already exists on a device.
 */
const MIGRATION = readFileSync('src/db/migrations/0028_strip_o_similar_badges.sql', 'utf8');

const slot = (id: string, badges: string[] | null, updatedAt: Date) =>
  db
    .insert(workoutDayExercises)
    .values({
      id,
      workoutDayId: 'd',
      exerciseId: 'standing-leg-curl',
      orderIndex: 1,
      userProgramId: 'up',
      badges,
      updatedAt,
    })
    .run();

const read = (id: string) =>
  db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, id)).all()[0];

describe('0028_strip_o_similar_badges', () => {
  beforeEach(() => {
    db.delete(workoutDayExercises).run();
  });

  it('removes the retired cue from enrolled slots, keeps the others, and stamps the row for sync', () => {
    const stale = new Date(1_000);
    slot('only', ['O similar'], stale);
    slot('mixed', ['O similar', 'Agarre supino'], stale);
    slot('clean', ['Agarre supino'], stale);
    slot('none', null, stale);

    db.run(sql.raw(MIGRATION));

    expect(read('only').badges).toBeNull();
    expect(read('mixed').badges).toEqual(['Agarre supino']);
    expect(read('only').updatedAt?.getTime()).toBeGreaterThan(stale.getTime());
    // Untouched rows are not stamped: a no-op must not turn into a sync burst.
    expect(read('clean').badges).toEqual(['Agarre supino']);
    expect(read('clean').updatedAt?.getTime()).toBe(stale.getTime());
    expect(read('none').badges).toBeNull();
    expect(read('none').updatedAt?.getTime()).toBe(stale.getTime());
  });
});
