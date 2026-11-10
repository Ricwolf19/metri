import type { TrainingDayStatus } from '@/db/schema';
import { dateFromKey, localDateKey, mondayOf, weekdayOf } from '@/features/training/dates';
import { MISSED, adherenceStatusKey } from '@/features/training/adherence-colors';
import { WEEKDAY_KEY } from '@/features/training/labels';
import type { TFunction } from '@/i18n';
import { parseJson } from '@/lib/safe-json';
import { storage, type LocaleCode } from '@/lib/storage';
import { tokenHex } from '@/theme/tokens';

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
  /** The week read out by a screen reader ("This week: Monday, trained, …").
   * Optional: a snapshot from an older build has none. */
  week?: string;
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

/**
 * The widget's palette, from the app's tokens (RemoteViews take no NativeWind,
 * so the values are resolved to hex here, never typed by hand).
 */
export const WIDGET_COLORS = {
  bg: tokenHex('--ink-900'),
  card: tokenHex('--ink-800'),
  raised: tokenHex('--ink-700'),
  sunken: tokenHex('--ink-750'),
  text: tokenHex('--ink-50'),
  dim: tokenHex('--ink-300'),
  faint: tokenHex('--ink-400'),
  muted: tokenHex('--ink-500'),
  brand: tokenHex('--brand'),
  onBrand: tokenHex('--brand-contrast'),
  missed: MISSED,
} as const;

type DayVisual = {
  bg: `#${string}`;
  fg: `#${string}`;
  /** Today, still unmarked: a brand ring. */
  ring: boolean;
  /** Rest: an outline, so it never reads as an unlogged day (fills 1.1:1 apart). */
  outline: boolean;
  /** Missed: a "×" after the letter — under deuteranopia red and lime are one olive. */
  cross: boolean;
};

/**
 * One square of the week strip, in the app's adherence colours: brand =
 * trained, red with near-black text and a cross = missed, outlined gray =
 * rest, today unmarked ringed in brand, the days still ahead bare. Colour is
 * never the only cue (the app's calendar follows the same rule).
 */
export const dayVisual = (status: WeekDayStatus, when: 'past' | 'today' | 'future'): DayVisual => {
  const c = WIDGET_COLORS;
  const plain = { ring: false, outline: false, cross: false };
  if (status === 'trained') return { ...plain, bg: c.brand, fg: c.onBrand };
  if (status === 'skipped') return { ...plain, bg: c.missed, fg: c.onBrand, cross: true };
  // Near-black: brand on the ink-500 fill read 3.28:1.
  if (status === 'active') return { ...plain, bg: c.muted, fg: c.onBrand };
  if (status === 'rest') return { ...plain, bg: c.raised, fg: c.dim, outline: true };
  if (when === 'today') return { ...plain, bg: c.sunken, fg: c.brand, ring: true };
  if (when === 'future') return { ...plain, bg: c.bg, fg: c.muted };
  return { ...plain, bg: c.sunken, fg: c.faint };
};

/**
 * The week strip as one spoken line ("This week: Monday, Trained; Tuesday,
 * Missed; …"): the cells are letters on colours, which a screen reader cannot
 * see. Days still ahead name only the weekday.
 */
export const weekA11yLabel = (week: WeekDay[], today: string, t: TFunction): string =>
  t('widget.weekA11y', {
    days: week
      .map((d) => {
        const day = t(WEEKDAY_KEY[weekdayOf(dateFromKey(d.date))]);
        const status = adherenceStatusKey(
          d.status === 'none' ? undefined : d.status,
          d.date > today,
        );
        return status ? `${day}, ${t(status)}` : day;
      })
      .join('; '),
  });
