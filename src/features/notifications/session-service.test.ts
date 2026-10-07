import { describe, expect, it, vi } from 'vitest';

import type { ActiveRest } from '@/features/training/rest-state';
import type { ActiveSession } from '@/features/training/session-state';

import { IDLE_TICK_MS, REST_TICK_MS, runSessionService, type ServiceDeps } from './session-service';

const session: ActiveSession = { workoutId: 'w1', startedAt: 0, title: 'Training', next: null };
const restAt = (endsAt: number, workoutId = 'w1'): ActiveRest => ({
  workoutId,
  slotId: 's',
  startedAt: 0,
  endsAt,
  copy: {
    restingTitle: '',
    overTitle: '',
    skipLabel: '',
    plus30Label: '',
    plus60Label: '',
  },
});

/**
 * A fake world: the clock only advances inside `sleep`, and a script can
 * change the stored session/rest at a given tick, the way the screen and the
 * notification actions mutate MMKV underneath the running service.
 */
const world = (script: Record<number, () => void> = {}) => {
  let now = 0;
  let tick = 0;
  const state = { session: session as ActiveSession | null, rest: null as ActiveRest | null };
  const calls: string[] = [];
  const deps: ServiceDeps = {
    now: () => now,
    sleep: async (ms) => {
      now += ms;
      tick += 1;
      script[tick]?.();
      if (tick > 50) throw new Error('service never exited');
    },
    session: () => state.session,
    rest: () => state.rest,
    onRestOver: vi.fn(async () => void calls.push(`over@${now}`)),
    onRestResumed: vi.fn(async () => void calls.push(`resumed@${now}`)),
    onStop: vi.fn(() => void calls.push(`stop@${now}`)),
  };
  return { deps, state, calls, clock: () => now };
};

describe('runSessionService', () => {
  it('returns once the session is gone', async () => {
    const w = world({ 2: () => (w.state.session = null) });
    await runSessionService('w1', w.deps);
    expect(w.calls).toEqual([]);
    expect(w.clock()).toBe(2 * IDLE_TICK_MS);
  });

  it('polls slowly between rests and every second during one', async () => {
    const w = world({
      1: () => (w.state.rest = restAt(IDLE_TICK_MS + 3 * REST_TICK_MS)),
      6: () => (w.state.session = null),
    });
    await runSessionService('w1', w.deps);
    // One idle tick, then rest ticks: the clock moved by 5 s + 5 × 1 s.
    expect(w.clock()).toBe(IDLE_TICK_MS + 5 * REST_TICK_MS);
  });

  it('rings exactly once when the rest ends and keeps ringing until acknowledged', async () => {
    const w = world({
      1: () => (w.state.rest = restAt(IDLE_TICK_MS + 2 * REST_TICK_MS)),
      // Three more ticks over the end, then the lifter taps Ready.
      6: () => (w.state.rest = null),
      7: () => (w.state.session = null),
    });
    await runSessionService('w1', w.deps);
    expect(w.calls).toEqual([
      `over@${IDLE_TICK_MS + 2 * REST_TICK_MS}`,
      `stop@${IDLE_TICK_MS + 5 * REST_TICK_MS}`,
    ]);
  });

  it('a +30 s while ringing silences and resumes the countdown', async () => {
    const w = world({
      1: () => (w.state.rest = restAt(IDLE_TICK_MS + REST_TICK_MS)),
      3: () => (w.state.rest = restAt(IDLE_TICK_MS + 30 * REST_TICK_MS)),
      4: () => (w.state.session = null),
    });
    await runSessionService('w1', w.deps);
    expect(w.calls).toEqual([
      `over@${IDLE_TICK_MS + REST_TICK_MS}`,
      `resumed@${IDLE_TICK_MS + 2 * REST_TICK_MS}`,
    ]);
  });

  it('silences on the way out if the session ends mid-ring', async () => {
    const w = world({
      1: () => (w.state.rest = restAt(IDLE_TICK_MS)),
      2: () => (w.state.session = null),
    });
    await runSessionService('w1', w.deps);
    expect(w.calls).toEqual([`over@${IDLE_TICK_MS}`, `stop@${IDLE_TICK_MS + REST_TICK_MS}`]);
  });

  it('ignores a rest that belongs to another workout', async () => {
    const w = world({
      1: () => (w.state.rest = restAt(0, 'other')),
      3: () => (w.state.session = null),
    });
    await runSessionService('w1', w.deps);
    expect(w.calls).toEqual([]);
  });

  it('exits when the recorded session is a different workout', async () => {
    const w = world();
    w.state.session = { ...session, workoutId: 'w2' };
    await runSessionService('w1', w.deps);
    expect(w.clock()).toBe(0);
  });
});
