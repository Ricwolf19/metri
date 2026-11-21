import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card, ScrollRow, SegmentedControl, Stat, TrendChart } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

import { bestSetOf, prEvents, weeklyTops, type ExerciseSessionPoint } from '../exercise-trend';
import { fromKgHalf } from '../progression';

type Metric = 'top' | 'e1rm' | 'volume';
const METRICS: Metric[] = ['top', 'e1rm', 'volume'];
const MAX_RECORDS = 5;
const WEEKS = 8;

/**
 * One exercise over time: a measure per session (top set, estimated 1RM, or
 * volume) as the line, every set as a dot when the measure is the top set, and
 * a ring on each session that set a record. One measure, one axis — the control
 * swaps the measure instead of stacking three lines. Sessions are plotted by
 * ordinal, not by date: a lift trained twice a week and once a month must both
 * read as a line, and the first/last dates under the plot keep the span honest.
 */
export const ExerciseTrendCard = ({
  points,
  unit,
}: {
  points: readonly ExerciseSessionPoint[];
  unit: Units;
}) => {
  const t = useT();
  const { dayMonth } = useDateFormat();
  const [metric, setMetric] = useState<Metric>('top');

  const measure = (p: ExerciseSessionPoint): number | null =>
    metric === 'top' ? p.topKg : metric === 'e1rm' ? p.e1rmKg : p.volumeKg;
  const shown = (kg: number) => fromKgHalf(kg, unit);
  const line = points.flatMap((p, i) => {
    const v = measure(p);
    return v == null ? [] : [{ x: i, y: shown(v) }];
  });
  const dots =
    metric === 'top'
      ? points.flatMap((p, i) => p.sets.map((s) => ({ x: i, y: shown(s.weightKg) })))
      : [];
  const markers = points.flatMap((p, i) => {
    const v = measure(p);
    return p.isPr && v != null ? [{ x: i, y: shown(v) }] : [];
  });

  // Week by week, the glyph against the week before: the read the lifter asks
  // for on the floor ("did it go up this week?"), which a line by session hides.
  const weeks = weeklyTops(points, { weeks: WEEKS });
  const bestSet = bestSetOf(points);
  const bestE1rm = Math.max(0, ...points.map((p) => p.e1rmKg ?? 0));
  const records = prEvents(points).slice(-MAX_RECORDS).reverse();
  const first = points[0];
  const last = points[points.length - 1];

  const labels: Record<Metric, string> = {
    top: t('exHistory.metricTop'),
    e1rm: t('exHistory.metricE1rm'),
    volume: t('exHistory.metricVolume'),
  };

  return (
    <Card>
      <View className="mb-3">
        <SegmentedControl
          segments={METRICS.map((m) => ({ value: m, label: labels[m] }))}
          value={metric}
          onChange={setMetric}
        />
      </View>
      <TrendChart
        points={dots}
        line={line}
        markers={markers}
        labels={{
          line: t('exHistory.legendSession'),
          points: t('exHistory.legendSets'),
          markers: t('exHistory.legendPr'),
        }}
        xLabels={
          first && last ? [dayMonth(new Date(first.at)), dayMonth(new Date(last.at))] : undefined
        }
        formatX={(x) => (points[x] ? dayMonth(new Date(points[x].at)) : '')}
        unit={unit}
      />
      {weeks.length > 1 ? (
        <View className="mt-4 border-t border-ink-800 pt-3">
          <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('exHistory.byWeek')}
          </Text>
          <View className="mt-1.5">
            <ScrollRow className="gap-1.5">
              {/* The numbers alone: an up/down arrow judged a lighter week as worse,
                  which a deload or a slower tempo is not (the note says so). */}
              {weeks.map((w) => (
                <View
                  key={w.weekStart}
                  className="shrink-0 flex-row items-center gap-1.5 rounded-field bg-ink-850 px-2 py-1"
                >
                  <Text className="text-xs text-ink-400">{dayMonth(new Date(w.weekStart))}</Text>
                  <Text className="font-mono text-sm text-ink-100">{shown(w.topKg)}</Text>
                </View>
              ))}
            </ScrollRow>
          </View>
          <Text className="mt-2 text-xs leading-4 text-ink-500">{t('exHistory.dropNote')}</Text>
        </View>
      ) : null}
      {/* Two by two: four stats in one row left ~70dp a column on a small phone,
          and the Spanish labels shrank to unreadable. */}
      <View className="mt-4 gap-3 border-t border-ink-800 pt-3">
        <View className="flex-row">
          <Stat
            label={t('exHistory.bestSet')}
            value={bestSet ? `${shown(bestSet.weightKg)}×${bestSet.reps}` : '—'}
          />
          <Stat
            label={t('exHistory.bestE1rm')}
            value={bestE1rm ? String(shown(bestE1rm)) : '—'}
            unit={bestE1rm ? unit : undefined}
          />
        </View>
        <View className="flex-row">
          <Stat label={t('exHistory.prCount')} value={String(prEvents(points).length)} />
          <Stat label={t('exHistory.sessionsCount')} value={String(points.length)} />
        </View>
      </View>
      {records.length ? (
        <View className="mt-3 border-t border-ink-800 pt-3">
          <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
            {t('exHistory.records')}
          </Text>
          <View className="mt-1.5 gap-1">
            {records.map((r) => (
              <View key={r.logId} className="flex-row items-center justify-between gap-3">
                <Text className="shrink text-xs text-ink-400" numberOfLines={1}>
                  {dayMonth(new Date(r.at))}
                </Text>
                <Text className="shrink-0 font-mono text-sm text-ink-100">
                  {shown(r.topKg)} {unit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
};
