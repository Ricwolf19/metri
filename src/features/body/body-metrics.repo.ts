import { and, desc, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { bodyMetrics, progressPhotos, users, type BodyMetric } from '@/db/schema';
import { randomId } from '@/lib/crypto';
import { localDateKey } from '@/features/training/dates';

export type BodyMetricInput = {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  note?: string | null;
};

/**
 * One row per user per day: weighing in twice corrects the day rather than
 * appending a second point, which keeps the trend line honest.
 *
 * Also mirrors the weight onto `users.weightKg` when it is the most recent
 * entry, because BMR/TDEE read that snapshot and would otherwise drift.
 */
export const saveBodyMetric = (
  userId: string,
  date: string,
  input: BodyMetricInput,
): BodyMetric => {
  const now = new Date();
  const [row] = db
    .insert(bodyMetrics)
    .values({
      id: randomId(),
      userId,
      date,
      weightKg: input.weightKg ?? null,
      bodyFatPct: input.bodyFatPct ?? null,
      note: input.note ?? null,
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.userId, bodyMetrics.date],
      set: {
        weightKg: input.weightKg ?? null,
        bodyFatPct: input.bodyFatPct ?? null,
        note: input.note ?? null,
        updatedAt: now,
      },
    })
    .returning()
    .all();

  if (input.weightKg != null && date >= (latestMetric(userId)?.date ?? date)) {
    db.update(users)
      .set({ weightKg: input.weightKg, updatedAt: now })
      .where(eq(users.id, userId))
      .run();
  }
  return row;
};

const latestMetric = (userId: string): BodyMetric | null =>
  db
    .select()
    .from(bodyMetrics)
    .where(eq(bodyMetrics.userId, userId))
    .orderBy(desc(bodyMetrics.date))
    .limit(1)
    .all()[0] ?? null;

/** Live query for the trend chart: oldest → newest, from `since` (YYYY-MM-DD). */
export const bodyMetricsQuery = (userId: string, since: string) =>
  db
    .select()
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), gte(bodyMetrics.date, since)))
    .orderBy(bodyMetrics.date);

/**
 * Seed the timeline from progress photos, which carried an optional weight
 * long before this table existed and are the only weight history an upgrading
 * install has. Idempotent: existing days win, so it can run on every launch
 * and never overwrites a real weigh-in.
 */
export const backfillFromPhotos = (userId: string): number => {
  const photos = db
    .select({ takenAt: progressPhotos.takenAt, weightKg: progressPhotos.weightKg })
    .from(progressPhotos)
    .where(eq(progressPhotos.userId, userId))
    .all();

  // Days already on the timeline win. Tracked here rather than read back from
  // the insert: `changes` is not reported by every driver we run on (the sql.js
  // test harness leaves it 0), which would silently make the count a lie.
  const taken = new Set(
    db
      .select({ date: bodyMetrics.date })
      .from(bodyMetrics)
      .where(eq(bodyMetrics.userId, userId))
      .all()
      .map((r) => r.date),
  );

  let inserted = 0;
  for (const photo of photos) {
    if (photo.weightKg == null) continue;
    const date = localDateKey(photo.takenAt);
    if (taken.has(date)) continue;
    taken.add(date);
    db.insert(bodyMetrics)
      .values({ id: randomId(), userId, date, weightKg: photo.weightKg })
      .onConflictDoNothing()
      .run();
    inserted += 1;
  }
  return inserted;
};
