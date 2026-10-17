import { describe, expect, it, vi } from 'vitest';

import { makeLiveRunner } from './live-runner';

/** A scheduler that holds its callbacks until `flush`. */
const manual = () => {
  const queue: (() => void)[] = [];
  const schedule = (cb: () => void) => {
    queue.push(cb);
    return () => {
      const i = queue.indexOf(cb);
      if (i >= 0) queue.splice(i, 1);
    };
  };
  const flush = () => {
    const due = queue.splice(0);
    for (const cb of due) cb();
  };
  return { schedule, flush, queue };
};

describe('makeLiveRunner', () => {
  it('runs once per tick however many changes arrive', () => {
    const run = vi.fn();
    const { schedule, flush, queue } = manual();
    const runner = makeLiveRunner(run, schedule);

    for (let i = 0; i < 30; i++) runner.notify();
    expect(queue).toHaveLength(1);
    expect(run).not.toHaveBeenCalled();

    flush();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('accepts a new run after the previous tick fired', () => {
    const run = vi.fn();
    const { schedule, flush } = manual();
    const runner = makeLiveRunner(run, schedule);

    runner.notify();
    flush();
    runner.notify();
    flush();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('dispose drops the pending run and allows a fresh one', () => {
    const run = vi.fn();
    const { schedule, flush, queue } = manual();
    const runner = makeLiveRunner(run, schedule);

    runner.notify();
    runner.dispose();
    expect(queue).toHaveLength(0);
    flush();
    expect(run).not.toHaveBeenCalled();

    runner.notify();
    flush();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
