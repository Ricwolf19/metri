import { describe, expect, it } from 'vitest';

import { visualIdFor } from './exercise-visuals';

describe('visualIdFor', () => {
  it('maps catalog ids directly, ignoring the display name', () => {
    expect(visualIdFor({ id: 'deadlift', name: 'whatever' })).toBe('deadlift');
  });

  it('returns null for catalog ids that ship without frames', () => {
    expect(visualIdFor({ id: 'pullover', name: 'Pullover' })).toBeNull();
    expect(visualIdFor({ id: 'french-press', name: 'French Press' })).toBeNull();
  });

  // Custom exercises match by name against the EN+ES catalog names.
  it.each([
    ['exact ES name', 'Peso muerto convencional', 'deadlift'],
    ['case and accents ignored', 'PESO MUERTO CONVENCIONAL', 'deadlift'],
    ['catalog name inside a longer custom name', 'Peso muerto sumo con pausa', 'sumo-deadlift'],
    ['custom name inside a catalog name', 'Sumo Deadlif', 'sumo-deadlift'],
  ] as const)('%s → %s', (_label, name, expected) => {
    expect(visualIdFor({ id: 'u1-custom', name })).toBe(expected);
  });

  it('falls back to null instead of guessing on short or unknown names', () => {
    expect(visualIdFor({ id: 'u1-custom', name: 'Curl' })).toBeNull();
    expect(visualIdFor({ id: 'u1-custom', name: 'Turkish Get-Up' })).toBeNull();
  });
});
