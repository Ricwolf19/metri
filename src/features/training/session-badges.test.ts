import { describe, expect, it } from 'vitest';

import { sessionBadges } from './session-badges';

describe('sessionBadges', () => {
  it('keeps badge strings', () => {
    expect(sessionBadges(['Pausa 1s', 'Mancuernas'])).toEqual(['Pausa 1s', 'Mancuernas']);
  });

  it('returns empty for snapshots written before badges existed', () => {
    expect(sessionBadges(undefined)).toEqual([]);
    expect(sessionBadges(null)).toEqual([]);
  });

  it('drops non-string entries instead of breaking the row', () => {
    expect(sessionBadges(['ok', 42, null, '', undefined])).toEqual(['ok']);
  });
});
