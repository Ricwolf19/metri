import { asc, eq, isNull, or } from 'drizzle-orm';

import { db } from '@/db/client';
import { warmupRoutines, type WarmupRoutine, type WarmupStep } from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

/** Shipped routines (userId null) plus the caller's own, in display order. */
export const warmupsQuery = (userId: string) =>
  db
    .select()
    .from(warmupRoutines)
    .where(or(isNull(warmupRoutines.userId), eq(warmupRoutines.userId, userId)))
    .orderBy(asc(warmupRoutines.orderIndex), asc(warmupRoutines.createdAt));

export const getWarmup = (id: string): WarmupRoutine | null =>
  db.select().from(warmupRoutines).where(eq(warmupRoutines.id, id)).all()[0] ?? null;

export const createWarmup = (
  userId: string,
  input: { kind: 'warmup' | 'mobility'; name: string; description?: string; steps: WarmupStep[] },
): WarmupRoutine => {
  const [row] = db
    .insert(warmupRoutines)
    .values({
      id: randomId(),
      userId,
      kind: input.kind,
      name: input.name,
      description: input.description ?? null,
      steps: input.steps,
      // Behind the shipped ones, which occupy the first slots.
      orderIndex: 100,
      isCustom: true,
    })
    .returning()
    .all();
  return row;
};

export const updateWarmup = (
  id: string,
  patch: { name?: string; description?: string | null; steps?: WarmupStep[] },
): void => {
  db.update(warmupRoutines)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(warmupRoutines.id, id))
    .run();
};

/** Only a user's own routine can go; the shipped ones are part of the app. */
export const deleteWarmup = (id: string, userId: string): boolean => {
  const row = getWarmup(id);
  if (!row || row.userId !== userId || !row.isCustom) return false;
  db.delete(warmupRoutines).where(eq(warmupRoutines.id, id)).run();
  recordDeletion('warmup_routines', id);
  return true;
};
