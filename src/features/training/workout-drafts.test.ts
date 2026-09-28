import { afterEach, describe, expect, it } from 'vitest';

import {
  clearDraft,
  clearSessionDrafts,
  readSessionDrafts,
  readSlotCounts,
  writeDraft,
  writeSlotCounts,
} from './workout-drafts';

describe('workout draft store', () => {
  // The store is module state: without this each case inherited the previous
  // one's drafts and only passed in file order.
  afterEach(() => {
    clearSessionDrafts('log-1');
    clearSessionDrafts('log-2');
  });

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
    expect(readSlotCounts('log-1', 'slot-a')).toEqual({ warmup: 0, extra: 0 });
  });

  it('keeps counts until the session is cleared', () => {
    writeSlotCounts('log-1', 'slot-a', { warmup: 2, extra: 1 });
    expect(readSlotCounts('log-1', 'slot-a')).toEqual({ warmup: 2, extra: 1 });
  });

  it("writing to one log leaves another log's snapshot identity unchanged", () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    const before = readSessionDrafts('log-1');
    writeDraft('log-2', 'slot-a:0', { weight: '20', reps: '5', effort: null });
    // Same identity = useSyncExternalStore does not re-render log-1's screen.
    expect(readSessionDrafts('log-1')).toBe(before);
  });

  it('clearing a missing row does not replace the snapshot', () => {
    writeDraft('log-1', 'slot-a:0', { weight: '100', reps: '8', effort: null });
    const before = readSessionDrafts('log-1');
    clearDraft('log-1', 'slot-z:9');
    expect(readSessionDrafts('log-1')).toBe(before);
  });
});
