import type { EffortMode } from '@/db/schema';

import { PRESET_EFFORT_MODE } from './programs';
import type { Effort } from './workout-drafts';

/**
 * How a session asks for each set's effort, per ENROLLMENT
 * (`user_programs.effort_mode`): a preset template is not editable, and the
 * lifter must be able to change it on Foundations too. The professional scale
 * (`rir`) and the plain one (`simple`) write the same `rir` / `is_failure`
 * columns — no set column of its own — so history, e1RM and fatigue read
 * every set alike whichever mode logged it.
 */
export const EFFORT_MODES = ['rir', 'simple', 'free'] as const satisfies readonly EffortMode[];

const isEffortMode = (value: unknown): value is EffortMode =>
  (EFFORT_MODES as readonly unknown[]).includes(value);

/**
 * The mode a session runs in: the lifter's own pick, else the preset's default
 * (`PRESET_EFFORT_MODE`: Foundations simple, Progression professional), else
 * professional. A stored value this build does not know (an older or newer
 * build wrote it) reads as no pick at all. `templateId` is the program the
 * enrollment was made from (`user_programs.program_id`).
 */
export const effortModeFor = (
  templateId: string | null | undefined,
  stored: string | null | undefined,
): EffortMode => {
  if (isEffortMode(stored)) return stored;
  return (templateId ? PRESET_EFFORT_MODE[templateId] : undefined) ?? 'rir';
};

/**
 * Whether a set may not be logged without an effort: where the prescription
 * measures one (a RIR range, to failure, a set past the plan), unless the
 * program logs effort freely.
 */
export const effortRequired = (mode: EffortMode, prescribed: boolean): boolean =>
  prescribed && mode !== 'free';

/**
 * The open end of the professional scale: 1–4 in reserve, then "5+", anything
 * easier than four. The sheet stores it as 5; a larger stored value (an older
 * build, an import) reads as the same "5+".
 */
export const RIR_OPEN_END = 5;

/** A reserve as the scale names it: "2", or "5+" from the open end on. */
export const rirText = (rir: number): string =>
  rir >= RIR_OPEN_END ? `${RIR_OPEN_END}+` : `${rir}`;

/** What a logged set says about its effort (`set_logs.rir` / `is_failure`). */
export type LoggedEffort = { rir?: number | null; isFailure?: boolean | null };

/** The simple scale, hardest first: the order the sheet lists them. */
export const EFFORT_BANDS = ['failure', 'hard', 'moderate', 'easy'] as const;

export type EffortBand = (typeof EFFORT_BANDS)[number];

/**
 * What a band stores, on the professional columns: the fewest reps in reserve
 * of the range it names (hard 1–2 stores 1; easy is the scale's open end).
 */
export const BAND_EFFORT: Readonly<Record<EffortBand, Effort>> = {
  failure: { rir: 0, failure: true },
  hard: { rir: 1, failure: false },
  moderate: { rir: 3, failure: false },
  easy: { rir: RIR_OPEN_END, failure: false },
};

/**
 * The band a stored effort reads as — the ONE mapping every simple-mode display
 * goes through, so a set logged on the professional scale reads too: failure
 * (the flag wins over its stored `rir: 0`), up to 2 in reserve hard, 3–4
 * moderate, the open end (5+) easy. Null when the set carries no effort.
 */
export const effortBand = ({ rir, isFailure }: LoggedEffort): EffortBand | null => {
  if (isFailure) return 'failure';
  if (rir == null) return null;
  if (rir <= 2) return 'hard';
  if (rir < RIR_OPEN_END) return 'moderate';
  return 'easy';
};
