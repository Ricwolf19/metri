import { describe, expect, it } from 'vitest';

import { cancelLast, type DialogAction } from './dialog-actions';

const a = (label: string, style?: DialogAction['style']): DialogAction => ({ label, style });

describe('cancelLast', () => {
  it('moves the way out to the bottom of the stack', () => {
    const ordered = cancelLast([a('Cancel', 'cancel'), a('Delete', 'destructive')]);
    expect(ordered.map((x) => x.label)).toEqual(['Delete', 'Cancel']);
  });

  it('leaves an already-correct stack untouched', () => {
    const actions = [a('Camera'), a('Library'), a('Cancel', 'cancel')];
    expect(cancelLast(actions).map((x) => x.label)).toEqual(['Camera', 'Library', 'Cancel']);
  });

  it('preserves the relative order of everything else', () => {
    const ordered = cancelLast([
      a('Save & leave'),
      a('Cancel', 'cancel'),
      a('Discard', 'destructive'),
    ]);
    expect(ordered.map((x) => x.label)).toEqual(['Save & leave', 'Discard', 'Cancel']);
  });

  it('handles a stack with no way out', () => {
    const actions = [a('Finish'), a('Abandon', 'destructive')];
    expect(cancelLast(actions)).toEqual(actions);
  });

  it('handles a single acknowledge-only action', () => {
    expect(cancelLast([a('Continue', 'cancel')]).map((x) => x.label)).toEqual(['Continue']);
  });

  it('does not mutate the caller’s array', () => {
    const actions = [a('Cancel', 'cancel'), a('OK', 'confirm')];
    cancelLast(actions);
    expect(actions[0].label).toBe('Cancel');
  });
});
