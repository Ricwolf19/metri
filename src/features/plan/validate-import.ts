/** Shallow, hand-rolled validation (no zod for a small device-local schema): presence, primitive types, key enums.
 * Unknown fields/ids are harmless — the importer whitelists columns and regenerates ids. */

type ImportIssue = { table: string; index: number; field: string };

export type ImportValidation =
  { ok: true } | { ok: false; reason: 'invalid' | 'version'; issues?: ImportIssue[] };

export const IMPORT_TABLES = [
  'exercises',
  'programs',
  'routines',
  'workoutDays',
  'workoutDayExercises',
  'weekConfigs',
  'userPrograms',
  'workoutLogs',
  'setLogs',
  'trainingDays',
  'reminders',
] as const;

export type ImportTable = (typeof IMPORT_TABLES)[number];

type FieldSpec = Record<string, 'string' | 'number' | readonly string[]>;

// Required fields per table (beyond `id`); arrays are enum whitelists.
const REQUIRED: Record<ImportTable, FieldSpec> = {
  exercises: {
    name: 'string',
    category: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio'],
  },
  programs: { name: 'string' },
  routines: { name: 'string', programId: 'string' },
  workoutDays: { name: 'string', routineId: 'string' },
  workoutDayExercises: { workoutDayId: 'string', exerciseId: 'string' },
  weekConfigs: { workoutDayExerciseId: 'string', weekNumber: 'number' },
  userPrograms: { programId: 'string' },
  workoutLogs: { userProgramId: 'string', workoutDayId: 'string' },
  setLogs: { workoutLogId: 'string', exerciseId: 'string', weightKg: 'number', reps: 'number' },
  trainingDays: { date: 'string', status: ['trained', 'rest', 'skipped'] },
  reminders: { title: 'string' },
};

const rowIssues = (table: ImportTable, row: unknown, index: number): ImportIssue[] => {
  if (typeof row !== 'object' || row === null) return [{ table, index, field: '(row)' }];
  const r = row as Record<string, unknown>;
  const issues: ImportIssue[] = [];
  if (typeof r.id !== 'string' || !r.id) issues.push({ table, index, field: 'id' });
  for (const [field, spec] of Object.entries(REQUIRED[table])) {
    const v = r[field];
    const bad = Array.isArray(spec)
      ? typeof v !== 'string' || !spec.includes(v)
      : typeof v !== spec;
    if (bad) issues.push({ table, index, field });
  }
  return issues;
};

export const validateImport = (raw: unknown): ImportValidation => {
  if (typeof raw !== 'object' || raw === null) return { ok: false, reason: 'invalid' };
  const doc = raw as Record<string, unknown>;
  if (doc.app !== 'metri' || typeof doc.exportVersion !== 'number') {
    return { ok: false, reason: 'invalid' };
  }
  if (doc.exportVersion !== 2) return { ok: false, reason: 'version' };
  if (typeof doc.data !== 'object' || doc.data === null) return { ok: false, reason: 'invalid' };

  const data = doc.data as Record<string, unknown>;
  const issues: ImportIssue[] = [];
  for (const table of IMPORT_TABLES) {
    const rows = data[table];
    if (rows === undefined) continue; // absent array = empty, fine
    if (!Array.isArray(rows)) return { ok: false, reason: 'invalid' };
    rows.forEach((row, i) => issues.push(...rowIssues(table, row, i)));
  }
  return issues.length ? { ok: false, reason: 'invalid', issues } : { ok: true };
};
