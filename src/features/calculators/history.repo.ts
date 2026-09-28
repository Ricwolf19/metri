import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { calculationHistory } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** "18.5%" / "2,450 kcal" — a result as the history list shows it. */
export const keptValue = (value: string, unit?: string): string =>
  !unit ? value : unit === '%' ? `${value}%` : `${value} ${unit}`;

/** Append one kept calculator result. */
export const recordCalculation = (
  userId: string,
  calcId: string,
  inputs: Record<string, number | string>,
  primaryValue: string,
): void => {
  db.insert(calculationHistory)
    .values({ id: randomId(), userId, calcId, inputs, primaryValue })
    .run();
};

/** A calculator's kept results, newest first. */
export const calculationHistoryQuery = (userId: string, calcId: string, limit = 10) =>
  db
    .select()
    .from(calculationHistory)
    .where(and(eq(calculationHistory.userId, userId), eq(calculationHistory.calcId, calcId)))
    // rowid breaks same-millisecond ties so the last save always leads.
    .orderBy(desc(calculationHistory.createdAt), desc(sql`${calculationHistory}.rowid`))
    .limit(limit);
