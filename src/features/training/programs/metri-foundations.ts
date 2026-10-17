import type { Locale } from '@/i18n';

import type { ProgramSeed, SlotSeed, WeekSeed } from './types';

/**
 * "Metri Foundations" — 12-week beginner powerbuilding base. Three phases of
 * four weeks (the third as two 2-week routines so it keeps three fixed
 * sessions a week while alternating its two sides), every working set to
 * technical failure (no RIR anywhere). Rests: ~2 min default, up to 3 min on heavy compounds, ~1.5 min
 * on abs/calves/hyperextensions — encoded on both the slot default and every
 * week.
 */

const REST_DEFAULT = 120;
const REST_HEAVY = 180;
const REST_LIGHT = 90;

type DaySeed = ProgramSeed['routines'][number]['days'][number];

/** Fixed scheme, always to failure. */
const w = (sets: number, reps: number, restSeconds: number): WeekSeed => ({
  sets,
  reps,
  toFailure: true,
  restSeconds,
});

/** Sets vary per week, reps stay constant. */
const fixedRow = (
  setsPerWeek: [number, number, number, number],
  reps: number,
  restSeconds: number,
): WeekSeed[] => setsPerWeek.map((sets) => w(sets, reps, restSeconds));

/** Descending "false pyramid" week (e.g. 8-6-4: same weight, reps drop). */
const descending = (repsPerSet: number[], restSeconds: number): WeekSeed => ({
  sets: repsPerSet.length,
  reps: Math.min(...repsPerSet),
  repsMax: Math.max(...repsPerSet),
  toFailure: true,
  restSeconds,
  setGroups: repsPerSet.map((reps) => ({ sets: 1, reps, toFailure: true })),
});

/** The phase-3 pattern used by every pyramid row: 3x 8-6-4, 3x 8-6-4, 2x 8-6, 2x 8-6. */
const falsePyramid = (restSeconds: number): WeekSeed[] => [
  descending([8, 6, 4], restSeconds),
  descending([8, 6, 4], restSeconds),
  descending([8, 6], restSeconds),
  descending([8, 6], restSeconds),
];

/**
 * Phase 1 ramps per SESSION (the first sessions build volume, then settle at
 * max sets). Encoded per day: week 1 uses that day's ramp column (session 1,
 * 2 or 3), weeks 2–4 use the settled 4-set scheme every exercise reaches.
 */
const phase1Slots = (week1Sets: number): SlotSeed[] => {
  const ramp = (reps: number, restSeconds: number): WeekSeed[] => [
    w(week1Sets, reps, restSeconds),
    w(4, reps, restSeconds),
    w(4, reps, restSeconds),
    w(4, reps, restSeconds),
  ];
  return [
    { exerciseId: 'back-extension', restSeconds: REST_LIGHT, weeks: ramp(12, REST_LIGHT) },
    { exerciseId: 'cable-crunch', restSeconds: REST_LIGHT, weeks: ramp(20, REST_LIGHT) },
    { exerciseId: 'standing-calf-raise', restSeconds: REST_LIGHT, weeks: ramp(12, REST_LIGHT) },
    { exerciseId: 'standing-leg-curl', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
    { exerciseId: 'leg-press', restSeconds: REST_HEAVY, weeks: ramp(12, REST_HEAVY) },
    { exerciseId: 'machine-chest-press', restSeconds: REST_HEAVY, weeks: ramp(12, REST_HEAVY) },
    {
      exerciseId: 'lat-pulldown',
      restSeconds: REST_DEFAULT,
      weeks: ramp(12, REST_DEFAULT),
      badges: ['Agarre supino'],
    },
    { exerciseId: 'barbell-curl', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
    { exerciseId: 'seated-barbell-press', restSeconds: REST_HEAVY, weeks: ramp(12, REST_HEAVY) },
    // PB1 "press francés": the course's technique video is the lying two-dumbbell press.
    { exerciseId: 'skullcrusher', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
  ];
};

const phase1Day = (slug: string, name: string, week1Sets: number): DaySeed => ({
  slug,
  name,
  focusMuscles: ['full_body'],
  exercises: phase1Slots(week1Sets),
});

/** Which two of a 4-week prescription a 2-week routine runs. */
type Half = 'first' | 'second';
const half = (weeks: WeekSeed[], which: Half): WeekSeed[] =>
  which === 'first' ? weeks.slice(0, 2) : weeks.slice(2, 4);

const phase3SideA = (which: Half): SlotSeed[] => [
  {
    exerciseId: 'cable-crunch',
    restSeconds: REST_LIGHT,
    weeks: half(fixedRow([4, 3, 3, 2], 20, REST_LIGHT), which),
  },
  {
    exerciseId: 'barbell-bench-press',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
  {
    exerciseId: 'incline-bench-press',
    restSeconds: REST_HEAVY,
    weeks: half(fixedRow([3, 3, 3, 2], 8, REST_HEAVY), which),
  },
  {
    exerciseId: 'dumbbell-fly',
    restSeconds: REST_DEFAULT,
    weeks: half(fixedRow([3, 3, 3, 2], 8, REST_DEFAULT), which),
  },
  {
    exerciseId: 'seated-barbell-press',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
  {
    exerciseId: 'seated-dumbbell-press',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
  {
    exerciseId: 'close-grip-bench-press',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
];

const phase3SideB = (which: Half): SlotSeed[] => [
  {
    exerciseId: 'cable-crunch',
    restSeconds: REST_LIGHT,
    weeks: half(fixedRow([4, 4, 4, 4], 20, REST_LIGHT), which),
  },
  {
    exerciseId: 'lying-leg-curl',
    restSeconds: REST_DEFAULT,
    weeks: half(fixedRow([4, 4, 3, 2], 10, REST_DEFAULT), which),
  },
  {
    exerciseId: 'leg-extension',
    restSeconds: REST_DEFAULT,
    weeks: half(fixedRow([4, 3, 3, 2], 10, REST_DEFAULT), which),
  },
  {
    exerciseId: 'barbell-back-squat',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
  {
    exerciseId: 'romanian-deadlift',
    restSeconds: REST_HEAVY,
    weeks: half(falsePyramid(REST_HEAVY), which),
  },
  {
    exerciseId: 'lat-pulldown',
    restSeconds: REST_DEFAULT,
    weeks: half(falsePyramid(REST_DEFAULT), which),
    badges: ['Agarre estrecho'],
  },
  {
    exerciseId: 'lat-pulldown',
    restSeconds: REST_DEFAULT,
    weeks: half(fixedRow([4, 3, 3, 2], 8, REST_DEFAULT), which),
    badges: ['Agarre ancho'],
  },
  {
    exerciseId: 'barbell-curl',
    restSeconds: REST_DEFAULT,
    weeks: half(fixedRow([4, 3, 3, 2], 8, REST_DEFAULT), which),
  },
];

const phase3Day = (slug: string, name: string, side: 'a' | 'b', which: Half): DaySeed => ({
  slug,
  name,
  focusMuscles:
    side === 'a'
      ? ['chest', 'shoulders', 'triceps', 'core']
      : ['quads', 'hamstrings', 'back', 'biceps', 'core'],
  exercises: side === 'a' ? phase3SideA(which) : phase3SideB(which),
});

export const METRI_FOUNDATIONS: ProgramSeed = {
  id: 'metri-foundations',
  name: 'Metri Foundations',
  description:
    'Three-month beginner powerbuilding base: three 4-week phases, training 3 days per week. ' +
    'Every working set goes to technical failure — no RIR — with ~2-minute rests ' +
    '(up to 3 on the heavy compounds, ~1.5 on abs, calves and hyperextensions). ' +
    'Phase 1 is full body with fixed sets, phase 2 splits into sides A/B/C adding free weights, ' +
    'and phase 3 alternates sides A and B three days a week (A-B-A, then B-A-B) mixing fixed sets with 8-6-4 false pyramids.',
  durationWeeks: 12,
  routines: [
    {
      slug: 'r1',
      name: 'Phase 1 — Full Body',
      orderIndex: 1,
      days: [
        phase1Day('d1', 'Workout A', 2),
        phase1Day('d2', 'Workout B', 3),
        phase1Day('d3', 'Workout C', 3),
      ],
    },
    {
      slug: 'r2',
      name: 'Phase 2 — Sides A/B/C',
      orderIndex: 2,
      days: [
        {
          slug: 'a',
          name: 'Side A',
          focusMuscles: ['full_body'],
          exercises: [
            {
              exerciseId: 'back-extension',
              restSeconds: REST_LIGHT,
              weeks: [
                w(2, 12, REST_LIGHT),
                w(3, 12, REST_LIGHT),
                w(3, 12, REST_LIGHT),
                w(4, 12, REST_LIGHT),
              ],
            },
            {
              exerciseId: 'cable-crunch',
              restSeconds: REST_LIGHT,
              weeks: fixedRow([4, 3, 3, 2], 20, REST_LIGHT),
            },
            {
              exerciseId: 'standing-calf-raise',
              restSeconds: REST_LIGHT,
              weeks: fixedRow([4, 4, 3, 2], 15, REST_LIGHT),
            },
            {
              exerciseId: 'barbell-back-squat',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 8, REST_HEAVY),
            },
            {
              exerciseId: 'barbell-bench-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 8, REST_HEAVY),
            },
            {
              exerciseId: 'lat-pulldown',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 3, 2], 8, REST_DEFAULT),
              badges: ['Agarre supino'],
            },
            {
              exerciseId: 'seated-barbell-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 8, REST_HEAVY),
            },
          ],
        },
        {
          slug: 'b',
          name: 'Side B',
          focusMuscles: ['chest', 'shoulders', 'triceps', 'core'],
          exercises: [
            {
              exerciseId: 'cable-crunch',
              restSeconds: REST_LIGHT,
              weeks: fixedRow([4, 4, 4, 4], 20, REST_LIGHT),
            },
            {
              exerciseId: 'cable-crunch',
              restSeconds: REST_LIGHT,
              weeks: fixedRow([4, 4, 4, 4], 20, REST_LIGHT),
            },
            {
              exerciseId: 'barbell-bench-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'incline-bench-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'dumbbell-fly',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 3, 3, 2], 10, REST_DEFAULT),
            },
            {
              exerciseId: 'seated-barbell-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'seated-dumbbell-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 3, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'close-grip-bench-press',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 3, 3, 2], 10, REST_HEAVY),
            },
          ],
        },
        {
          slug: 'c',
          name: 'Side C',
          focusMuscles: ['quads', 'hamstrings', 'back', 'biceps', 'calves'],
          exercises: [
            {
              exerciseId: 'standing-calf-raise',
              restSeconds: REST_LIGHT,
              weeks: [
                w(2, 12, REST_LIGHT),
                w(3, 12, REST_LIGHT),
                w(3, 12, REST_LIGHT),
                w(4, 12, REST_LIGHT),
              ],
            },
            {
              exerciseId: 'lying-leg-curl',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 3, 3, 2], 10, REST_DEFAULT),
            },
            {
              exerciseId: 'leg-extension',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 3, 2], 12, REST_DEFAULT),
            },
            {
              exerciseId: 'barbell-back-squat',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'romanian-deadlift',
              restSeconds: REST_HEAVY,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_HEAVY),
            },
            {
              exerciseId: 'lat-pulldown',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([5, 5, 5, 4], 10, REST_DEFAULT),
              badges: ['Agarre prono'],
            },
            {
              exerciseId: 'barbell-curl',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 3, 2], 10, REST_DEFAULT),
            },
          ],
        },
      ],
    },
    // Phase 3 trains three fixed days a week like the other phases, alternating
    // the two sides: A·B·A for two weeks, then B·A·B for two. Modelled as two
    // 2-week routines (the routine model has one fixed set of days per week).
    {
      slug: 'r3a',
      name: 'Phase 3 — Weeks 1–2 (A·B·A)',
      orderIndex: 3,
      durationWeeks: 2,
      days: [
        phase3Day('a', 'Side A', 'a', 'first'),
        phase3Day('b', 'Side B', 'b', 'first'),
        phase3Day('a2', 'Side A (2nd)', 'a', 'first'),
      ],
    },
    {
      slug: 'r3b',
      name: 'Phase 3 — Weeks 3–4 (B·A·B)',
      orderIndex: 4,
      durationWeeks: 2,
      // The program's last week: the one moment a beginner's rep max is worth testing.
      rmTestWeek: 2,
      days: [
        phase3Day('b', 'Side B', 'b', 'second'),
        phase3Day('a', 'Side A', 'a', 'second'),
        phase3Day('b2', 'Side B (2nd)', 'b', 'second'),
      ],
    },
  ],
};

/** Localized display copy, keyed by routine slug and `${routineSlug}.${daySlug}`. */
export const FOUNDATIONS_CONTENT: Record<
  Locale,
  {
    name: string;
    description: string;
    routines: Record<string, string>;
    days: Record<string, string>;
  }
> = {
  es: {
    name: 'Cimientos',
    description:
      'Base de powerbuilding de tres meses para empezar: tres fases de 4 semanas, entrenando 3 días por semana. ' +
      'Todas las series efectivas van al fallo técnico —sin RIR—, con descansos de ~2 minutos ' +
      '(hasta 3 en los compuestos pesados; ~1,5 en abdomen, gemelos e hiperextensiones). ' +
      'La fase 1 es full body con series fijas, la fase 2 se divide en caras A/B/C incorporando peso libre ' +
      'y la fase 3 alterna las caras A y B tres días por semana (A-B-A y luego B-A-B) combinando series fijas y falsos piramidales 8-6-4.',
    routines: {
      r1: 'Fase 1 — Full body',
      r2: 'Fase 2 — Caras A/B/C',
      r3a: 'Fase 3 — Semanas 1–2 (A·B·A)',
      r3b: 'Fase 3 — Semanas 3–4 (B·A·B)',
    },
    days: {
      'r1.d1': 'Entreno A',
      'r1.d2': 'Entreno B',
      'r1.d3': 'Entreno C',
      'r2.a': 'Cara A',
      'r2.b': 'Cara B',
      'r2.c': 'Cara C',
      'r3a.a': 'Cara A',
      'r3a.b': 'Cara B',
      'r3a.a2': 'Cara A (2.ª)',
      'r3b.b': 'Cara B',
      'r3b.a': 'Cara A',
      'r3b.b2': 'Cara B (2.ª)',
    },
  },
  en: {
    name: 'Metri Foundations',
    description:
      'Three-month beginner powerbuilding base: three 4-week phases, training 3 days per week. ' +
      'Every working set goes to technical failure — no RIR — with ~2-minute rests ' +
      '(up to 3 on the heavy compounds, ~1.5 on abs, calves and hyperextensions). ' +
      'Phase 1 is full body with fixed sets, phase 2 splits into sides A/B/C adding free weights, ' +
      'and phase 3 alternates sides A and B three days a week (A-B-A, then B-A-B) mixing fixed sets with 8-6-4 false pyramids.',
    routines: {
      r1: 'Phase 1 — Full Body',
      r2: 'Phase 2 — Sides A/B/C',
      r3a: 'Phase 3 — Weeks 1–2 (A·B·A)',
      r3b: 'Phase 3 — Weeks 3–4 (B·A·B)',
    },
    days: {
      'r1.d1': 'Workout A',
      'r1.d2': 'Workout B',
      'r1.d3': 'Workout C',
      'r2.a': 'Side A',
      'r2.b': 'Side B',
      'r2.c': 'Side C',
      'r3a.a': 'Side A',
      'r3a.b': 'Side B',
      'r3a.a2': 'Side A (2nd)',
      'r3b.b': 'Side B',
      'r3b.a': 'Side A',
      'r3b.b2': 'Side B (2nd)',
    },
  },
};
