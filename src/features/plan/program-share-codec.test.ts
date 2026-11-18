import { deflateSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import {
  addScannedCode,
  catalogRefs,
  crc32,
  encodeProgramShare,
  FRAME_CHARS,
  fromBase64Url,
  parseSharedProgram,
  programCounts,
  ShareTooLargeError,
  toBase64Url,
  type ScanStep,
  type ShareScan,
  type SharedProgram,
  type SharedWeek,
} from './program-share-codec';

const week = (weekNumber: number, over: Partial<SharedWeek> = {}): SharedWeek => ({
  weekNumber,
  sets: 3,
  reps: 8,
  repsMax: 10,
  rirMin: 2,
  rirMax: 3,
  toFailure: false,
  restSeconds: null,
  intensityType: 'rir',
  intensityValue: null,
  setGroups: null,
  ...over,
});

const CATALOG = [
  'barbell-back-squat',
  'barbell-bench-press',
  'barbell-row',
  'overhead-press',
  'romanian-deadlift',
  'lat-pulldown',
];

/** A realistic plan: 3 phases × 4 weeks, 4 splits, 6 exercises each, one custom. */
const program = (): SharedProgram => ({
  name: 'Strength block',
  description: 'Three phases, four days a week.',
  durationWeeks: 12,
  exercises: [
    {
      name: 'Cable Y raise',
      category: 'shoulders',
      equipment: 'cable',
      unilateral: true,
      primaryMuscles: ['side_delts'],
      secondaryMuscles: ['traps'],
      instructions: null,
    },
  ],
  routines: [1, 2, 3].map((phase) => ({
    name: `Phase ${phase}`,
    durationWeeks: 4,
    rmTestWeek: phase === 3 ? 4 : null,
    days: ['A', 'B', 'C', 'D'].map((split) => ({
      name: `Split ${split}`,
      slots: [...CATALOG.slice(0, 5), '#0'].map((exercise, i) => ({
        exercise,
        restSeconds: 120,
        notes: null,
        badges: i === 0 ? ['Pausa'] : [],
        alternatives: i === 1 ? ['dumbbell-bench-press'] : [],
        weeks: [1, 2, 3, 4].map((w) => week(w, { reps: 6 + phase, rirMin: 4 - w, rirMax: 4 - w })),
      })),
    })),
  })),
});

const shuffle = <T>(items: T[]): T[] => [...items].reverse();

/** Text deflate cannot shrink much: a seeded (xorshift) run of printable characters. */
const noise = (length: number, seed: number): string => {
  let x = seed + 1;
  return Array.from({ length }, () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return String.fromCharCode(33 + ((x >>> 0) % 90));
  }).join('');
};

const scanAll = (codes: string[]): ScanStep => {
  let scan: ShareScan = null;
  let step: ScanStep = { kind: 'foreign' };
  for (const code of codes) {
    step = addScannedCode(scan, code);
    if (step.kind === 'progress') scan = step.scan;
  }
  return step;
};

describe('encodeProgramShare / addScannedCode', () => {
  it('round-trips a program through its codes in any order', () => {
    const codes = encodeProgramShare(program());
    expect(codes.length).toBeGreaterThan(0);
    // Measured: the 72-slot fixture deflates to a handful of codes.
    expect(codes.length).toBeLessThanOrEqual(4);
    for (const c of codes) expect(c.length).toBeLessThanOrEqual(FRAME_CHARS + 32);
    expect(scanAll(shuffle(codes))).toEqual({ kind: 'complete', program: program() });
  });

  it('counts each code once however often the camera reports it', () => {
    const codes = encodeProgramShare({ ...program(), description: 'x'.repeat(1500) });
    const first = addScannedCode(null, codes[0]);
    expect(first).toMatchObject({ kind: 'progress', have: 1, fresh: true });
    if (first.kind !== 'progress') return;
    expect(addScannedCode(first.scan, codes[0])).toMatchObject({ have: 1, fresh: false });
  });

  it('tells a foreign code, a newer build and another program apart', () => {
    expect(addScannedCode(null, 'https://example.com')).toEqual({ kind: 'foreign' });
    expect(addScannedCode(null, 'metri:p9:00000000:1/1:abc')).toEqual({ kind: 'newer' });
    expect(addScannedCode(null, 'metri:p1:zz:1/1:abc')).toEqual({ kind: 'foreign' });

    const a = encodeProgramShare({ ...program(), description: 'a'.repeat(1500) });
    const b = encodeProgramShare({ ...program(), name: 'Other', description: 'b'.repeat(1500) });
    const step = addScannedCode(null, a[0]);
    if (step.kind !== 'progress') throw new Error('expected progress');
    expect(addScannedCode(step.scan, b[1] ?? b[0])).toEqual({ kind: 'other' });
  });

  it('rejects codes whose reassembly does not hash to their id', () => {
    const codes = encodeProgramShare(program());
    const last = codes[codes.length - 1];
    // Flip one payload character: the frame still parses, the CRC no longer matches.
    const tampered = last.slice(0, -1) + (last.endsWith('A') ? 'B' : 'A');
    expect(scanAll([...codes.slice(0, -1), tampered])).toEqual({ kind: 'corrupt' });
  });

  // A few KB of crafted zeros claim megabytes once inflated.
  it('refuses a payload that inflates past the cap', () => {
    const text = toBase64Url(deflateSync(new Uint8Array(3_000_000)));
    const id = crc32(text);
    const n = Math.ceil(text.length / FRAME_CHARS);
    const codes = Array.from(
      { length: n },
      (_, i) =>
        `metri:p1:${id}:${i + 1}/${n}:${text.slice(i * FRAME_CHARS, (i + 1) * FRAME_CHARS)}`,
    );
    expect(scanAll(codes)).toEqual({ kind: 'corrupt' });
  });

  // The inflater is fed a slice at a time so the cap bites before a bomb expands:
  // a payload spanning many slices must still come back whole.
  it('round-trips a payload that inflates across many slices', () => {
    const big = { ...program(), description: noise(2000, 7) };
    const codes = encodeProgramShare(big);
    // Over 2 KB of deflated bytes: at least three 1 KB slices.
    expect(codes.length * FRAME_CHARS * 0.75).toBeGreaterThan(2048);
    expect(scanAll(shuffle(codes))).toEqual({ kind: 'complete', program: big });
  });

  it('refuses to encode a program past the frame budget, with its own error', () => {
    const base = program();
    const huge: SharedProgram = {
      ...base,
      routines: base.routines.map((r, ri) => ({
        ...r,
        days: r.days.map((d, di) => ({
          ...d,
          slots: d.slots.map((s, si) => ({ ...s, notes: noise(500, ri * 100 + di * 10 + si) })),
        })),
      })),
    };
    expect(() => encodeProgramShare(huge)).toThrow(ShareTooLargeError);
  });
});

describe('parseSharedProgram', () => {
  const bad = (mutate: (p: Record<string, unknown>) => void) => {
    const p = JSON.parse(JSON.stringify(program())) as Record<string, unknown>;
    mutate(p);
    return parseSharedProgram(p);
  };
  const firstSlot = (p: Record<string, unknown>) =>
    (p as unknown as SharedProgram).routines[0].days[0].slots[0] as unknown as Record<
      string,
      unknown
    >;

  it('accepts a well-formed program and drops keys it does not know', () => {
    const p = { ...program(), userId: 'someone', extra: 1 };
    expect(parseSharedProgram(p)).toEqual(program());
  });

  it.each([
    [
      'an unknown category',
      (p: Record<string, unknown>) => {
        (p.exercises as Record<string, unknown>[])[0].category = 'neck';
      },
    ],
    [
      'an unknown muscle',
      (p: Record<string, unknown>) => {
        (p.exercises as Record<string, unknown>[])[0].primaryMuscles = ['spleen'];
      },
    ],
    [
      'a custom ref past the list',
      (p: Record<string, unknown>) => {
        firstSlot(p).exercise = '#5';
      },
    ],
    [
      'a catalog id that is not a slug',
      (p: Record<string, unknown>) => {
        firstSlot(p).exercise = "x'; DROP TABLE exercises;--";
      },
    ],
    [
      'too many cues',
      (p: Record<string, unknown>) => {
        firstSlot(p).badges = ['a', 'b', 'c', 'd', 'e', 'f'];
      },
    ],
    [
      'a week past the phase',
      (p: Record<string, unknown>) => {
        (firstSlot(p).weeks as SharedWeek[])[0].weekNumber = 9;
      },
    ],
    [
      'a repeated week',
      (p: Record<string, unknown>) => {
        (firstSlot(p).weeks as SharedWeek[])[1].weekNumber = 1;
      },
    ],
    [
      'zero sets',
      (p: Record<string, unknown>) => {
        (firstSlot(p).weeks as SharedWeek[])[0].sets = 0;
      },
    ],
    [
      'an unknown intensity',
      (p: Record<string, unknown>) => {
        (firstSlot(p).weeks as unknown as Record<string, unknown>[])[0].intensityType = 'vibes';
      },
    ],
    [
      'no phases',
      (p: Record<string, unknown>) => {
        p.routines = [];
      },
    ],
    [
      'a blank name',
      (p: Record<string, unknown>) => {
        p.name = '   ';
      },
    ],
  ])('rejects %s', (_label, mutate) => {
    expect(bad(mutate)).toBeNull();
  });
});

describe('helpers', () => {
  it('round-trips base64url for every tail length', () => {
    for (let n = 0; n < 12; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 250) % 256);
      expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    }
    expect(fromBase64Url('ab+c')).toBeNull();
  });

  it('hashes like the IEEE CRC-32', () => {
    expect(crc32('123456789')).toBe('cbf43926');
  });

  it('lists catalog refs and counts what the confirm card names', () => {
    expect(catalogRefs(program()).sort()).toEqual(
      [...CATALOG.slice(0, 5), 'dumbbell-bench-press'].sort(),
    );
    expect(programCounts(program())).toEqual({ phases: 3, splits: 12, exercises: 6 });
  });
});
