import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_REST_SECONDS, restBeforeSet, restTaken, takeRestBefore } from './rest-taken';

const store = new Map<string, string>();
// rest-state also exports the MMKV hook, which pulls in react-native.
vi.mock('react-native-mmkv', () => ({ useMMKVString: () => [undefined] }));
vi.mock('@/lib/storage', () => ({
  SettingKeys: { activeRest: 'training.activeRest', restTaken: 'training.restTaken' },
  storage: {
    getString: (k: string) => store.get(k),
    set: (k: string, v: string) => store.set(k, v),
    remove: (k: string) => store.delete(k),
  },
}));

const T = 1_700_000_000_000;
const S = 1000;

describe('restBeforeSet', () => {
  it('a rest ended with Ready counts from its start to the tap', () => {
    expect(
      restBeforeSet({
        workoutId: 'w1',
        taken: { workoutId: 'w1', startedAt: T, endedAt: T + 150 * S },
        running: null,
        now: T + 400 * S,
      }),
    ).toBe(150);
  });

  it('a rest never ended counts until the set is logged', () => {
    expect(
      restBeforeSet({
        workoutId: 'w1',
        taken: null,
        running: { workoutId: 'w1', startedAt: T },
        now: T + 200 * S,
      }),
    ).toBe(200);
  });

  it('a rest running now began after the newest set: it wins over an older ended one', () => {
    expect(
      restBeforeSet({
        workoutId: 'w1',
        taken: { workoutId: 'w1', startedAt: T, endedAt: T + 90 * S },
        running: { workoutId: 'w1', startedAt: T + 300 * S },
        now: T + 420 * S,
      }),
    ).toBe(120);
  });

  it("another workout's rest says nothing about this set", () => {
    expect(
      restBeforeSet({
        workoutId: 'w2',
        taken: { workoutId: 'w1', startedAt: T, endedAt: T + 90 * S },
        running: { workoutId: 'w1', startedAt: T },
        now: T + 100 * S,
      }),
    ).toBeNull();
  });

  it('no rest at all (the first set, a set after a skip) is not recorded', () => {
    expect(restBeforeSet({ workoutId: 'w1', taken: null, running: null, now: T })).toBeNull();
  });

  it('is clamped: never negative, never past the idle cap', () => {
    expect(
      restBeforeSet({
        workoutId: 'w1',
        taken: { workoutId: 'w1', startedAt: T, endedAt: T - 5 * S },
        running: null,
        now: T,
      }),
    ).toBe(0);
    expect(
      restBeforeSet({
        workoutId: 'w1',
        taken: null,
        running: { workoutId: 'w1', startedAt: T },
        now: T + 3 * 3600 * S,
      }),
    ).toBe(MAX_REST_SECONDS);
  });
});

describe('takeRestBefore', () => {
  beforeEach(() => store.clear());

  it('spends the ended rest: the set after next does not read it again', () => {
    restTaken.set({ workoutId: 'w1', startedAt: T, endedAt: T + 120 * S });
    expect(takeRestBefore('w1', T + 200 * S)).toBe(120);
    expect(restTaken.get()).toBeNull();
    expect(takeRestBefore('w1', T + 400 * S)).toBeNull();
  });

  it('reads the running rest without touching it (the next rest replaces it)', () => {
    store.set(
      'training.activeRest',
      JSON.stringify({ workoutId: 'w1', slotId: 's', startedAt: T, endsAt: T + 90 * S, copy: {} }),
    );
    expect(takeRestBefore('w1', T + 95 * S)).toBe(95);
    expect(store.has('training.activeRest')).toBe(true);
  });

  it('reads a record an older build or a bad write left as nothing', () => {
    store.set('training.restTaken', '{"workoutId":3}');
    expect(restTaken.get()).toBeNull();
    store.set('training.restTaken', 'not json');
    expect(restTaken.get()).toBeNull();
  });
});
