import { describe, expect, it } from 'vitest';

import {
  clearDraft,
  clearSessionDrafts,
  readSessionDrafts,
  writeDraft,
  writeSlotCounts,
} from './workout-drafts';

describe('workout draft store', () => {
  it('keeps drafts across simulated unmounts (store outlives the screen)', () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    // "Remount": a fresh reader must see the same draft.
    expect(readSessionDrafts('log-1').get('slot-a:0')).toEqual({
      weight: '100',
      reps: '8',
      effort: null,
    });
  });

  it('scopes drafts per workout log', () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    writeDraft('log-2', 'slot-a:0', { weight: '20', reps: '5', effort: null });
    expect(readSessionDrafts('log-1').get('slot-a:0')?.weight).toBe('100');
    expect(readSessionDrafts('log-2').get('slot-a:0')?.weight).toBe('20');
  });

  it('clears one row without touching the others', () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    writeDraft('log-1', 'slot-a:1', { weight: '90', reps: '8', effort: null });
    clearDraft('log-1', 'slot-a:0');
    expect(readSessionDrafts('log-1').has('slot-a:0')).toBe(false);
    expect(readSessionDrafts('log-1').get('slot-a:1')?.weight).toBe('90');
  });

  it('clears the whole session on finish/abandon', () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    writeSlotCounts('log-1', 'slot-a', { warmup: 2, extra: 1 });
    clearSessionDrafts('log-1');
    expect(readSessionDrafts('log-1').size).toBe(0);
  });
});
