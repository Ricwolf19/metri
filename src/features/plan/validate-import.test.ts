import { describe, expect, it } from 'vitest';

import { validateImport } from './validate-import';

// Builder: a valid v2 document; each case overrides only what it breaks.
// v3 differs only by an export-only `progressPhotos` key, so both must pass.
const doc = (data: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) => ({
  app: 'metri',
  exportVersion: 2,
  data,
  ...overrides,
});

describe('validateImport — envelope', () => {
  it.each<[string, unknown, string]>([
    ['non-object', 'nope', 'invalid'],
    ['null', null, 'invalid'],
    ['wrong app', doc({}, { app: 'other' }), 'invalid'],
    ['missing version', doc({}, { exportVersion: undefined }), 'invalid'],
    ['old version', doc({}, { exportVersion: 1 }), 'version'],
    ['future version', doc({}, { exportVersion: 5 }), 'version'],
    ['data not an object', doc({}, { data: 'x' }), 'invalid'],
    ['table not an array', doc({ programs: {} }), 'invalid'],
  ])('rejects %s', (_, input, reason) => {
    expect(validateImport(input)).toMatchObject({ ok: false, reason });
  });

  it('accepts a valid document and treats absent tables as empty', () => {
    expect(validateImport(doc({ programs: [{ id: 'p1', name: 'PPL' }] }))).toEqual({ ok: true });
    expect(validateImport(doc())).toEqual({ ok: true });
  });

  it.each([2, 3, 4])('accepts export version %i', (exportVersion) => {
    expect(validateImport(doc({}, { exportVersion }))).toEqual({ ok: true });
  });

  it('ignores the export-only progressPhotos key a v3 file carries', () => {
    const v3 = doc(
      { progressPhotos: [{ id: 'ph1', takenAt: 0, weightKg: 80, note: null }] },
      { exportVersion: 3 },
    );
    expect(validateImport(v3)).toEqual({ ok: true });
  });
});

describe('validateImport — body tables', () => {
  it('accepts a tape measurement and a phase', () => {
    const data = {
      bodyMeasurements: [{ id: 'm1', date: '2026-09-20', site: 'waist', valueCm: 82.5 }],
      bodyGoals: [
        {
          id: 'g1',
          phase: 'cut',
          startDate: '2026-09-20',
          startWeightKg: 80,
          rateKgPerWeek: -0.4,
          targetKcal: 2200,
          durationWeeks: 12,
          checkinWeekday: 2,
          proteinG: 176,
          fatG: 62,
          carbsG: 220,
        },
      ],
    };
    expect(validateImport(doc(data, { exportVersion: 4 }))).toEqual({ ok: true });
  });

  it('accepts a site this build does not know — the catalogue lives in code, not the file', () => {
    const data = {
      bodyMeasurements: [{ id: 'm1', date: '2026-09-20', site: 'ankle', valueCm: 22 }],
    };
    expect(validateImport(doc(data))).toEqual({ ok: true });
  });

  it.each<[string, Record<string, unknown>, string]>([
    [
      'a measurement given as text',
      { bodyMeasurements: [{ id: 'm', date: 'd', site: 'waist', valueCm: '82' }] },
      'valueCm',
    ],
    [
      'an unknown phase',
      {
        bodyGoals: [
          {
            id: 'g',
            phase: 'shred',
            startDate: 'd',
            startWeightKg: 80,
            rateKgPerWeek: 0,
            targetKcal: 2000,
            durationWeeks: 12,
            checkinWeekday: 2,
            proteinG: 176,
            fatG: 62,
            carbsG: 220,
          },
        ],
      },
      'phase',
    ],
  ])('flags %s', (_, data, field) => {
    const result = validateImport(doc(data));
    if (result.ok) throw new Error('expected failure');
    expect(result.issues?.map((i) => i.field)).toContain(field);
  });
});

describe('validateImport — rows', () => {
  it.each<[string, Record<string, unknown>, string]>([
    ['row without id', { programs: [{ name: 'x' }] }, 'id'],
    ['empty id', { programs: [{ id: '', name: 'x' }] }, 'id'],
    ['wrong primitive', { programs: [{ id: 'p', name: 3 }] }, 'name'],
    ['unknown enum', { exercises: [{ id: 'e', name: 'x', category: 'neck' }] }, 'category'],
    [
      'numeric field as string',
      { setLogs: [{ id: 's', workoutLogId: 'w', exerciseId: 'e', weightKg: '80', reps: 8 }] },
      'weightKg',
    ],
  ])('flags %s with table, index and field', (_, data, field) => {
    const result = validateImport(doc(data));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const [table] = Object.keys(data);
    expect(result.issues).toContainEqual({ table, index: 0, field });
  });

  it('reports every issue, not just the first', () => {
    const result = validateImport(doc({ programs: [{ id: 'a' }, { name: 'b' }] }));
    if (result.ok) throw new Error('expected failure');
    expect(result.issues?.map((i) => `${i.index}:${i.field}`)).toEqual(['0:name', '1:id']);
  });
});

describe('validateImport — body goal completeness', () => {
  const goal = () => ({
    id: 'g1',
    phase: 'cut',
    startDate: '2026-09-20',
    startWeightKg: 80,
    rateKgPerWeek: -0.4,
    targetKcal: 2200,
    durationWeeks: 12,
    checkinWeekday: 2,
    proteinG: 176,
    fatG: 62,
    carbsG: 220,
  });

  // Each of these is NOT NULL with no default, so a file missing one used to
  // pass validation and then throw a raw SQLite error inside the transaction —
  // defeating the per-row reporting this validator exists to give.
  it.each(['durationWeeks', 'checkinWeekday', 'proteinG', 'fatG', 'carbsG'])(
    'flags a phase missing %s',
    (field) => {
      const row: Record<string, unknown> = goal();
      delete row[field];
      const result = validateImport(doc({ bodyGoals: [row] }, { exportVersion: 4 }));
      if (result.ok) throw new Error('expected failure');
      expect(result.issues?.map((i) => i.field)).toContain(field);
    },
  );
});
