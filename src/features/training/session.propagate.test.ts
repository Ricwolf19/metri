import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  programs,
  routines,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  type PlannedSlot,
} from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { addDay, addRoutine, addSlot, createCustomProgram, saveSlotDraft } =
  await import('./authoring.repo');

const USER = 'u-1';

const configsOf = (slotId: string) =>
  db
    .select()
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .all()
    .sort((a, b) => a.weekNumber - b.weekNumber);

const planned = (slotId: string, over: Partial<PlannedSlot> = {}): PlannedSlot => ({
  slotId,
  exerciseId: 'ex-1',
  name: 'Bench',
  setGroups: [{ sets: 3, reps: 8 }],
  restSeconds: 180,
  badges: [],
  alternativeExerciseIds: [],
  notes: null,
  ...over,
});

const insertLog = (
  id: string,
  dayId: string,
  weekNumber: number,
  status: 'in_progress' | 'completed',
  snapshot: PlannedSlot[],
) =>
  db
    .insert(workoutLogs)
    .values({
      id,
      userId: USER,
      userProgramId: 'up',
      workoutDayId: dayId,
      weekNumber,
      status,
      plannedSnapshot: snapshot,
    })
    .run();

const snapshotOf = (id: string) =>
  db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).all()[0].plannedSnapshot?.[0];

describe('propagateSlotMeta via saveSlotDraft', () => {
  beforeEach(() => {
    for (const t of [
      workoutLogs,
      weekConfigs,
      workoutDayExercises,
      workoutDays,
      routines,
      programs,
    ])
      db.delete(t).run();
  });

  it('keeps the week rest override, skips swapped badges and leaves finished logs alone', () => {
    const program = createCustomProgram(USER, { name: 'P' });
    const phase = addRoutine(program.id, null, { name: '', durationWeeks: 2 });
    const day = addDay(phase.id, null, { name: '' });
    const slot = addSlot(day.id, null, 'ex-1');
    const [w1, w2] = configsOf(slot.id);
    // Week 2 prescribes its own rest, like Foundations does.
    const weeks = [
      { weekNumber: 1, values: w1, setGroups: null },
      { weekNumber: 2, values: { ...w2, restSeconds: 180 }, setGroups: null },
    ];
    saveSlotDraft(slot.id, { defaultRestSeconds: 120, badges: [], notes: '', weeks });

    insertLog('live-w2', day.id, 2, 'in_progress', [planned(slot.id)]);
    insertLog('swapped-w1', day.id, 1, 'in_progress', [
      planned(slot.id, {
        exerciseId: 'ex-variant',
        originalExerciseId: 'ex-1',
        badges: ['VARIANT'],
        restSeconds: 90,
      }),
    ]);
    insertLog('done', day.id, 2, 'completed', [planned(slot.id, { restSeconds: 45 })]);

    // A note/badge edit that leaves the rest alone.
    saveSlotDraft(slot.id, { defaultRestSeconds: 120, badges: ['GRIP'], notes: 'wide', weeks });

    expect(snapshotOf('live-w2')).toMatchObject({
      restSeconds: 180,
      badges: ['GRIP'],
      notes: 'wide',
    });
    // Week 1 has no override → the slot default; the variant keeps its own badges.
    expect(snapshotOf('swapped-w1')).toMatchObject({
      restSeconds: 120,
      badges: ['VARIANT'],
      notes: 'wide',
    });
    expect(snapshotOf('done')).toMatchObject({ restSeconds: 45, badges: [], notes: null });
  });
});
