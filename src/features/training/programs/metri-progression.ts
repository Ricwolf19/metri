import type { SetGroup } from '@/db/schema';
import type { Locale } from '@/i18n';

import type { ProgramSeed, WeekSeed } from './types';

/**
 * "Metri Progression" — 3 phases x 4 weeks, 4 days/week (sides A-D).
 * Every slot carries its explicit four-week prescription (phase 1/2/3,
 * sides A-D). Rule: any
 * cell without an RIR token is taken to failure ("todo lo que no indica RIR es
 * al FALLO").
 */

/** "3 min" rest — big lifts and presses. */
const REST_MAIN = 180;
/** "2 min" rest — accessories. */
const REST_ACCESSORY = 120;

/** `SxR RIR a-b · rest` cell (single RIR value → a === b). */
const rir = (
  sets: number,
  reps: number,
  rirMin: number,
  rirMax: number,
  restSeconds: number,
): WeekSeed => ({ sets, reps, rirMin, rirMax, restSeconds });

/** `SxR FALLO · rest` cell — also bare `SxR` cells (no effort token → failure). */
const fail = (sets: number, reps: number, restSeconds: number): WeekSeed => ({
  sets,
  reps,
  toFailure: true,
  restSeconds,
});

const groupRir = (sets: number, reps: number, rirMin: number, rirMax: number): SetGroup => ({
  sets,
  reps,
  rirMin,
  rirMax,
});

const groupFail = (sets: number, reps: number): SetGroup => ({ sets, reps, toFailure: true });

/** Week-4 "top set + back-offs" cell; flat fields mirror the first group. */
const ladder = (top: SetGroup, backOff: SetGroup, restSeconds: number): WeekSeed => ({
  ...top,
  restSeconds,
  setGroups: [top, backOff],
});

const PUSH_FOCUS = ['chest', 'shoulders', 'triceps'];
const LEGS_PULL_FOCUS = ['quads', 'hamstrings', 'glutes', 'back', 'biceps'];

export const METRI_PROGRESSION: ProgramSeed = {
  id: 'metri-progression',
  name: 'Metri Progression',
  description:
    'A 12-week powerbuilding program: 3 phases of 4 weeks, training 4 days per week (sides A-D). Intensity is set with RIR and tightens week by week, peaking in week 4 with a top set to failure followed by back-off sets. Rests are prescribed in the plan: 3 minutes on the big lifts and presses, 2 minutes on accessories.',
  durationWeeks: 12,
  routines: [
    // ── Phase 1 (month 1) — paused bench (1 s) and paused squat ────────────
    {
      slug: 'p1',
      name: 'Phase 1',
      orderIndex: 1,
      days: [
        {
          slug: 'a',
          name: 'Side A — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              badges: ['Pausa 1s'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 6, 3, 4, REST_MAIN),
                rir(4, 6, 2, 3, REST_MAIN),
                rir(4, 6, 1, 2, REST_MAIN),
                ladder(groupRir(1, 6, 0, 0), groupRir(3, 6, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'incline-bench-press',
              badges: ['Mancuernas'],
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'dumbbell-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'lateral-raise',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-overhead-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'skullcrusher',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'b',
          name: 'Side B — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-back-squat',
              badges: ['Pausa 1s'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 4, 3, 4, REST_MAIN),
                rir(4, 4, 2, 3, REST_MAIN),
                rir(4, 4, 1, 2, REST_MAIN),
                ladder(groupRir(1, 4, 0, 0), groupRir(3, 4, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'romanian-deadlift',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'leg-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'lat-pulldown',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'pullover',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'hammer-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'spider-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'c',
          name: 'Side C — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'incline-bench-press',
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 8, 3, 4, REST_MAIN),
                rir(4, 8, 2, 3, REST_MAIN),
                rir(4, 8, 1, 2, REST_MAIN),
                ladder(groupFail(1, 8), groupRir(2, 8, 3, 3), REST_MAIN),
              ],
            },
            {
              exerciseId: 'seated-dumbbell-press',
              badges: ['Pausa'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 3, 4, REST_MAIN),
                rir(3, 8, 2, 3, REST_MAIN),
                rir(3, 8, 1, 2, REST_MAIN),
                ladder(groupFail(1, 8), groupRir(2, 8, 3, 3), REST_MAIN),
              ],
            },
            {
              exerciseId: 'seated-dumbbell-press',
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'rear-delt-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-kickback',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'd',
          name: 'Side D — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'deadlift',
              alternativeExerciseIds: ['sumo-deadlift'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 4, 3, 4, REST_MAIN),
                rir(4, 4, 2, 3, REST_MAIN),
                rir(4, 4, 1, 2, REST_MAIN),
                ladder(groupRir(1, 4, 0, 0), groupRir(3, 4, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'hack-squat',
              alternativeExerciseIds: ['bulgarian-split-squat'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'machine-row',
              badges: ['Similar al dibujo'],
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'dumbbell-row',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'barbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'incline-dumbbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
      ],
    },
    // ── Phase 2 (month 2) — bench pause goes to 2 s, cable accessories ─────
    {
      slug: 'p2',
      name: 'Phase 2',
      orderIndex: 2,
      days: [
        {
          slug: 'a',
          name: 'Side A — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              badges: ['Pausa 2s'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 4, 3, 4, REST_MAIN),
                rir(4, 4, 2, 3, REST_MAIN),
                rir(4, 4, 1, 2, REST_MAIN),
                ladder(groupRir(1, 4, 0, 0), groupRir(3, 4, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'incline-bench-press',
              badges: ['Mancuernas'],
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'cable-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-lateral-raise',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-overhead-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'skullcrusher',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'b',
          name: 'Side B — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-back-squat',
              badges: ['Pausa 1s'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 6, 3, 4, REST_MAIN),
                rir(3, 6, 2, 3, REST_MAIN),
                rir(3, 6, 1, 2, REST_MAIN),
                ladder(groupRir(1, 6, 0, 0), groupRir(2, 6, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'romanian-deadlift',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'leg-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'lat-pulldown',
              badges: ['Agarre supino'],
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'pullover',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'hammer-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'spider-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'c',
          name: 'Side C — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'incline-bench-press',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 6, 3, 4, REST_MAIN),
                rir(3, 6, 2, 3, REST_MAIN),
                rir(3, 6, 1, 2, REST_MAIN),
                ladder(groupFail(1, 6), groupRir(2, 6, 3, 3), REST_MAIN),
              ],
            },
            {
              exerciseId: 'seated-dumbbell-press',
              badges: ['Pausa'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 6, 3, 4, REST_MAIN),
                rir(3, 6, 2, 3, REST_MAIN),
                rir(3, 6, 1, 2, REST_MAIN),
                // Canonical week-4 ladder for the week-3 scheme (3x6 RIR 1-2):
                // 1x6 RIR 0 + 2x6 RIR 3-4.
                ladder(groupRir(1, 6, 0, 0), groupRir(2, 6, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'seated-dumbbell-press',
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'rear-delt-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-kickback',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'd',
          name: 'Side D — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'deadlift',
              alternativeExerciseIds: ['sumo-deadlift'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 6, 3, 4, REST_MAIN),
                rir(3, 6, 2, 3, REST_MAIN),
                rir(3, 6, 1, 2, REST_MAIN),
                ladder(groupRir(1, 6, 0, 0), groupRir(2, 6, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'hack-squat',
              alternativeExerciseIds: ['bulgarian-split-squat'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'machine-row',
              badges: ['Similar al dibujo'],
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'dumbbell-row',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'barbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'incline-dumbbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
      ],
    },
    // ── Phase 3 (month 3) — no pauses, higher reps ─────────────────────────
    {
      slug: 'p3',
      name: 'Phase 3',
      orderIndex: 3,
      days: [
        {
          slug: 'a',
          name: 'Side A — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-bench-press',
              restSeconds: REST_MAIN,
              weeks: [
                rir(4, 8, 3, 4, REST_MAIN),
                rir(4, 8, 2, 3, REST_MAIN),
                rir(4, 8, 1, 2, REST_MAIN),
                ladder(groupRir(1, 8, 0, 0), groupRir(3, 8, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'incline-bench-press',
              badges: ['Mancuernas'],
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(4, 8, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 'cable-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'cable-lateral-raise',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'overhead-tricep-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'french-press',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'b',
          name: 'Side B — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'barbell-back-squat',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 3, 4, REST_MAIN),
                rir(3, 8, 2, 3, REST_MAIN),
                rir(3, 8, 1, 2, REST_MAIN),
                ladder(groupRir(1, 8, 0, 0), groupRir(2, 8, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'romanian-deadlift',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 12, 2, 2, REST_MAIN),
                rir(3, 12, 2, 2, REST_MAIN),
                rir(3, 12, 2, 2, REST_MAIN),
                fail(3, 12, REST_MAIN),
              ],
            },
            {
              exerciseId: 'leg-extension',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'lat-pulldown',
              badges: ['Agarre supino'],
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'pullover',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'hammer-curl',
              badges: ['Polea'],
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'preacher-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
                fail(3, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'c',
          name: 'Side C — Chest, shoulders, triceps',
          focusMuscles: PUSH_FOCUS,
          exercises: [
            {
              exerciseId: 'incline-bench-press',
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 3, 4, REST_MAIN),
                rir(3, 8, 2, 3, REST_MAIN),
                rir(3, 8, 1, 2, REST_MAIN),
                ladder(groupFail(1, 8), groupRir(2, 8, 3, 3), REST_MAIN),
              ],
            },
            {
              exerciseId: 'seated-dumbbell-press',
              badges: ['Pausa'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 3, 4, REST_MAIN),
                rir(3, 8, 2, 3, REST_MAIN),
                rir(3, 8, 1, 2, REST_MAIN),
                ladder(groupFail(1, 8), groupRir(2, 8, 3, 3), REST_MAIN),
              ],
            },
            {
              exerciseId: 'machine-shoulder-press',
              restSeconds: REST_MAIN,
              weeks: [
                fail(4, 12, REST_MAIN),
                fail(4, 12, REST_MAIN),
                fail(4, 12, REST_MAIN),
                fail(3, 12, REST_MAIN),
              ],
            },
            {
              exerciseId: 'rear-delt-fly',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
                fail(5, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'tricep-pushdown',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
          ],
        },
        {
          slug: 'd',
          name: 'Side D — Legs, back, biceps',
          focusMuscles: LEGS_PULL_FOCUS,
          exercises: [
            {
              exerciseId: 'deadlift',
              alternativeExerciseIds: ['sumo-deadlift'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 3, 4, REST_MAIN),
                rir(3, 8, 2, 3, REST_MAIN),
                rir(3, 8, 1, 2, REST_MAIN),
                // Canonical week-4 ladder for the week-3 scheme (3x8 RIR 1-2):
                // 1x8 RIR 0 + 2x8 RIR 3-4.
                ladder(groupRir(1, 8, 0, 0), groupRir(2, 8, 3, 4), REST_MAIN),
              ],
            },
            {
              exerciseId: 'hack-squat',
              alternativeExerciseIds: ['bulgarian-split-squat'],
              restSeconds: REST_MAIN,
              weeks: [
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                rir(3, 8, 2, 2, REST_MAIN),
                fail(3, 8, REST_MAIN),
              ],
            },
            {
              exerciseId: 't-bar-row',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
                fail(4, 10, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'seated-cable-row',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
                fail(4, 12, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'barbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
                fail(3, 8, REST_ACCESSORY),
              ],
            },
            {
              exerciseId: 'incline-dumbbell-curl',
              restSeconds: REST_ACCESSORY,
              weeks: [
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(4, 15, REST_ACCESSORY),
                fail(3, 15, REST_ACCESSORY),
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Localized program, routine, and day names. Day keys: `${routineSlug}.${daySlug}`. */
export const PROGRESSION_CONTENT: Record<
  Locale,
  {
    name: string;
    description: string;
    routines: Record<string, string>;
    days: Record<string, string>;
  }
> = {
  es: {
    name: 'Progresión',
    description:
      'Programa de powerbuilding de 12 semanas: 3 fases de 4 semanas, con 4 días por semana (caras A-D). La intensidad se mide con RIR y se recorta semana a semana hasta llegar en la semana 4 a una serie tope al fallo seguida de series de descarga. Los descansos vienen fijados en el plan: 3 minutos en básicos y presses, 2 minutos en accesorios.',
    routines: {
      p1: 'Fase 1',
      p2: 'Fase 2',
      p3: 'Fase 3',
    },
    days: {
      'p1.a': 'Cara A — Pecho, hombro, tríceps',
      'p1.b': 'Cara B — Pierna, espalda, bíceps',
      'p1.c': 'Cara C — Pecho, hombro, tríceps',
      'p1.d': 'Cara D — Pierna, espalda, bíceps',
      'p2.a': 'Cara A — Pecho, hombro, tríceps',
      'p2.b': 'Cara B — Pierna, espalda, bíceps',
      'p2.c': 'Cara C — Pecho, hombro, tríceps',
      'p2.d': 'Cara D — Pierna, espalda, bíceps',
      'p3.a': 'Cara A — Pecho, hombro, tríceps',
      'p3.b': 'Cara B — Pierna, espalda, bíceps',
      'p3.c': 'Cara C — Pecho, hombro, tríceps',
      'p3.d': 'Cara D — Pierna, espalda, bíceps',
    },
  },
  en: {
    name: 'Metri Progression',
    description:
      'A 12-week powerbuilding program: 3 phases of 4 weeks, training 4 days per week (sides A-D). Intensity is set with RIR and tightens week by week, peaking in week 4 with a top set to failure followed by back-off sets. Rests are prescribed in the plan: 3 minutes on the big lifts and presses, 2 minutes on accessories.',
    routines: {
      p1: 'Phase 1',
      p2: 'Phase 2',
      p3: 'Phase 3',
    },
    days: {
      'p1.a': 'Side A — Chest, shoulders, triceps',
      'p1.b': 'Side B — Legs, back, biceps',
      'p1.c': 'Side C — Chest, shoulders, triceps',
      'p1.d': 'Side D — Legs, back, biceps',
      'p2.a': 'Side A — Chest, shoulders, triceps',
      'p2.b': 'Side B — Legs, back, biceps',
      'p2.c': 'Side C — Chest, shoulders, triceps',
      'p2.d': 'Side D — Legs, back, biceps',
      'p3.a': 'Side A — Chest, shoulders, triceps',
      'p3.b': 'Side B — Legs, back, biceps',
      'p3.c': 'Side C — Chest, shoulders, triceps',
      'p3.d': 'Side D — Legs, back, biceps',
    },
  },
};
