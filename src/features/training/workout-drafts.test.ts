import { afterEach, describe, expect, it } from 'vitest';

import {
  clearDraft,
  clearDraftLoads,
  clearSessionDrafts,
  editDraftKey,
  liveAfterDelete,
  liveDraftKey,
  readGridExpanded,
  readSessionDrafts,
  readSlotCounts,
  settleDeletedSet,
  writeDraft,
  writeGridExpanded,
  writeSlotCounts,
  type RowDraft,
} from './workout-drafts';

describe('workout draft store', () => {
  // The store is module state: without this each case inherited the previous
  // one's drafts and only passed in file order.
  afterEach(() => {
    clearSessionDrafts('log-1');
    clearSessionDrafts('log-2');
  });

  it('drops only the load details (and the per-side text) of a swapped slot, keeping its typed rows', () => {
    const load = { kind: 'barbell' as const, barKg: 20, platesKg: [20] };
    writeDraft('log-1', 'slot-a:0', { weight: '60', reps: '8', effort: null, load, side: '20' });
    writeDraft('log-1', 'slot-b:0', { weight: '30', reps: '10', effort: null, load });
    clearDraftLoads('log-1', 'slot-a');
    expect(readSessionDrafts('log-1').get('slot-a:0')).toEqual({
      weight: '60',
      reps: '8',
      effort: null,
      load: null,
    });
    expect(readSessionDrafts('log-1').get('slot-a:0')?.side).toBeUndefined();
    expect(readSessionDrafts('log-1').get('slot-b:0')?.load).toEqual(load);
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
    writeSlotCounts('log-1', 'slot-a', { extra: 1 });
    clearSessionDrafts('log-1');
    expect(readSessionDrafts('log-1').size).toBe(0);
    expect(readSlotCounts('log-1', 'slot-a')).toEqual({ extra: 0 });
  });

  it('keeps counts until the session is cleared', () => {
    writeSlotCounts('log-1', 'slot-a', { extra: 1 });
    expect(readSlotCounts('log-1', 'slot-a')).toEqual({ extra: 1 });
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

describe('an expanded load grid', () => {
  afterEach(() => {
    clearSessionDrafts('log-1');
    clearSessionDrafts('log-2');
  });

  it('stays open for the rest of the session, each grid on its own', () => {
    expect(readGridExpanded('log-1', 'rack')).toBe(false);
    writeGridExpanded('log-1', 'rack', true);
    expect(readGridExpanded('log-1', 'rack')).toBe(true);
    // The pins are another picker; another session starts collapsed.
    expect(readGridExpanded('log-1', 'pins')).toBe(false);
    expect(readGridExpanded('log-2', 'rack')).toBe(false);
    writeGridExpanded('log-1', 'rack', false);
    expect(readGridExpanded('log-1', 'rack')).toBe(false);
  });

  it('survives the row drafts changing and goes with the session', () => {
    writeGridExpanded('log-1', 'pins', true);
    writeDraft('log-1', 'slot-a:live', { weight: '40', reps: '10', effort: null });
    clearDraftLoads('log-1', 'slot-a');
    expect(readGridExpanded('log-1', 'pins')).toBe(true);
    clearSessionDrafts('log-1');
    expect(readGridExpanded('log-1', 'pins')).toBe(false);
  });
});

describe('the live row after a delete', () => {
  const plates = { kind: 'barbell' as const, barKg: 20, platesKg: [20] };
  // What the correction held: the lifter changed 60 to 62.5 before deleting.
  const edit: RowDraft = {
    weight: '62.5',
    reps: '8',
    effort: { rir: 1, failure: false },
    load: plates,
    side: '21.25',
  };
  const base = {
    workingIds: ['s1', 's2'],
    edit,
    plannedRows: 3,
    skipped: new Set<number>(),
    extraRows: 0,
  };

  // The bug: the live row re-seeded from the prefill (set 1: the previous
  // session) and threw away what the lifter had entered.
  it('deleting the last set steps the live row back with what the correction held', () => {
    expect(liveAfterDelete({ ...base, deletedId: 's2' })).toEqual({
      weight: '62.5',
      reps: '8',
      load: plates,
      side: '21.25',
      // A redo is a new performance: the RIR is asked again.
      effort: null,
    });
  });

  it('the first and only set counts as the last one', () => {
    expect(liveAfterDelete({ ...base, workingIds: ['s1'], deletedId: 's1' })?.weight).toBe('62.5');
  });

  it('deleting an earlier set leaves the live row as it is', () => {
    expect(liveAfterDelete({ ...base, deletedId: 's1' })).toBeNull();
  });

  it('a set logged beyond the plan leaves no row behind, unless an extra row is open', () => {
    const beyond = { ...base, workingIds: ['s1', 's2', 's3', 's4'] };
    expect(liveAfterDelete({ ...beyond, deletedId: 's4' })).toBeNull();
    expect(liveAfterDelete({ ...beyond, deletedId: 's4', extraRows: 1 })?.reps).toBe('8');
  });

  it('a skipped row still counts as settled', () => {
    // Three planned, set 2 skipped, sets 1 and 3 logged: plan done, the delete reopens one.
    expect(
      liveAfterDelete({
        ...base,
        workingIds: ['s1', 's3'],
        skipped: new Set([1]),
        deletedId: 's3',
      }),
    ).not.toBeNull();
  });

  // Log set 1, skip set 2, delete set 1: the live row reopens on set 1 itself,
  // so the correction's numbers must land there, not in a draft nobody draws.
  it('a set deleted before a skipped one hands its values to the reopened row', () => {
    expect(
      liveAfterDelete({ ...base, workingIds: ['s1'], skipped: new Set([1]), deletedId: 's1' })
        ?.weight,
    ).toBe('62.5');
  });

  it('an earlier set deleted around a skip leaves the live row alone', () => {
    // Four planned, set 2 skipped, sets 1 and 3 logged: deleting set 1 shifts set 3 up.
    expect(
      liveAfterDelete({
        ...base,
        plannedRows: 4,
        workingIds: ['s1', 's3'],
        skipped: new Set([1]),
        deletedId: 's1',
      }),
    ).toBeNull();
  });
});

describe('settling a deleted set in the store', () => {
  afterEach(() => clearSessionDrafts('log-1'));
  const live = liveDraftKey('slot-a');
  const edit = editDraftKey('slot-a', 'set-2');

  it('drops the correction and hands its values to the live row in one write', () => {
    writeDraft('log-1', live, { weight: '70', reps: '6', effort: null });
    writeDraft('log-1', edit, { weight: '62.5', reps: '8', effort: null });
    const carried = { weight: '62.5', reps: '8', effort: null };
    settleDeletedSet('log-1', edit, { key: live, draft: carried });
    expect(readSessionDrafts('log-1').has(edit)).toBe(false);
    expect(readSessionDrafts('log-1').get(live)).toEqual(carried);
  });

  it('an earlier set leaves the live draft untouched', () => {
    writeDraft('log-1', live, { weight: '70', reps: '6', effort: null });
    writeDraft('log-1', edit, { weight: '62.5', reps: '8', effort: null });
    settleDeletedSet('log-1', edit, null);
    expect(readSessionDrafts('log-1').has(edit)).toBe(false);
    expect(readSessionDrafts('log-1').get(live)?.weight).toBe('70');
  });

  // Keyed by ordinal, a restored skip or a delete moved the row onto a key
  // with nothing typed, and the typed draft resurfaced rows later.
  it("the live row's key names the slot, never an ordinal", () => {
    expect(liveDraftKey('slot-a')).toBe('slot-a:live');
    writeDraft('log-1', live, {
      weight: '70',
      reps: '6',
      effort: null,
      load: { kind: 'barbell', barKg: 20, platesKg: [25] },
    });
    // A swap still reaches it: the key keeps the slot prefix.
    clearDraftLoads('log-1', 'slot-a');
    expect(readSessionDrafts('log-1').get(live)).toEqual({
      weight: '70',
      reps: '6',
      effort: null,
      load: null,
    });
  });
});
