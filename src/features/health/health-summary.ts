/**
 * What metri reads from the phone's health store, as numbers the Metrics tab
 * can show. Pure: the native reads live in `health-connect.ts`.
 */

/** In the order the section lists them; also the permissions asked for. */
export const HEALTH_METRICS = ['steps', 'activeEnergy', 'sleep'] as const;
export type HealthMetric = (typeof HEALTH_METRICS)[number];

/** One local day. Sleep is the night that ENDED that morning. Null = nothing recorded. */
export type HealthDay = {
  day: string;
  steps: number | null;
  activeKcal: number | null;
  sleepMin: number | null;
};

export type HealthSummary = {
  /** So far today (steps and energy only count up as the day goes). */
  today: { steps: number | null; activeKcal: number | null };
  lastNightSleepMin: number | null;
  /** The 7 days before today (sleep: the last 7 nights), over the days that recorded one. */
  average: { steps: number | null; activeKcal: number | null; sleepMin: number | null };
};

const AVERAGE_DAYS = 7;

/** Mean of what was recorded: a day with no data is unknown, not a zero. */
const mean = (values: (number | null)[]): number | null => {
  const known = values.filter((v): v is number => v != null);
  return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
};

/** `days` are oldest first and end on `today` (see `readHealthDays`). */
export const summarizeHealth = (days: readonly HealthDay[], today: string): HealthSummary => {
  const todayRow = days.find((d) => d.day === today);
  // Today is still filling up, so it would drag the average down: it stays out.
  const before = days.filter((d) => d.day < today).slice(-AVERAGE_DAYS);
  // Last night is complete, so the nights end on today.
  const nights = days.filter((d) => d.day <= today).slice(-AVERAGE_DAYS);
  return {
    today: { steps: todayRow?.steps ?? null, activeKcal: todayRow?.activeKcal ?? null },
    lastNightSleepMin: todayRow?.sleepMin ?? null,
    average: {
      steps: mean(before.map((d) => d.steps)),
      activeKcal: mean(before.map((d) => d.activeKcal)),
      sleepMin: mean(nights.map((d) => d.sleepMin)),
    },
  };
};

/** "7 h 25 min" style parts for a sleep duration. */
export const sleepParts = (minutes: number): { hours: number; minutes: number } => ({
  hours: Math.floor(minutes / 60),
  minutes: minutes % 60,
});
