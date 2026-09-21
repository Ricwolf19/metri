import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  SectionLabel,
  Stat,
  TextLink,
  TrendChart,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { WeighInSheet } from '@/features/body/components/WeighInSheet';
import { siteLabelKey } from '@/features/body/sites';
import { fromCm, lengthUnitFor } from '@/features/body/units';
import { useBodyLog } from '@/features/body/useBodyLog';
import { MIN_WEIGH_INS, daysBetween } from '@/features/body/weekly';
import { fromKg } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

import type { MetricsSectionProps } from '../sections';

const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));

const TONE_CLASS = { good: 'text-brand', info: 'text-ink-300', warn: 'text-amber-500' } as const;

/**
 * The body log on the Metrics tab: the weekly weight average, how it moved,
 * and the tape site that tells the truth about it — always together. Weight is
 * never shown alone, because alone it says almost nothing.
 */
export const BodySection = ({ headerRight }: MetricsSectionProps) => {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { dateKey } = useDateFormat();
  const units = settings.getUnits();
  const [weighing, setWeighing] = useState(false);
  const log = useBodyLog(user?.id ?? '', user?.sex ?? null);

  if (!user) return null;

  const anchor = log.weeks[0]?.weekStart ?? log.today;
  const shown = log.weeks.filter((w) => w.index <= log.currentWeek);
  const points = log.weighIns.map((w) => ({
    x: daysBetween(anchor, w.date),
    y: fromKg(w.weightKg, units),
  }));
  // Each week's average sits mid-week, over the days it summarises.
  const line = shown.flatMap((w) =>
    w.avgKg != null ? [{ x: w.index * 7 + 3, y: fromKg(w.avgKg, units) }] : [],
  );
  const target = log.calendar
    .filter((r) => r.week <= log.currentWeek + 1)
    .map((r) => ({ x: r.week * 7 + 3, y: fromKg(r.targetKg, units) }));

  const thisWeek = log.thisWeek;
  const missing = thisWeek ? Math.max(0, MIN_WEIGH_INS - thisWeek.n) : MIN_WEIGH_INS;

  return (
    <>
      <SectionLabel label={t('metrics.sectionBody')} right={headerRight} className="mt-0" />
      <Card>
        <View className="flex-row">
          <Stat
            label={t('body.weekAverage')}
            value={thisWeek?.avgKg != null ? String(fromKg(thisWeek.avgKg, units)) : '—'}
            unit={units}
          />
          <Stat
            label={t('body.vsLastWeek')}
            value={log.weightDeltaKg != null ? signed(fromKg(log.weightDeltaKg, units)) : '—'}
            unit={units}
          />
          <Stat
            label={t(siteLabelKey(log.keySite))}
            value={log.keySiteDeltaCm != null ? signed(fromCm(log.keySiteDeltaCm, units)) : '—'}
            unit={lengthUnitFor(units)}
          />
        </View>

        <View className="mt-4">
          {points.length > 0 ? (
            <TrendChart
              points={points}
              line={line}
              target={target}
              unit={` ${units}`}
              xLabels={[dateKey(anchor), dateKey(log.today)]}
              labels={{
                points: t('body.legendDaily'),
                line: t('body.legendWeekly'),
                target: t('body.legendTarget'),
              }}
            />
          ) : (
            <EmptyState hint={t('body.emptyTrend')} />
          )}
        </View>

        {points.length > 0 && missing > 0 ? (
          <Text className="mt-3 text-xs leading-5 text-ink-500">
            {t('body.needMore', { n: missing })}
          </Text>
        ) : null}

        {log.reading ? (
          <View className="mt-3">
            <Text className={['text-sm leading-6', TONE_CLASS[log.reading.tone]].join(' ')}>
              {t(log.reading.messageKey)}
            </Text>
            <TextLink
              label={t('body.howToRead')}
              onPress={() => router.push('/docs/reading-your-numbers')}
            />
          </View>
        ) : points.length > 0 ? (
          <Text className="mt-3 text-xs leading-5 text-ink-500">{t('body.needTape')}</Text>
        ) : null}

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1">
            <Button label={t('body.weighIn')} variant="brand" onPress={() => setWeighing(true)} />
          </View>
          <View className="flex-1">
            <Button
              label={t('body.checkin')}
              variant="secondary"
              onPress={() => router.push('/body/checkin')}
            />
          </View>
        </View>
      </Card>

      <WeighInSheet
        visible={weighing}
        onClose={() => setWeighing(false)}
        userId={user.id}
        date={log.today}
        previousKg={log.latestWeighIn?.weightKg ?? null}
      />
    </>
  );
};
