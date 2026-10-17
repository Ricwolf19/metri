import { useLiveQuery } from '@/db/useLiveQuery';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Card, EmptyState, PressableScale, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  activeExercises,
  buildExerciseSeries,
  mostImproved,
  type ExerciseSessionPoint,
} from '@/features/training/exercise-trend';
import { exerciseDisplayName } from '@/features/training/labels';
import { fromKgHalf } from '@/features/training/progression';
import { exerciseSetsSinceQuery, groupByExercise } from '@/features/training/stats.repo';
import { useI18n, useT } from '@/i18n';
import { dateFromKey } from '@/features/training/dates';
import { useUnits } from '@/lib/useUnits';
import { useTodayKey } from '@/lib/useTodayKey';
import { useTheme } from '@/theme/theme-context';

import type { MetricsSectionProps } from '../sections';

const ACTIVE_DAYS = 30;
const IMPROVED_DAYS = 90;
const MIN_SESSIONS = 4;
const MAX_ROWS = 3;
const DAY_MS = 86_400_000;

/**
 * What is moving: how many lifts were trained lately, and which ones raised
 * their estimated 1RM the most over the last three months. Every row opens the
 * exercise's own trend.
 */
export const ExerciseTrendsSection = ({ headerRight }: MetricsSectionProps) => {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const { muted } = useTheme();
  const { units: unit } = useUnits();
  const today = useTodayKey();
  // Anchored to the day key, not the clock, so the query identity is stable
  // within a day and the deps still refresh it after midnight.
  const since = useMemo(
    () => new Date(dateFromKey(today).getTime() - IMPROVED_DAYS * DAY_MS),
    [today],
  );
  const { data: rows } = useLiveQuery(exerciseSetsSinceQuery(user?.id ?? '', since), [
    user?.id,
    today,
  ]);

  const { byExercise, names } = useMemo(() => {
    const grouped = groupByExercise(rows);
    const series = new Map<string, ExerciseSessionPoint[]>();
    for (const [id, sessions] of grouped.sessions) series.set(id, buildExerciseSeries(sessions));
    return { byExercise: series, names: grouped.names };
  }, [rows]);
  const now = dateFromKey(today).getTime() + DAY_MS;
  const active = activeExercises(byExercise, { windowDays: ACTIVE_DAYS, now });
  const improved = mostImproved(byExercise, {
    windowDays: IMPROVED_DAYS,
    minSessions: MIN_SESSIONS,
    now,
  }).slice(0, MAX_ROWS);
  const nameOf = (id: string) => exerciseDisplayName({ id, name: names.get(id) ?? id }, locale);

  return (
    <>
      <SectionLabel label={t('metrics.trends')} right={headerRight} className="mt-0" />
      {active.length ? (
        <Card className="gap-0 py-1">
          <Text className="py-3 text-sm text-ink-200">
            {t('metrics.trendsActive', {
              exercises: active.length,
              sessions: active.reduce((n, a) => n + a.sessions, 0),
            })}
          </Text>
          <View className="border-t border-ink-800 py-3">
            <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('metrics.trendsImproved')}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-500">{t('metrics.trendsImprovedHint')}</Text>
          </View>
          {improved.length ? (
            improved.map((r) => (
              <PressableScale
                key={r.exerciseId}
                onPress={() =>
                  router.push({
                    pathname: '/training/exercise/[id]',
                    params: { id: r.exerciseId, view: 'history' },
                  })
                }
                className="flex-row items-center border-t border-ink-800 py-3"
              >
                <View className="min-w-0 flex-1 pr-2">
                  <Text className="text-sm font-sans-medium text-ink-100" numberOfLines={1}>
                    {nameOf(r.exerciseId)}
                  </Text>
                  <Text className="mt-0.5 text-xs text-accent">
                    {t('metrics.trendsDelta', {
                      kg: fromKgHalf(r.deltaKg, unit),
                      unit,
                      pct: Math.round(r.deltaPct),
                    })}
                  </Text>
                </View>
                <Text className="mr-2 shrink-0 text-xs text-ink-400">
                  {t('metrics.exSessions', { n: r.sessions })}
                </Text>
                <ChevronRightIcon color={muted} size={16} />
              </PressableScale>
            ))
          ) : (
            <Text className="border-t border-ink-800 py-3 text-xs text-ink-500">
              {t('metrics.trendsEmpty')}
            </Text>
          )}
        </Card>
      ) : (
        <EmptyState hint={t('metrics.trendsEmpty')} />
      )}
    </>
  );
};
