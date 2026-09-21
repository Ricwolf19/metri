import type { EventConfig } from './events';

export type FiringEntry = { weekday: number; hour: number; minute: number };

const MINUTES_PER_DAY = 1440;

/** (weekday, time) tuples an event fires at: the explicit `schedule` when present, else hour:minute × weekdays. */
export const scheduleEntries = (cfg: EventConfig): FiringEntry[] => {
  if (cfg.schedule?.length) return cfg.schedule;
  return cfg.weekdays.map((weekday) => ({ weekday, hour: cfg.hour, minute: cfg.minute }));
};

/**
 * Move every entry forward by `minutes`, rolling into the next weekday past
 * midnight — a 22:00 session with a 4-hour delay asks at 02:00 on the day after.
 * Entries that land on the same slot collapse, so two splits in one morning ask
 * once.
 */
export const shiftEntries = (entries: readonly FiringEntry[], minutes: number): FiringEntry[] => {
  const seen = new Set<string>();
  const out: FiringEntry[] = [];
  for (const entry of entries) {
    const total = entry.hour * 60 + entry.minute + minutes;
    const dayShift = Math.floor(total / MINUTES_PER_DAY);
    const at = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const weekday = ((((entry.weekday - 1 + dayShift) % 7) + 7) % 7) + 1;
    const key = `${weekday}:${at}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ weekday, hour: Math.floor(at / 60), minute: at % 60 });
  }
  return out.sort((a, b) => a.weekday - b.weekday || a.hour - b.hour || a.minute - b.minute);
};

/** True when the entries collapse to one daily time (all 7 weekdays, same hour:minute). */
export const isDailyAtOneTime = (entries: readonly FiringEntry[]): boolean => {
  if (entries.length !== 7) return false;
  const [first] = entries;
  return (
    new Set(entries.map((e) => e.weekday)).size === 7 &&
    entries.every((e) => e.hour === first.hour && e.minute === first.minute)
  );
};
