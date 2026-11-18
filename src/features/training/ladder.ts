import { trimFloat } from '@/lib/numbers';

/**
 * A pin stack or a dumbbell rack as the lifter describes it: where it starts,
 * its usual step, and where that step changes ("from 50, every 10"). Real
 * stacks rarely keep one plate weight from top to bottom, and racks jump from
 * 2.5 to 5 past the 50s, so one step per machine could not name what was on
 * the pin. One shape for both, in whatever unit the caller works in; pure.
 */
export type StepJump = { from: number; step: number };
export type Ladder = { start: number; step: number; jumps?: readonly StepJump[] };

/** Slack for "at or past a jump": a lb step stored in kg comes back a hair short. */
const EPS = 0.001;
const trim = (n: number): number => trimFloat(n, 3);

/** The jumps that mean something, lowest first. */
const usableJumps = (jumps: readonly StepJump[] | undefined): StepJump[] =>
  (jumps ?? [])
    .filter((j) => Number.isFinite(j.from) && j.from >= 0 && j.step > 0)
    .sort((a, b) => a.from - b.from);

/** The step taken from `value`: the last jump at or below it, else the usual one. */
const stepFrom = (value: number, step: number, jumps: StepJump[]): number => {
  let s = step;
  for (const j of jumps) if (value >= j.from - EPS) s = j.step;
  return s;
};

/** The value `n` rungs up from the start (pin `n` of a stack). */
export const ladderAt = (ladder: Ladder, n: number): number => {
  const jumps = usableJumps(ladder.jumps);
  // One step all the way: the same arithmetic a stack always had, to the gram.
  if (!jumps.length) return trim(ladder.start + n * ladder.step);
  // Exact along the way, rounded once: rounding every rung drifted a lb stack
  // stored in kg off the very jump it was walking towards.
  let v = ladder.start;
  for (let i = 0; i < n; i++) v += stepFrom(v, ladder.step, jumps);
  return trim(v);
};

/** Every value the ladder reaches from its start: at most `count`, none past `max`. */
export const ladderValues = (ladder: Ladder, max: number, count: number): number[] => {
  if (!(ladder.step > 0)) return [];
  const jumps = usableJumps(ladder.jumps);
  const out: number[] = [];
  let v = Math.max(0, ladder.start);
  while (out.length < count && v <= max + EPS) {
    out.push(trim(v));
    v += stepFrom(v, ladder.step, jumps);
  }
  return out;
};

/** Where `value` sits on the rungs (within a hundredth), or null between two. */
export const rungOf = (values: readonly number[], value: number | null): number | null => {
  if (value == null) return null;
  const i = values.findIndex((v) => Math.abs(v - value) <= 0.01);
  return i < 0 ? null : i;
};

/**
 * Where a ± press lands from `current`: the rung nearest `current + delta`,
 * but always at least one rung the way it was pressed (a 0.5 nudge on a
 * 2.5 rack still moves one dumbbell); `current` when there is none that way.
 */
export const stepAlong = (values: readonly number[], current: number, delta: number): number => {
  const ahead = values.filter((v) => (delta > 0 ? v > current + EPS : v < current - EPS));
  if (!ahead.length) return current;
  const target = current + delta;
  return ahead.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best));
};

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * A ladder read back from storage, or null: MMKV outlives builds, so a shape
 * this code cannot read falls back to the default instead of drawing no rack.
 */
export const parseLadder = (value: unknown): Ladder | null => {
  if (!value || typeof value !== 'object') return null;
  const { start, step, jumps } = value as Record<string, unknown>;
  if (!isNum(start) || start < 0 || !isNum(step) || !(step > 0)) return null;
  const kept = Array.isArray(jumps)
    ? jumps.filter((j): j is StepJump => {
        const { from, step: by } = (j ?? {}) as Record<string, unknown>;
        return isNum(from) && isNum(by) && by > 0;
      })
    : [];
  return { start, step, jumps: kept };
};
