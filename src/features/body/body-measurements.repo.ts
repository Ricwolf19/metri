import { and, asc, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { bodyMeasurements } from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

import type { SiteId } from './sites';

/**
 * Save one check-in's tape readings. One row per (day, site): re-measuring a
 * site corrects the day. A `null` value CLEARS that site for the day — the row
 * is deleted and tombstoned, so a cleared reading does not resurrect on sync.
 */
export const saveMeasurements = (
  userId: string,
  date: string,
  valuesCm: Partial<Record<SiteId, number | null>>,
): void => {
  const now = new Date();
  db.transaction((tx) => {
    for (const [site, valueCm] of Object.entries(valuesCm)) {
      if (valueCm == null || !(valueCm > 0)) {
        const gone = tx
          .delete(bodyMeasurements)
          .where(
            and(
              eq(bodyMeasurements.userId, userId),
              eq(bodyMeasurements.date, date),
              eq(bodyMeasurements.site, site),
            ),
          )
          .returning({ id: bodyMeasurements.id })
          .all();
        recordDeletion(
          'body_measurements',
          gone.map((r) => r.id),
        );
        continue;
      }
      tx.insert(bodyMeasurements)
        .values({ id: randomId(), userId, date, site, valueCm })
        .onConflictDoUpdate({
          target: [bodyMeasurements.userId, bodyMeasurements.date, bodyMeasurements.site],
          set: { valueCm, updatedAt: now },
        })
        .run();
    }
  });
};

/** Live query: every reading since `since`, oldest → newest. */
export const measurementsQuery = (userId: string, since: string) =>
  db
    .select()
    .from(bodyMeasurements)
    .where(and(eq(bodyMeasurements.userId, userId), gte(bodyMeasurements.date, since)))
    .orderBy(asc(bodyMeasurements.date));

type Reading = { date: string; site: string; valueCm: number };

/** Per site: its newest reading and the one before it, for "change since last". */
export const latestPerSite = (
  rows: readonly Reading[],
): Map<string, { latest: Reading; previous: Reading | null }> => {
  const out = new Map<string, { latest: Reading; previous: Reading | null }>();
  // Rows arrive oldest → newest, so each new reading shifts the last one back.
  for (const row of rows) {
    const seen = out.get(row.site);
    out.set(row.site, { latest: row, previous: seen?.latest ?? null });
  }
  return out;
};
