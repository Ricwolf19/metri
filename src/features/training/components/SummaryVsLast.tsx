import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { fromKgHalf } from '../progression';
import { durationText, topSetOf } from '../session-report';
import type { FullSessionReport } from '../session-report.repo';
import { setText, signedNumber, signedPercent } from '../summary-copy';

/** One "vs last time" line: what changed, in words and numbers, never a colour or an arrow. */
const DeltaRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-baseline justify-between gap-3">
    <Text numberOfLines={1} className="min-w-0 shrink text-sm text-ink-300">
      {label}
    </Text>
    <Text numberOfLines={1} className="shrink-0 font-mono-medium text-sm tabular-nums text-ink-50">
      {value}
    </Text>
  </View>
);

/** Signed minutes: "+6m", "−12m"; a change that rounds away reads "0m". */
const signedDuration = (seconds: number): string => {
  const shown = durationText(Math.abs(seconds));
  return `${shown === '0m' ? '' : seconds > 0 ? '+' : seconds < 0 ? '−' : ''}${shown}`;
};

/**
 * The session summary's comparison with the previous run of its split (or of
 * the split named the same in the program): totals, then each exercise's top
 * set then → now with its e1RM change.
 */
export const SummaryVsLast = ({ report, unit }: { report: FullSessionReport; unit: Units }) => {
  const t = useT();
  const vs = report.vsLast;
  if (!vs) {
    return (
      <Card>
        <Text className="text-sm leading-5 text-ink-300">{t('training.summaryVsLastNone')}</Text>
      </Card>
    );
  }
  const compared = report.exercises.filter((e) => e.vsLast && e.sets.length);
  return (
    <Card className="gap-3">
      <DeltaRow
        label={t('training.summaryVolume')}
        value={[
          `${signedNumber(fromKgHalf(vs.volumeDeltaKg, unit))} ${unit}`,
          vs.volumeGain != null ? signedPercent(vs.volumeGain) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      />
      <DeltaRow label={t('training.summarySets')} value={signedNumber(vs.setsDelta)} />
      {vs.durationDeltaSeconds != null ? (
        <DeltaRow
          label={t('training.summaryDuration')}
          value={signedDuration(vs.durationDeltaSeconds)}
        />
      ) : null}
      {compared.map((e) => (
        <View key={e.exerciseId} className="border-t border-ink-700 pt-3">
          <Text numberOfLines={2} className="text-sm font-sans-medium text-ink-100">
            {e.name}
          </Text>
          {/* Then → now on its own line under the name; the e1RM change closes it. */}
          <Text className="mt-0.5 text-xs leading-4 text-ink-400">
            {[
              `${setText(e.vsLast!, unit)} → ${setText(topSetOf(e.sets)!, unit)}`,
              e.vsLast!.e1rmGain != null
                ? t('training.summaryE1rm', { pct: signedPercent(e.vsLast!.e1rmGain) })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      ))}
    </Card>
  );
};
