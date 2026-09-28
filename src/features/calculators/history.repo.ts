import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { calculationHistory } from '@/db/schema';
import { randomId } from '@/lib/crypto';

/** "18.5%" / "2,450 kcal" — a result as the history list shows it. */
export const keptValue = (value: string, unit?: string): string =>
  !unit ? value : unit === '%' ? `${value}%` : `${value} ${unit}`;

/** Append one kept calculator result — unless it repeats the newest entry of
 * that calculator (a check-in re-saved unchanged, Save tapped twice). */
export const recordCalculation = (
  userId: string,
  calcId: string,
  inputs: Record<string, number | string>,
  primaryValue: string,
): void => {
  const [latest] = calculationHistoryQuery(userId, calcId, 1).all();
  if (
    latest?.primaryValue === primaryValue &&
    JSON.stringify(latest.inputs) === JSON.stringify(inputs)
  )
    return;
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
