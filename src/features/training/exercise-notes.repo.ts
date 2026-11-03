import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { exerciseNotes } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** Live query: the lifter's note for an exercise (zero or one row). */
export const exerciseNoteQuery = (userId: string, exerciseId: string) =>
  db
    .select({ note: exerciseNotes.note })
    .from(exerciseNotes)
    .where(and(eq(exerciseNotes.userId, userId), eq(exerciseNotes.exerciseId, exerciseId)))
    .limit(1);

/** Live query: which of these exercises carry a note (the session strip marks them). */
export const notedExercisesQuery = (userId: string, exerciseIds: string[]) =>
  db
    .select({ exerciseId: exerciseNotes.exerciseId })
    .from(exerciseNotes)
    .where(and(eq(exerciseNotes.userId, userId), inArray(exerciseNotes.exerciseId, exerciseIds)));

/** Create or replace the note (empty string deletes it). */
export const saveExerciseNote = (userId: string, exerciseId: string, note: string): void => {
  const clean = note.trim();
  if (!clean) {
    db.delete(exerciseNotes)
      .where(and(eq(exerciseNotes.userId, userId), eq(exerciseNotes.exerciseId, exerciseId)))
      .run();
    return;
  }
  db.insert(exerciseNotes)
    .values({ id: randomId(), userId, exerciseId, note: clean })
    .onConflictDoUpdate({
      target: [exerciseNotes.userId, exerciseNotes.exerciseId],
      set: { note: clean, updatedAt: new Date() },
    })
    .run();
};
