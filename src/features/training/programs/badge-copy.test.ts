import { describe, expect, it } from 'vitest';

import { badgeLabel } from './badge-copy';

describe('badgeLabel', () => {
  it('resolves a preset cue into the app language whichever language it was stored in', () => {
    expect(badgeLabel('Pausa 1s', 'en')).toBe('1 s pause');
    expect(badgeLabel('1 s pause', 'es')).toBe('Pausa 1s');
    expect(badgeLabel('AGARRE SUPINO', 'en')).toBe('Supinated grip');
  });

  it('leaves a cue the lifter typed as typed', () => {
    expect(badgeLabel('CON PAUSA LARGA', 'en')).toBe('CON PAUSA LARGA');
  });
});
