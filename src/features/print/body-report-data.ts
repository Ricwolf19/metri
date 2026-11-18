import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { bodyMetrics, type Sex } from '@/db/schema';
import { MEASUREMENT_SITES, siteLabelKey } from '@/features/body/sites';
import { fromCm, lengthUnitFor } from '@/features/body/units';
import type { useBodyLog } from '@/features/body/useBodyLog';
import { MIN_WEIGH_INS, daysBetween } from '@/features/body/weekly';
import { muscleBalance } from '@/features/training/muscle-load';
import { muscleHeadKey } from '@/features/training/muscles';
import { fromKg } from '@/features/training/progression';
import { loadedSets, muscleIndex } from '@/features/training/stats.repo';
import type { Locale, TFunction } from '@/i18n';
import { dayStartMs } from '@/lib/date';
import type { Units } from '@/lib/storage';

import type { BodyReportInput } from './body-report';

type BodyLog = ReturnType<typeof useBodyLog>;

const DAY_MS = 86_400_000;
/** The web page's default window; the map reads the month like the Metrics tab opens on. */
const REPORT_WINDOW_DAYS = 30;

const latestBodyFat = (userId: string): number | null => {
  const [row] = db
    .select({ pct: bodyMetrics.bodyFatPct })
    .from(bodyMetrics)
    .where(and(eq(bodyMetrics.userId, userId), isNotNull(bodyMetrics.bodyFatPct)))
    .orderBy(desc(bodyMetrics.date))
    .limit(1)
    .all();
  return row?.pct ?? null;
};

/**
 * The body report's numbers: the body log exactly as the Metrics tab reads it
 * (`useBodyLog`, passed in), body fat's latest reading, and the muscle balance
 * the body map computes for its month window — the same functions, so the
 * paper says what the screen says. Body numbers in the app-wide unit.
 */
export const bodyReportInput = (args: {
  userId: string;
  sex: Sex | null;
  log: BodyLog;
  units: Units;
  locale: Locale;
  t: TFunction;
  printedOn: string;
  /** Formats a 'YYYY-MM-DD' key with the lifter's date preset. */
  dateKey: (key: string) => string;
}): BodyReportInput => {
  const { log, units, t } = args;
  const anchor = log.weeks[0]?.weekStart ?? log.today;
  const weekly = log.weeks
    .filter((w) => w.index <= log.currentWeek && w.avgKg != null)
    .map((w) => ({ day: w.index * 7 + 3, value: fromKg(w.avgKg!, units) }));
  const since = new Date(dayStartMs(log.today) - REPORT_WINDOW_DAYS * DAY_MS);
  const sets = loadedSets(args.userId, since);

  return {
    lang: args.locale,
    printedOn: args.printedOn,
    weightUnit: units,
    lengthUnit: lengthUnitFor(units),
    weekAverage: log.thisWeek?.avgKg != null ? fromKg(log.thisWeek.avgKg, units) : null,
    weekDelta: log.weightDeltaKg != null ? fromKg(log.weightDeltaKg, units) : null,
    keySite: {
      label: t(siteLabelKey(log.keySite)),
      delta: log.keySiteDeltaCm != null ? fromCm(log.keySiteDeltaCm, units) : null,
    },
    bodyFatPct: latestBodyFat(args.userId),
    weight: log.weighIns.length
      ? {
          span: daysBetween(anchor, log.today),
          points: log.weighIns.map((w) => ({
            day: daysBetween(anchor, w.date),
            value: fromKg(w.weightKg, units),
          })),
          weekly,
          fromLabel: args.dateKey(anchor),
          toLabel: args.dateKey(log.today),
        }
      : null,
    needMore: log.thisWeek ? Math.max(0, MIN_WEIGH_INS - log.thisWeek.n) : MIN_WEIGH_INS,
    tape: MEASUREMENT_SITES.flatMap(({ id }) => {
      const site = log.bySite.get(id);
      if (!site) return [];
      const previous = site.previous?.valueCm ?? null;
      return [
        {
          label: t(siteLabelKey(id)),
          key: id === log.keySite,
          when: args.dateKey(site.latest.date),
          value: fromCm(site.latest.valueCm, units),
          previous: previous != null ? fromCm(previous, units) : null,
          delta: previous != null ? fromCm(site.latest.valueCm - previous, units) : null,
        },
      ];
    }),
    map: {
      sex: args.sex === 'female' ? 'female' : 'male',
      windowDays: REPORT_WINDOW_DAYS,
      sets: sets.length,
      balance: muscleBalance(sets, muscleIndex(), REPORT_WINDOW_DAYS / 7),
      headName: (head) => t(muscleHeadKey(head)),
    },
  };
};
