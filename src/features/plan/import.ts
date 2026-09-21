import { and, eq, getTableColumns, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  bodyGoals,
  bodyMeasurements,
  bodyMetrics,
  customFoods,
  exercises,
  foodLogs,
  programs,
  reminders,
  routines,
  setLogs,
  trainingDays,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
} from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { IMPORT_TABLES, type ImportTable } from './validate-import';

// Parent-first (FK direction), same discipline as SYNC_TABLES.
const TABLES: Record<ImportTable, Parameters<typeof getTableColumns>[0]> = {
  exercises,
  programs,
  routines,
  workoutDays,
  workoutDayExercises,
  weekConfigs,
  userPrograms,
  workoutLogs,
  setLogs,
  trainingDays,
  reminders,
  bodyMetrics,
  bodyMeasurements,
  bodyGoals,
  customFoods,
  foodLogs,
};

type Row = Record<string, unknown>;

/** Replace any string that matches an exported id — including inside JSON
 * payloads (planned snapshots, alternative-exercise lists) — with its fresh id.
 * Ids not present in the file (e.g. seeded exercises) pass through untouched. */
const remapDeep = (value: unknown, ids: Map<string, string>): unknown => {
  if (typeof value === 'string') return ids.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => remapDeep(v, ids));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Row).map(([k, v]) => [k, remapDeep(v, ids)]));
  }
  return value;
};

export type ImportSummary = Record<ImportTable, number>;

/** Additive, transactional restore into `userId` — contract in @see AGENTS.md#what-this-is (import). */
export const importUserData = (
  userId: string,
  doc: { data: Partial<Record<ImportTable, Row[]>> },
): ImportSummary => {
  const data = doc.data;
  const ids = new Map<string, string>();
  for (const table of IMPORT_TABLES) {
    for (const row of data[table] ?? []) {
      if (typeof row.id === 'string') ids.set(row.id, randomId());
    }
  }

  const summary = Object.fromEntries(IMPORT_TABLES.map((t) => [t, 0])) as ImportSummary;

  db.transaction((tx) => {
    // A user has one ACTIVE phase (newest row with `endedAt` NULL). An import is
    // additive, so a second active phase arriving from a file is closed on the
    // way in rather than silently competing with the one already running.
    let hasActiveGoal =
      tx
        .select({ id: bodyGoals.id })
        .from(bodyGoals)
        .where(and(eq(bodyGoals.userId, userId), isNull(bodyGoals.endedAt)))
        .all().length > 0;

    for (const table of IMPORT_TABLES) {
      const rows = data[table] ?? [];
      if (!rows.length) continue;
      const schema = TABLES[table];
      const columns = getTableColumns(schema);

      for (const raw of rows) {
        const row = remapDeep(raw, ids) as Row;
        const value: Row = {};
        for (const [name, col] of Object.entries(columns)) {
          if (!(name in row)) continue;
          let v: unknown = row[name];
          // Timestamps serialize as ISO strings (or epoch-ms from AI-written
          // files); revive them into Dates for the driver.
          if (col.columnType === 'SQLiteTimestamp' && v != null && !(v instanceof Date)) {
            const d = new Date(v as string | number);
            v = Number.isNaN(d.getTime()) ? null : d;
          }
          value[name] = v;
        }
        // Ownership is never trusted from the file. NULL stays NULL (e.g. an
        // enrolled copy's tree rows own nothing directly).
        if ('userId' in columns && value.userId != null) value.userId = userId;
        // Stamp now so premium sync sees the rows as fresh local changes.
        if ('updatedAt' in columns) value.updatedAt = new Date();
        if ('createdAt' in columns && !(value.createdAt instanceof Date)) {
          value.createdAt = new Date();
        }

        if (table === 'bodyGoals' && value.endedAt == null) {
          if (hasActiveGoal) value.endedAt = new Date();
          hasActiveGoal = true;
        }

        const insert = tx.insert(schema).values(value as never);
        // Unique per (user, date[, site]) — an existing day always wins over the file.
        if (table === 'trainingDays' || table === 'bodyMetrics' || table === 'bodyMeasurements') {
          insert.onConflictDoNothing().run();
        } else insert.run();
        summary[table] += 1;
      }
    }
  });

  return summary;
};
