import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useT, type TFunction, type TranslationKey } from '@/i18n';

import { durationText } from '../session-report';
import { formatRest } from '../session-timeline';
import type { RestComparison, SessionTiming } from '../session-timing';

type Part = 'lifting' | 'rest' | 'setup' | 'idle';

/** Bar order, legend copy and fill. Every part is named and timed in the legend: never colour alone. */
const PARTS: { part: Part; label: TranslationKey; fill: string }[] = [
  { part: 'lifting', label: 'training.timeLifting', fill: 'bg-brand' },
  { part: 'rest', label: 'training.timeRest', fill: 'bg-info' },
  { part: 'setup', label: 'training.timeSetup', fill: 'bg-ink-500' },
  { part: 'idle', label: 'training.timeIdle', fill: 'bg-amber-400' },
];

const secondsOf = (timing: SessionTiming): Record<Part, number> => ({
  lifting: timing.liftingSeconds,
  rest: timing.restSeconds,
  setup: timing.setupSeconds,
  idle: timing.idleSeconds,
});

/** The rests against the plan, in one plain sentence; null when there was no rest to compare. */
const restLine = (rest: RestComparison | null, t: TFunction): string | null => {
  if (!rest) return null;
  const planned = formatRest(rest.plannedSeconds);
  if (rest.takenSeconds == null) return t('training.timeRestPlanned', { planned });
  const params = { taken: formatRest(rest.takenSeconds), planned };
  if (rest.versus === 'longer') return t('training.timeRestLonger', params);
  if (rest.versus === 'shorter') return t('training.timeRestShorter', params);
  return t('training.timeRestOnPlan', params);
};

/**
 * Where a finished session's time went: lifting, rest, setup and idle as one
 * stacked bar with a legend that names and times each part, a plain verdict
 * and the rests against the plan. Every number is an estimate
 * (`session-timing.ts`), and the copy says so. With sets logged in bursts the
 * split means nothing, so only the total and the timed rests are shown.
 */
export const SessionTimeCard = ({
  timing,
  nameOf,
}: {
  timing: SessionTiming;
  /** The display name of an exercise, for the longest pause. */
  nameOf: (exerciseId: string) => string;
}) => {
  const t = useT();
  const seconds = secondsOf(timing);
  const accounted = PARTS.reduce((sum, p) => sum + seconds[p.part], 0);
  const share = (s: number) => (accounted > 0 ? Math.round((s / accounted) * 100) : 0);
  const idlePct = Math.round(timing.idleShare * 100);
  const verdict =
    timing.verdict === 'onPace'
      ? t('training.timeOnPace')
      : timing.verdict === 'someIdle'
        ? t('training.timeSomeIdle', { pct: idlePct })
        : timing.verdict === 'lotsIdle'
          ? t('training.timeLotsIdle', { pct: idlePct })
          : null;
  const pause = timing.longestPause;
  const rest = restLine(timing.rest, t);

  return (
    <Card>
      <Text className="text-sm font-sans-semibold text-ink-100">
        {t('training.timeTotal', { duration: durationText(timing.totalSeconds) })}
      </Text>
      {timing.reliable ? (
        <>
          {/* The bar only draws what the legend under it says. */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="mt-3 h-3 flex-row overflow-hidden rounded-full bg-ink-700"
          >
            {PARTS.map((p) =>
              seconds[p.part] > 0 ? (
                <View key={p.part} className={p.fill} style={{ flex: seconds[p.part] }} />
              ) : null,
            )}
          </View>
          <View className="mt-3 gap-2">
            {PARTS.map((p) => {
              const value = `${durationText(seconds[p.part])} · ${share(seconds[p.part])} %`;
              return (
                <View
                  key={p.part}
                  accessible
                  accessibilityLabel={`${t(p.label)}: ${value}`}
                  className="flex-row items-center gap-2.5"
                >
                  <View className={`h-2.5 w-2.5 rounded-sm ${p.fill}`} />
                  <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-ink-200">
                    {t(p.label)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="shrink-0 font-mono text-xs tabular-nums text-ink-300"
                  >
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
          {verdict ? <Text className="mt-3 text-sm leading-5 text-ink-100">{verdict}</Text> : null}
          {pause ? (
            <Text className="mt-1.5 text-sm leading-5 text-ink-300">
              {t('training.timeLongestPause', {
                duration: durationText(pause.seconds),
                name: nameOf(pause.exerciseId),
                n: pause.setNumber,
              })}
            </Text>
          ) : null}
          <Text className="mt-1.5 text-sm leading-5 text-ink-300">
            {t('training.timeLeadIn', { duration: durationText(timing.leadInSeconds) })}
          </Text>
        </>
      ) : (
        <Text className="mt-2 text-sm leading-5 text-ink-300">{t('training.timeBatched')}</Text>
      )}
      {rest ? <Text className="mt-1.5 text-sm leading-5 text-ink-300">{rest}</Text> : null}
    </Card>
  );
};
