import { describe, expect, it } from 'vitest';

import { validateImport } from './validate-import';

// Builder: a valid v2 document; each case overrides only what it breaks.
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
    ['data not an object', doc({}, { data: 'x' }), 'invalid'],
    ['table not an array', doc({ programs: {} }), 'invalid'],
  ])('rejects %s', (_, input, reason) => {
    expect(validateImport(input)).toMatchObject({ ok: false, reason });
  });

  it('accepts a valid document and treats absent tables as empty', () => {
    expect(validateImport(doc({ programs: [{ id: 'p1', name: 'PPL' }] }))).toEqual({ ok: true });
    expect(validateImport(doc())).toEqual({ ok: true });
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
