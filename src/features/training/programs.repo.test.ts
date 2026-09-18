import { beforeEach, describe, expect, it, vi } from 'vitest';

import { programs, routines, workoutDayExercises, workoutDays } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { addDay, addRoutine, addSlot, createCustomProgram } = await import('./authoring.repo');
const { getProgramTree, ownProgramsQuery, recommendedProgramsQuery } =
  await import('./programs.repo');

describe('program lists', () => {
  beforeEach(() => {
    for (const t of [workoutDayExercises, workoutDays, routines, programs]) db.delete(t).run();
  });

  it('lists only the current user’s own templates and only curated ones as recommended', () => {
    createCustomProgram('me', { name: 'Mine' });
    createCustomProgram('other', { name: 'Theirs' });
    db.insert(programs).values({ id: 'seed', name: 'Seed', isCustom: false }).run();

    expect(
      ownProgramsQuery('me')
        .all()
        .map((p) => p.name),
    ).toEqual(['Mine']);
    expect(
      recommendedProgramsQuery()
        .all()
        .map((p) => p.name),
    ).toEqual(['Seed']);
  });

  it('counts exercise slots per split in the tree', () => {
    const program = createCustomProgram('me', { name: 'PPL' });
    const phase = addRoutine(program.id, null, { name: 'Base' });
    const push = addDay(phase.id, null, { name: 'Push' });
    const pull = addDay(phase.id, null, { name: 'Pull' });
    addSlot(push.id, null, 'a');
    addSlot(push.id, null, 'b');

    const tree = getProgramTree(program.id);
    expect(tree.routines[0].days.map((d) => [d.name, d.slotCount])).toEqual([
      ['Push', 2],
      ['Pull', 0],
    ]);
    expect(pull.id).toBeTruthy();
  });
});
