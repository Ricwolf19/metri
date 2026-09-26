import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exerciseNotes } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const { exerciseNoteQuery, saveExerciseNote } = await import('./exercise-notes.repo');

const getExerciseNote = (userId: string, exerciseId: string): string | null =>
  exerciseNoteQuery(userId, exerciseId).all()[0]?.note ?? null;

describe('exercise notes', () => {
  beforeEach(() => {
    db.delete(exerciseNotes).run();
  });

  it('saves one note per (user, exercise) and replaces it', () => {
    saveExerciseNote('u1', 'deadlift', '  mixed grip over 140  ');
    expect(getExerciseNote('u1', 'deadlift')).toBe('mixed grip over 140');
    expect(db.select().from(exerciseNotes).all()).toHaveLength(1);

    saveExerciseNote('u1', 'deadlift', 'use straps');
    expect(getExerciseNote('u1', 'deadlift')).toBe('use straps');
    expect(db.select().from(exerciseNotes).all()).toHaveLength(1);
  });

  it('empty note deletes it; other users and exercises are untouched', () => {
    saveExerciseNote('u1', 'deadlift', 'cue');
    saveExerciseNote('u2', 'deadlift', 'other lifter');
    saveExerciseNote('u1', 'squat', 'another exercise');

    saveExerciseNote('u1', 'deadlift', '   ');

    expect(getExerciseNote('u1', 'deadlift')).toBeNull();
    expect(getExerciseNote('u2', 'deadlift')).toBe('other lifter');
    expect(getExerciseNote('u1', 'squat')).toBe('another exercise');
  });
});
