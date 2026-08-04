import { storage, type LocaleCode } from '@/lib/storage';

/** Adherence status for one day of the widget's week strip. */
type WeekDayStatus = 'trained' | 'rest' | 'skipped' | 'none';
export type WeekDay = { date: string; status: WeekDayStatus };

/**
 * The widget's data contract: a small MMKV snapshot written by the app whenever
 * local data changes, read by the headless task handler when the OS asks for a
 * render. The widget never queries SQLite on its own hot path — see task-handler.
 */
export type WidgetSnapshot = {
  tdee: number | null;
  trainedToday: boolean;
  streak: number;
  /** Last 7 days ending today, oldest first. */
  week: WeekDay[];
  locale: LocaleCode;
  updatedAt: number;
};

const KEY = 'widget.snapshot';

export const writeWidgetSnapshot = (snapshot: WidgetSnapshot): void => {
  storage.set(KEY, JSON.stringify(snapshot));
};

export const readWidgetSnapshot = (): WidgetSnapshot | null => {
  const raw = storage.getString(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const snapshot = parsed as WidgetSnapshot;
    // A snapshot written by an older app version may predate the week strip.
    if (!Array.isArray(snapshot.week)) snapshot.week = [];
    return snapshot;
  } catch {
    return null;
  }
};
