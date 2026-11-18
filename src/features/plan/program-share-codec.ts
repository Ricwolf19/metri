import { Inflate, deflateSync, strFromU8, strToU8 } from 'fflate';

import type { Equipment, ExerciseCategory, IntensityType, SetGroup } from '@/db/schema';
import { MAX_BADGE_LEN, MAX_BADGES } from '@/features/training/badge-limits';
import { MUSCLE_HEADS } from '@/features/training/muscles';

/**
 * ONE program, phone to phone, as a run of QR codes. Pure: no database, no UI.
 *
 * The payload is the program tree only — phases, splits, slots, the week
 * prescriptions, and the definitions of the CUSTOM exercises it names (catalog
 * exercises travel as their seed id). Nothing about the sender rides along: no
 * logs, no enrollment, no schedule (the receiver picks their own days), no
 * swap countdown. JSON → deflate → base64url → frames of `FRAME_CHARS`, each
 * one self-describing:
 *
 *   metri:p<version>:<crc32 of the whole text>:<i>/<n>:<chunk>
 *
 * The CRC doubles as the share id, so frames of two different programs can
 * never be stitched together, and a reassembled text that does not hash to it
 * is rejected. Keys are a WIRE FORMAT: add, never rename; a change an older
 * build cannot read bumps `SHARE_VERSION`, which that build reports as
 * "update metri" instead of misreading.
 */

const SHARE_VERSION = 1;
const SCHEME = 'metri:p';

/**
 * Characters of payload per code. With the ~25-character header and error
 * correction L that is a version 18–19 symbol (≈90 modules a side): at the
 * ~300 dp the share screen draws it, that is 3+ px per module, which a phone
 * camera reads off another screen in a frame or two. Denser codes (v25+) need
 * a steadier hand and slow the capture of every frame of a cycling sequence.
 */
export const FRAME_CHARS = 700;
/** 60 codes ≈ 42 KB compressed — far past any real program (a full preset is ~6). */
const MAX_FRAMES = 60;
/** Inflate stops here: a crafted code must not expand into memory without bound. */
const MAX_JSON_BYTES = 1_000_000;

/* ── Payload ─────────────────────────────────────────────────────────────── */

/** A prescription week, column for column with `week_configs`. */
export type SharedWeek = {
  weekNumber: number;
  sets: number;
  reps: number;
  repsMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  toFailure: boolean;
  restSeconds: number | null;
  intensityType: IntensityType;
  intensityValue: number | null;
  setGroups: SetGroup[] | null;
};

/** A slot. `exercise` and `alternatives` are catalog ids, or `#<n>` = `exercises[n]`. */
type SharedSlot = {
  exercise: string;
  restSeconds: number | null;
  notes: string | null;
  badges: string[];
  alternatives: string[];
  weeks: SharedWeek[];
};

type SharedDay = { name: string; slots: SharedSlot[] };

type SharedRoutine = {
  name: string;
  durationWeeks: number;
  rmTestWeek: number | null;
  days: SharedDay[];
};

/** A custom exercise, defined in full: the receiver has no copy of it. */
export type SharedExercise = {
  name: string;
  category: ExerciseCategory;
  equipment: Equipment | null;
  unilateral: boolean;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string | null;
};

export type SharedProgram = {
  name: string;
  description: string | null;
  durationWeeks: number | null;
  exercises: SharedExercise[];
  routines: SharedRoutine[];
};

/** `#3` → 3; null for a catalog id. */
export const customRef = (ref: string): number | null =>
  /^#\d{1,3}$/.test(ref) ? Number(ref.slice(1)) : null;

/* ── Validation (scanned data is untrusted) ─────────────────────────────── */

const CATEGORIES: Record<ExerciseCategory, true> = {
  chest: true,
  back: true,
  legs: true,
  shoulders: true,
  arms: true,
  core: true,
  full_body: true,
  cardio: true,
};
const EQUIPMENT: Record<Equipment, true> = {
  barbell: true,
  dumbbell: true,
  machine: true,
  cable: true,
  bodyweight: true,
  kettlebell: true,
  other: true,
};
const INTENSITY: Record<IntensityType, true> = { rir: true, rpe: true, percentage: true };
const HEADS: ReadonlySet<string> = new Set(MUSCLE_HEADS);
const CATALOG_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

const LIMIT = {
  name: 120,
  description: 2000,
  notes: 500,
  instructions: 2000,
  routines: 30,
  days: 14,
  slots: 30,
  weeks: 52,
  alternatives: 10,
  exercises: 200,
  groups: 10,
} as const;

/** Thrown inside `parseSharedProgram`; never leaves it. */
class Invalid extends Error {}
const fail = (): never => {
  throw new Invalid();
};

const obj = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : fail();
const arr = (v: unknown, max: number): unknown[] =>
  Array.isArray(v) && v.length <= max ? v : fail();
const str = (v: unknown, max: number): string =>
  typeof v === 'string' && v.length <= max ? v : fail();
const optStr = (v: unknown, max: number): string | null => (v == null ? null : str(v, max));
const int = (v: unknown, min: number, max: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fail();
const optInt = (v: unknown, min: number, max: number): number | null =>
  v == null ? null : int(v, min, max);
const bool = (v: unknown): boolean => (typeof v === 'boolean' ? v : fail());
const oneOf = <T extends string>(v: unknown, set: Record<T, true>): T =>
  typeof v === 'string' && Object.hasOwn(set, v) ? (v as T) : fail();

const parseGroup = (raw: unknown): SetGroup => {
  const g = obj(raw);
  const group: SetGroup = { sets: int(g.sets, 1, 30), reps: int(g.reps, 0, 200) };
  if (g.repsMax != null) group.repsMax = int(g.repsMax, group.reps, 200);
  if (g.rirMin != null) group.rirMin = int(g.rirMin, 0, 10);
  if (g.rirMax != null) group.rirMax = int(g.rirMax, 0, 10);
  if (g.toFailure != null) group.toFailure = bool(g.toFailure);
  return group;
};

const parseWeek = (raw: unknown, maxWeek: number): SharedWeek => {
  const w = obj(raw);
  const reps = int(w.reps, 0, 200);
  const value = w.intensityValue;
  return {
    weekNumber: int(w.weekNumber, 1, maxWeek),
    sets: int(w.sets, 1, 30),
    reps,
    repsMax: optInt(w.repsMax, reps, 200),
    rirMin: optInt(w.rirMin, 0, 10),
    rirMax: optInt(w.rirMax, 0, 10),
    toFailure: bool(w.toFailure),
    restSeconds: optInt(w.restSeconds, 0, 3600),
    intensityType: oneOf(w.intensityType, INTENSITY),
    intensityValue:
      value == null
        ? null
        : typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
          ? value
          : fail(),
    setGroups: w.setGroups == null ? null : arr(w.setGroups, LIMIT.groups).map(parseGroup),
  };
};

const parseRef = (raw: unknown, customCount: number): string => {
  const ref = str(raw, 80);
  const n = customRef(ref);
  if (n != null) return n < customCount ? ref : fail();
  return CATALOG_ID.test(ref) ? ref : fail();
};

const parseSlot = (raw: unknown, customCount: number, maxWeek: number): SharedSlot => {
  const s = obj(raw);
  const weeks = arr(s.weeks, LIMIT.weeks).map((w) => parseWeek(w, maxWeek));
  if (new Set(weeks.map((w) => w.weekNumber)).size !== weeks.length) fail();
  return {
    exercise: parseRef(s.exercise, customCount),
    restSeconds: optInt(s.restSeconds, 0, 3600),
    notes: optStr(s.notes, LIMIT.notes),
    badges: arr(s.badges, MAX_BADGES).map((b) => str(b, MAX_BADGE_LEN)),
    alternatives: arr(s.alternatives, LIMIT.alternatives).map((a) => parseRef(a, customCount)),
    weeks,
  };
};

const parseRoutine = (raw: unknown, customCount: number): SharedRoutine => {
  const r = obj(raw);
  const durationWeeks = int(r.durationWeeks, 1, LIMIT.weeks);
  return {
    name: str(r.name, LIMIT.name),
    durationWeeks,
    rmTestWeek: optInt(r.rmTestWeek, 1, durationWeeks),
    days: arr(r.days, LIMIT.days).map((d) => {
      const day = obj(d);
      return {
        name: str(day.name, LIMIT.name),
        slots: arr(day.slots, LIMIT.slots).map((s) => parseSlot(s, customCount, durationWeeks)),
      };
    }),
  };
};

const parseExercise = (raw: unknown): SharedExercise => {
  const e = obj(raw);
  const heads = (v: unknown) => {
    const list = arr(v, MUSCLE_HEADS.length).map((h) => str(h, 40));
    return list.every((h) => HEADS.has(h)) ? list : fail();
  };
  const name = str(e.name, 80).trim();
  if (!name) fail();
  return {
    name,
    category: oneOf(e.category, CATEGORIES),
    equipment: e.equipment == null ? null : oneOf(e.equipment, EQUIPMENT),
    unilateral: bool(e.unilateral),
    // New customs always name muscles; a legacy cardio/full-body one may carry none.
    primaryMuscles: heads(e.primaryMuscles),
    secondaryMuscles: heads(e.secondaryMuscles),
    instructions: optStr(e.instructions, LIMIT.instructions),
  };
};

/** The payload, or null when anything about it is off. Every field is re-built, so
 * keys this build does not know are dropped rather than written. */
export const parseSharedProgram = (raw: unknown): SharedProgram | null => {
  try {
    const p = obj(raw);
    const exercises = arr(p.exercises, LIMIT.exercises).map(parseExercise);
    const name = str(p.name, LIMIT.name).trim();
    if (!name) fail();
    const routines = arr(p.routines, LIMIT.routines).map((r) => parseRoutine(r, exercises.length));
    if (!routines.length) fail();
    return {
      name,
      description: optStr(p.description, LIMIT.description),
      durationWeeks: optInt(p.durationWeeks, 1, 260),
      exercises,
      routines,
    };
  } catch (e) {
    if (e instanceof Invalid) return null;
    throw e;
  }
};

/* ── Bytes ↔ text ───────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 (IEEE) of a string's UTF-8 bytes, as 8 lowercase hex digits. */
export const crc32 = (text: string): string => {
  let crc = 0xffffffff;
  for (const byte of strToU8(text)) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

/** base64url without padding — QR-safe and URL-safe, and no reliance on `btoa`. */
export const toBase64Url = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let j = 0; j < chars; j++) out += B64[(n >> (18 - 6 * j)) & 63];
  }
  return out;
};

/** The inverse of `toBase64Url`; null on a character outside the alphabet. */
export const fromBase64Url = (text: string): Uint8Array | null => {
  if (text.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((text.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let o = 0;
  for (const c of text) {
    const v = B64_INDEX.get(c);
    if (v == null) return null;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buffer >> bits) & 0xff;
    }
  }
  return out;
};

/**
 * Input fed to the inflater per push. fflate inflates a whole push before it
 * hands over a single chunk, so one push of every scanned byte would expand
 * all of it (deflate reaches ~1000:1) before the ceiling is ever checked; in
 * slices this small, at most ~1 MB lands past it.
 */
const INFLATE_SLICE = 1024;

/** Inflate with a ceiling: a few KB of crafted input can claim gigabytes. */
const inflateCapped = (bytes: Uint8Array): string | null => {
  const chunks: Uint8Array[] = [];
  let total = 0;
  const inflate = new Inflate((chunk) => {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) throw new Invalid();
    chunks.push(chunk);
  });
  try {
    for (let at = 0; at < bytes.length; at += INFLATE_SLICE) {
      const end = at + INFLATE_SLICE;
      inflate.push(bytes.subarray(at, end), end >= bytes.length);
    }
  } catch {
    return null;
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return strFromU8(out);
};

/* ── Frames ─────────────────────────────────────────────────────────────── */

/** More codes than `MAX_FRAMES`: the program cannot travel this way. Its own class, so a
 * RangeError from anywhere else (a blown stack is one) is never read as "too big". */
export class ShareTooLargeError extends Error {}

/** The program as the codes the share screen cycles through, in order. */
export const encodeProgramShare = (program: SharedProgram): string[] => {
  const text = toBase64Url(deflateSync(strToU8(JSON.stringify(program)), { level: 9 }));
  const id = crc32(text);
  const total = Math.max(1, Math.ceil(text.length / FRAME_CHARS));
  if (total > MAX_FRAMES) throw new ShareTooLargeError('Program too large to share by code.');
  return Array.from(
    { length: total },
    (_, i) =>
      `${SCHEME}${SHARE_VERSION}:${id}:${i + 1}/${total}:${text.slice(i * FRAME_CHARS, (i + 1) * FRAME_CHARS)}`,
  );
};

/** Codes collected so far, for ONE share id; `null` before the first. */
export type ShareScan = {
  id: string;
  total: number;
  parts: Readonly<Record<number, string>>;
} | null;

export type ScanStep =
  /** Not a metri code (a URL, a menu). */
  | { kind: 'foreign' }
  /** A metri program code from a newer build. */
  | { kind: 'newer' }
  /** A code of a different program than the one being collected. */
  | { kind: 'other' }
  | { kind: 'progress'; scan: ShareScan; have: number; total: number; fresh: boolean }
  /** Every code is in but the result is unreadable: start over. */
  | { kind: 'corrupt' }
  | { kind: 'complete'; program: SharedProgram };

const FRAME = /^metri:p(\d{1,3}):([0-9a-f]{8}):(\d{1,3})\/(\d{1,3}):([A-Za-z0-9_-]{1,4000})$/;

/** Reassembled text → the program, or null (bad hash, bad bytes, bad shape). */
const decode = (id: string, text: string): SharedProgram | null => {
  if (crc32(text) !== id) return null;
  const bytes = fromBase64Url(text);
  const json = bytes && inflateCapped(bytes);
  if (json == null) return null;
  try {
    return parseSharedProgram(JSON.parse(json));
  } catch {
    return null;
  }
};

/**
 * Feed one scanned code. Order does not matter and repeats are harmless (the
 * camera reports the same code many times a second); the first metri code
 * fixes which program is being collected.
 */
export const addScannedCode = (scan: ShareScan, code: string): ScanStep => {
  if (!code.startsWith(SCHEME)) return { kind: 'foreign' };
  const m = FRAME.exec(code);
  if (!m) return { kind: 'foreign' };
  const version = Number(m[1]);
  if (version > SHARE_VERSION) return { kind: 'newer' };
  if (version < 1) return { kind: 'foreign' };
  const [, , id, iText, nText, chunk] = m;
  const index = Number(iText);
  const total = Number(nText);
  if (total < 1 || total > MAX_FRAMES || index < 1 || index > total) return { kind: 'foreign' };
  if (scan && (scan.id !== id || scan.total !== total)) return { kind: 'other' };

  const fresh = !scan?.parts[index];
  const next = { id, total, parts: { ...scan?.parts, [index]: chunk } };
  const have = Object.keys(next.parts).length;
  if (have < total) return { kind: 'progress', scan: next, have, total, fresh };

  const text = Array.from({ length: total }, (_, i) => next.parts[i + 1]).join('');
  const program = decode(id, text);
  return program ? { kind: 'complete', program } : { kind: 'corrupt' };
};

/** Catalog ids a payload names (slots and alternatives), for the "do we have them" check. */
export const catalogRefs = (program: SharedProgram): string[] => {
  const ids = new Set<string>();
  for (const r of program.routines)
    for (const d of r.days)
      for (const s of d.slots)
        for (const ref of [s.exercise, ...s.alternatives]) if (customRef(ref) == null) ids.add(ref);
  return [...ids];
};

/** Phases, splits and distinct exercises — what the confirm card names. */
export const programCounts = (
  program: SharedProgram,
): { phases: number; splits: number; exercises: number } => {
  const exercises = new Set<string>();
  let splits = 0;
  for (const r of program.routines) {
    splits += r.days.length;
    for (const d of r.days) for (const s of d.slots) exercises.add(s.exercise);
  }
  return { phases: program.routines.length, splits, exercises: exercises.size };
};
