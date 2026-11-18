import { describe, expect, it } from 'vitest';

import { EXERCISE_NAMES } from './exercise-content';
import { abbreviateName, EXERCISE_SHORT_NAMES, SHORT_NAME_MAX } from './exercise-short-names';
import { exerciseShortName } from './labels';

describe('exercise short names', () => {
  it('covers every catalog exercise in both languages, within the chip budget', () => {
    expect(Object.keys(EXERCISE_SHORT_NAMES).sort()).toEqual(Object.keys(EXERCISE_NAMES).sort());
    for (const names of Object.values(EXERCISE_SHORT_NAMES)) {
      for (const short of [names.en, names.es]) {
        expect(short.length).toBeGreaterThan(0);
        expect(short.length).toBeLessThanOrEqual(SHORT_NAME_MAX);
      }
    }
  });

  it('uses the catalog short name for a seeded id, whatever the stored name', () => {
    expect(exerciseShortName({ id: 'french-press', name: 'anything' }, 'en')).toBe('BB French');
    expect(exerciseShortName({ id: 'french-press', name: 'anything' }, 'es')).toBe(
      'Fr. sent. barra',
    );
  });

  it('derives one for a custom exercise', () => {
    expect(abbreviateName('Cable Row')).toBe('Cable Row');
    expect(abbreviateName('Incline Dumbbell Press with Pause')).toBe('Incl. DB Press');
    expect(abbreviateName('Extensión de tríceps con mancuerna')).toBe('Ext. tríceps');
    expect(exerciseShortName({ id: 'custom-1', name: 'Landmine Press' }, 'en')).toBe(
      'Landmine Press',
    );
  });

  it('keeps the full name when every word is filler', () => {
    expect(abbreviateName('de la con el de la con el')).toBe('de la con el de la con el');
  });
});
