import type { TrainingDayStatus } from '@/db/schema';
import { dateFromKey, localDateKey, mondayOf } from '@/features/training/dates';
import { MISSED } from '@/features/training/adherence-colors';
import { parseJson } from '@/lib/safe-json';
import { storage, type LocaleCode } from '@/lib/storage';
import { THEME_VARS } from '@/theme/tokens';

/** Adherence status for one day of the widget's week strip. */
export type WeekDayStatus = TrainingDayStatus | 'none';
export type WeekDay = { date: string; status: WeekDayStatus };

/**
 * The widget's data contract: a small MMKV snapshot written by the app whenever
 * it goes to the foreground or the background, read by the headless task
 * handler when the OS asks for a render. Copy is resolved when the snapshot is
 * built (the widget has no i18n of its own), so a field here is a finished line.
 */
export type WidgetSnapshot = {
  tdee: number | null;
  /** How today is marked; 'none' = nothing yet (only then is "Mark today" offered). */
  today: WeekDayStatus;
  streak: number;
  /** The current week, Monday first — the same week the Train tab draws. */
  week: WeekDay[];
  /** A workout in progress: its label and the next set, opening the session. */
  live: { title: string; line: string | null; url: string } | null;
  /** The split up next and when it is scheduled ("Today · 18:00"). */
  next: { name: string; when: string | null } | null;
  /** Completed sessions per month, oldest first (the last six; this month last). */
  monthly: number[];
  /** Finished copy for the widget's fixed labels, in `locale`. */
  copy: WidgetCopy;
  locale: LocaleCode;
  updatedAt: number;
};

type WidgetCopy = {
  badge: string;
  streak: string;
  tdee: string;
  monthly: string;
  empty: string;
  emptyHint: string;
  pills: [string, string, string];
};

const KEY = 'widget.snapshot';

export const writeWidgetSnapshot = (snapshot: WidgetSnapshot): void => {
  storage.set(KEY, JSON.stringify(snapshot));
};

/**
 * The cached snapshot, or null. One written by an older build lacks the newer
 * fields (or is not an object at all): it reads as null and the handler draws
 * placeholders until the app writes a fresh one — never a throw in a headless
 * render, which blanks the widget.
 */
export const readWidgetSnapshot = (): WidgetSnapshot | null => {
  const parsed = parseJson<Partial<WidgetSnapshot> | null>(storage.getString(KEY), null);
  if (!parsed || typeof parsed !== 'object' || !parsed.copy || !Array.isArray(parsed.week)) {
    return null;
  }
  return parsed as WidgetSnapshot;
};

/** The current week's day keys, Monday first, around `today`. */
export const currentWeekKeys = (today: string): string[] => {
  const monday = mondayOf(dateFromKey(today));
  return Array.from({ length: 7 }, (_, i) =>
    localDateKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  );
};

const hex = (token: string): `#${string}` =>
  `#${(THEME_VARS[token] ?? '0 0 0')
    .split(' ')
    .map((c) => Number(c).toString(16).padStart(2, '0'))
    .join('')}`;

/**
 * The widget's palette, from the app's tokens (RemoteViews take no NativeWind,
 * so the values are resolved to hex here, never typed by hand).
 */
export const WIDGET_COLORS = {
  bg: hex('--ink-900'),
  card: hex('--ink-800'),
  raised: hex('--ink-700'),
  sunken: hex('--ink-750'),
  text: hex('--ink-50'),
  dim: hex('--ink-300'),
  faint: hex('--ink-400'),
  muted: hex('--ink-500'),
  brand: hex('--brand'),
  onBrand: hex('--brand-contrast'),
  missed: MISSED,
} as const;

/**
 * One square of the week strip, in the app's adherence colours: brand =
 * trained, red with near-black text = missed, gray = rest, today unmarked
 * ringed in brand, the days still ahead bare.
 */
export const dayVisual = (
  status: WeekDayStatus,
  when: 'past' | 'today' | 'future',
): { bg: `#${string}`; fg: `#${string}`; ring: boolean } => {
  const c = WIDGET_COLORS;
  if (status === 'trained') return { bg: c.brand, fg: c.onBrand, ring: false };
  if (status === 'skipped') return { bg: c.missed, fg: c.onBrand, ring: false };
  if (status === 'active') return { bg: c.muted, fg: c.brand, ring: false };
  if (status === 'rest') return { bg: c.raised, fg: c.dim, ring: false };
  if (when === 'today') return { bg: c.sunken, fg: c.brand, ring: true };
  if (when === 'future') return { bg: c.bg, fg: c.muted, ring: false };
  return { bg: c.sunken, fg: c.faint, ring: false };
};
