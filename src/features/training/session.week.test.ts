import { beforeEach, describe, expect, it, vi } from 'vitest';

import { users, workoutLogs, type WorkoutStatus } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { completedDaysQuery } = await import('./session.repo');

const completedDayIdsForWeek = (userProgramId: string, weekNumber: number) =>
  new Set(
    completedDaysQuery(userProgramId, weekNumber)
      .all()
      .map((r) => r.dayId),
  );

const ENROLLMENT = 'up1';

const log = (input: {
  id: string;
  dayId: string;
  week: number;
  status: WorkoutStatus;
  userProgramId?: string;
}) => {
  db.insert(workoutLogs)
    .values({
      id: input.id,
      userId: 'u1',
      userProgramId: input.userProgramId ?? ENROLLMENT,
      workoutDayId: input.dayId,
      weekNumber: input.week,
      status: input.status,
    })
    .run();
};

describe('completedDaysQuery', () => {
  beforeEach(() => {
    db.delete(workoutLogs).run();
    db.delete(users).run();
    db.insert(users).values({ id: 'u1', email: null, authKind: 'local' }).run();
  });

  it('returns the splits finished in that week', () => {
    log({ id: 'l1', dayId: 'day-a', week: 2, status: 'completed' });
    log({ id: 'l2', dayId: 'day-b', week: 2, status: 'completed' });

    expect(completedDayIdsForWeek(ENROLLMENT, 2)).toEqual(new Set(['day-a', 'day-b']));
  });

  it('ignores the other weeks of the same program', () => {
    log({ id: 'l1', dayId: 'day-a', week: 1, status: 'completed' });

    expect(completedDayIdsForWeek(ENROLLMENT, 2).has('day-a')).toBe(false);
  });

  // Greying a split out is a claim that the work is done — an open or
  // abandoned session has not done it.
  it.each<WorkoutStatus>(['in_progress', 'abandoned'])('does not count a %s session', (status) => {
    log({ id: 'l1', dayId: 'day-a', week: 2, status });

    expect(completedDayIdsForWeek(ENROLLMENT, 2).size).toBe(0);
  });

  it('stays inside the enrollment it was asked about', () => {
    log({ id: 'l1', dayId: 'day-a', week: 2, status: 'completed', userProgramId: 'up2' });

    expect(completedDayIdsForWeek(ENROLLMENT, 2).size).toBe(0);
  });

  it('counts a split repeated in the same week once', () => {
    log({ id: 'l1', dayId: 'day-a', week: 2, status: 'completed' });
    log({ id: 'l2', dayId: 'day-a', week: 2, status: 'completed' });

    expect(completedDayIdsForWeek(ENROLLMENT, 2)).toEqual(new Set(['day-a']));
  });
});
