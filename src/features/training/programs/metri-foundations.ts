import type { Locale } from '@/i18n';

import type { ProgramSeed, SlotSeed, WeekSeed } from './types';

/**
 * "Metri Foundations" — 12-week beginner powerbuilding base. Three phases of
 * four weeks (the third as four 1-week routines, so its two sides alternate
 * week by week: A·B·A, B·A·B, A·B·A, B·A·B, the order the sheets recommend),
 * every working set to technical failure (no RIR anywhere). Rests: the sheets
 * say 2 to 3 minutes between sets, for every exercise — 2 by default, 3 on the
 * heavy compounds — encoded on both the slot default and every week.
 */

const REST_DEFAULT = 120;
const REST_HEAVY = 180;

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
    { exerciseId: 'back-extension', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
    { exerciseId: 'cable-crunch', restSeconds: REST_DEFAULT, weeks: ramp(20, REST_DEFAULT) },
    { exerciseId: 'standing-calf-raise', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
    { exerciseId: 'standing-leg-curl', restSeconds: REST_DEFAULT, weeks: ramp(12, REST_DEFAULT) },
    { exerciseId: 'leg-press', restSeconds: REST_HEAVY, weeks: ramp(12, REST_HEAVY) },
    { exerciseId: 'machine-chest-press', restSeconds: REST_HEAVY, weeks: ramp(12, REST_HEAVY) },
    {
      exerciseId: 'supinated-lat-pulldown',
      restSeconds: REST_DEFAULT,
      weeks: ramp(12, REST_DEFAULT),
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

/** The column of a 4-week prescription a 1-week phase-3 routine runs (0-based week). */
type Week = 0 | 1 | 2 | 3;
const col = (weeks: WeekSeed[], week: Week): WeekSeed[] => [weeks[week]];

/** Cue on the false pyramids: the sheets ask for ONE weight, the 8-rep max, across the sets. */
const SAME_WEIGHT = ['Mismo peso'];

const phase3SideA = (week: Week): SlotSeed[] => [
  // The sheet draws the seated ab-crunch machine here.
  {
    exerciseId: 'machine-crunch',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 3, 3, 2], 20, REST_DEFAULT), week),
  },
  {
    exerciseId: 'barbell-bench-press',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
  {
    exerciseId: 'incline-bench-press',
    restSeconds: REST_HEAVY,
    weeks: col(fixedRow([3, 3, 3, 2], 8, REST_HEAVY), week),
  },
  // "Aperturas" with a pec-deck drawing.
  {
    exerciseId: 'machine-fly',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([3, 3, 3, 2], 8, REST_DEFAULT), week),
  },
  {
    exerciseId: 'seated-barbell-press',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
  {
    exerciseId: 'seated-dumbbell-press',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
  {
    exerciseId: 'close-grip-bench-press',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
];

const phase3SideB = (week: Week): SlotSeed[] => [
  {
    exerciseId: 'cable-crunch',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 4, 4, 4], 20, REST_DEFAULT), week),
  },
  {
    exerciseId: 'lying-leg-curl',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 4, 3, 2], 10, REST_DEFAULT), week),
  },
  {
    exerciseId: 'leg-extension',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 3, 3, 2], 10, REST_DEFAULT), week),
  },
  {
    exerciseId: 'barbell-back-squat',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
  {
    exerciseId: 'romanian-deadlift',
    restSeconds: REST_HEAVY,
    weeks: col(falsePyramid(REST_HEAVY), week),
    badges: SAME_WEIGHT,
  },
  // Two grips, two exercises: their loads and their set counts never mix.
  {
    exerciseId: 'close-grip-lat-pulldown',
    restSeconds: REST_DEFAULT,
    weeks: col(falsePyramid(REST_DEFAULT), week),
    badges: SAME_WEIGHT,
  },
  {
    exerciseId: 'wide-grip-lat-pulldown',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 3, 3, 2], 8, REST_DEFAULT), week),
  },
  {
    exerciseId: 'barbell-curl',
    restSeconds: REST_DEFAULT,
    weeks: col(fixedRow([4, 3, 3, 2], 8, REST_DEFAULT), week),
  },
];

const phase3Day = (slug: string, name: string, side: 'a' | 'b', week: Week): DaySeed => ({
  slug,
  name,
  focusMuscles:
    side === 'a'
      ? ['chest', 'shoulders', 'triceps', 'core']
      : ['quads', 'hamstrings', 'back', 'biceps', 'core'],
  exercises: side === 'a' ? phase3SideA(week) : phase3SideB(week),
});

/** A phase-3 week: A·B·A on weeks 1 and 3, B·A·B on weeks 2 and 4. */
const phase3Week = (week: Week): ProgramSeed['routines'][number] => {
  const aba = week % 2 === 0;
  return {
    slug: `r3w${week + 1}`,
    name: `Phase 3 — Week ${week + 1} (${aba ? 'A·B·A' : 'B·A·B'})`,
    orderIndex: 3 + week,
    durationWeeks: 1,
    // The program's last week: the one moment a beginner's rep max is worth testing.
    ...(week === 3 ? { rmTestWeek: 1 } : {}),
    days: aba
      ? [
          phase3Day('a', 'Side A', 'a', week),
          phase3Day('b', 'Side B', 'b', week),
          phase3Day('a2', 'Side A (2nd)', 'a', week),
        ]
      : [
          phase3Day('b', 'Side B', 'b', week),
          phase3Day('a', 'Side A', 'a', week),
          phase3Day('b2', 'Side B (2nd)', 'b', week),
        ],
  };
};

export const METRI_FOUNDATIONS: ProgramSeed = {
  id: 'metri-foundations',
  name: 'Metri Foundations',
  description:
    'Three-month beginner powerbuilding base: three 4-week phases, training 3 days per week. ' +
    'Every working set goes to technical failure — no RIR — with 2 to 3 minutes of rest between sets ' +
    '(3 on the heavy compounds). ' +
    'Phase 1 is full body with fixed sets, phase 2 splits into sides A/B/C adding free weights, ' +
    'and phase 3 alternates sides A and B three days a week (A-B-A one week, B-A-B the next) mixing fixed sets with 8-6-4 false pyramids.',
  durationWeeks: 12,
  routines: [
    {
      slug: 'r1',
      name: 'Phase 1 — Full Body',
      orderIndex: 1,
      days: [
        // One session repeated twelve times ("1º…12º entreno"): the three
        // days only differ in week 1's ramp.
        phase1Day('d1', 'Session 1', 2),
        phase1Day('d2', 'Session 2', 3),
        phase1Day('d3', 'Session 3', 3),
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
              restSeconds: REST_DEFAULT,
              weeks: [
                w(2, 12, REST_DEFAULT),
                w(3, 12, REST_DEFAULT),
                w(3, 12, REST_DEFAULT),
                w(4, 12, REST_DEFAULT),
              ],
            },
            {
              exerciseId: 'cable-crunch',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 3, 3, 2], 20, REST_DEFAULT),
            },
            {
              exerciseId: 'standing-calf-raise',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 3, 2], 15, REST_DEFAULT),
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
              exerciseId: 'supinated-lat-pulldown',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 3, 2], 8, REST_DEFAULT),
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
            // Two abdominal rows: the sheet draws a decline-bench sit-up, then the kneeling cable crunch.
            {
              exerciseId: 'decline-sit-up',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 4, 4], 20, REST_DEFAULT),
            },
            {
              exerciseId: 'cable-crunch',
              restSeconds: REST_DEFAULT,
              weeks: fixedRow([4, 4, 4, 4], 20, REST_DEFAULT),
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
              restSeconds: REST_DEFAULT,
              weeks: [
                w(2, 12, REST_DEFAULT),
                w(3, 12, REST_DEFAULT),
                w(3, 12, REST_DEFAULT),
                w(4, 12, REST_DEFAULT),
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
    // Phase 3 trains three fixed days a week, alternating the two sides week
    // by week (the routine model has one fixed set of days per routine).
    phase3Week(0),
    phase3Week(1),
    phase3Week(2),
    phase3Week(3),
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
    name: 'Metri Cimientos',
    description:
      'Base de powerbuilding de tres meses para empezar: tres fases de 4 semanas, entrenando 3 días por semana. ' +
      'Todas las series efectivas van al fallo técnico —sin RIR—, con 2 a 3 minutos de descanso entre series ' +
      '(3 en los compuestos pesados). ' +
      'La fase 1 es full body con series fijas, la fase 2 se divide en caras A/B/C incorporando peso libre ' +
      'y la fase 3 alterna las caras A y B tres días por semana (A-B-A una semana, B-A-B la siguiente) combinando series fijas y falsos piramidales 8-6-4.',
    routines: {
      r1: 'Fase 1 — Full body',
      r2: 'Fase 2 — Caras A/B/C',
      r3w1: 'Fase 3 — Semana 1 (A·B·A)',
      r3w2: 'Fase 3 — Semana 2 (B·A·B)',
      r3w3: 'Fase 3 — Semana 3 (A·B·A)',
      r3w4: 'Fase 3 — Semana 4 (B·A·B)',
    },
    days: {
      'r1.d1': 'Entreno 1',
      'r1.d2': 'Entreno 2',
      'r1.d3': 'Entreno 3',
      'r2.a': 'Cara A',
      'r2.b': 'Cara B',
      'r2.c': 'Cara C',
      'r3w1.a': 'Cara A',
      'r3w1.b': 'Cara B',
      'r3w1.a2': 'Cara A (2.ª)',
      'r3w2.b': 'Cara B',
      'r3w2.a': 'Cara A',
      'r3w2.b2': 'Cara B (2.ª)',
      'r3w3.a': 'Cara A',
      'r3w3.b': 'Cara B',
      'r3w3.a2': 'Cara A (2.ª)',
      'r3w4.b': 'Cara B',
      'r3w4.a': 'Cara A',
      'r3w4.b2': 'Cara B (2.ª)',
    },
  },
  en: {
    name: 'Metri Foundations',
    description:
      'Three-month beginner powerbuilding base: three 4-week phases, training 3 days per week. ' +
      'Every working set goes to technical failure — no RIR — with 2 to 3 minutes of rest between sets ' +
      '(3 on the heavy compounds). ' +
      'Phase 1 is full body with fixed sets, phase 2 splits into sides A/B/C adding free weights, ' +
      'and phase 3 alternates sides A and B three days a week (A-B-A one week, B-A-B the next) mixing fixed sets with 8-6-4 false pyramids.',
    routines: {
      r1: 'Phase 1 — Full Body',
      r2: 'Phase 2 — Sides A/B/C',
      r3w1: 'Phase 3 — Week 1 (A·B·A)',
      r3w2: 'Phase 3 — Week 2 (B·A·B)',
      r3w3: 'Phase 3 — Week 3 (A·B·A)',
      r3w4: 'Phase 3 — Week 4 (B·A·B)',
    },
    days: {
      'r1.d1': 'Session 1',
      'r1.d2': 'Session 2',
      'r1.d3': 'Session 3',
      'r2.a': 'Side A',
      'r2.b': 'Side B',
      'r2.c': 'Side C',
      'r3w1.a': 'Side A',
      'r3w1.b': 'Side B',
      'r3w1.a2': 'Side A (2nd)',
      'r3w2.b': 'Side B',
      'r3w2.a': 'Side A',
      'r3w2.b2': 'Side B (2nd)',
      'r3w3.a': 'Side A',
      'r3w3.b': 'Side B',
      'r3w3.a2': 'Side A (2nd)',
      'r3w4.b': 'Side B',
      'r3w4.a': 'Side A',
      'r3w4.b2': 'Side B (2nd)',
    },
  },
};
