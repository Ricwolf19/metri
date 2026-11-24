import { trimFloat } from '@/lib/numbers';
import { settings, type Units } from '@/lib/storage';

import { isNum, parseLadder, type Ladder } from './ladder';
import { DEFAULT_DUMBBELL_RACK } from './plate-math';

/**
 * A gym's dumbbell rack in the display unit: the ladder it goes up by, and the
 * odd dumbbells it holds besides (a 12 lb on a rack that steps by 5), which no
 * ladder can name. `extras` is additive on the stored shape: an older build
 * reads the ladder alone and simply does not offer them.
 */
export type DumbbellRack = Ladder & { extras?: readonly number[] };

/** Slack for "the same dumbbell": the row's text rounds to two decimals. */
const SAME = 0.005;

/**
 * The odd dumbbells of a stored rack, cleaned like the ladder is (MMKV
 * outlives builds): positive finite numbers only, two decimals, each once,
 * lightest first. Anything else reads as none.
 */
const parseExtras = (value: unknown): number[] => {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>).extras : null;
  if (!Array.isArray(raw)) return [];
  const kept = raw.filter((w): w is number => isNum(w) && w > 0).map((w) => trimFloat(w, 2));
  return [...new Set(kept)].sort((a, b) => a - b);
};

/**
 * The gym's dumbbell rack, per equipment unit: a DEVICE setting like the unit
 * itself (every dumbbell exercise in one gym draws from the same rack), edited
 * in the weight sheet. Dumbbell rows pick from it rather than type a number.
 * The ladder is stored only once the lifter describes it — until then it is
 * the build's default — and the extras ride beside it either way.
 */
export const dumbbellRack = (unit: Units): DumbbellRack => {
  const stored = settings.getDumbbellRack(unit);
  const ladder = parseLadder(stored) ?? DEFAULT_DUMBBELL_RACK[unit];
  const extras = parseExtras(stored);
  return extras.length ? { ...ladder, extras } : ladder;
};

const write = (unit: Units, ladder: Ladder | null, extras: readonly number[]): void =>
  settings.setDumbbellRack(unit, { ...ladder, ...(extras.length ? { extras } : {}) });

/** The rack's steps as edited in the sheet; the odd dumbbells added beside them stay. */
export const saveRackLadder = (unit: Units, ladder: Ladder): void =>
  write(unit, ladder, parseExtras(settings.getDumbbellRack(unit)));

/**
 * One odd dumbbell onto the rack, written at once — it is the gym's fact, not
 * the set's, so a cancelled sheet keeps it. The ladder stays as stored (none
 * stored keeps the default). Returns the extras as they now stand.
 */
export const addRackExtra = (unit: Units, weight: number): readonly number[] => {
  const stored = settings.getDumbbellRack(unit);
  const next = parseExtras({ extras: [...parseExtras(stored), weight] });
  write(unit, parseLadder(stored), next);
  return next;
};

/** The same, taking one off. */
export const removeRackExtra = (unit: Units, weight: number): readonly number[] => {
  const stored = settings.getDumbbellRack(unit);
  const next = parseExtras(stored).filter((w) => Math.abs(w - weight) > SAME);
  write(unit, parseLadder(stored), next);
  return next;
};
