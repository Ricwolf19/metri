import type { EventConfig } from './events';

export type FiringEntry = { weekday: number; hour: number; minute: number };

/** (weekday, time) tuples an event fires at: the explicit `schedule` when present, else hour:minute × weekdays. */
export const scheduleEntries = (cfg: EventConfig): FiringEntry[] => {
  if (cfg.schedule?.length) return cfg.schedule;
  return cfg.weekdays.map((weekday) => ({ weekday, hour: cfg.hour, minute: cfg.minute }));
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
