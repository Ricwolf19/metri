import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { useFocusEffect } from 'expo-router';

import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  EmptyState,
  FadeInUp,
  Input,
  Screen,
  SectionLabel,
  SegmentedControl,
  Stat,
  TrendChart,
  useToast,
  type Segment,
  type TrendPoint,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  backfillFromPhotos,
  bodyMetricsQuery,
  saveBodyMetric,
} from '@/features/body/body-metrics.repo';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import { BodyMap } from '@/features/training/components/BodyMap';
import { MapLegend, type MapView } from '@/features/training/components/MapLegend';
import {
  MuscleDetailSheet,
  type MuscleDetail,
} from '@/features/training/components/MuscleDetailSheet';
import { localDateKey } from '@/features/training/dates';
import { adherenceRate, averageRir, hardSetCount } from '@/features/training/effort-stats';
import {
  balanceFill,
  fatigueFill,
  recencyFill,
  untrainedFill,
} from '@/features/training/muscle-colors';
import {
  fractionalSets,
  headShares,
  muscleBalance,
  muscleFatigue,
  muscleStrength,
  WEEKLY_SET_TARGET,
  type MuscleIndex,
} from '@/features/training/muscle-load';
import type { MuscleHead } from '@/features/training/muscles';
import {
  effortSets,
  effortSummary,
  exerciseNames,
  loadedSets,
  monthlyWorkouts,
  muscleIndex,
  recentWorkouts,
  workoutCounts,
} from '@/features/training/stats.repo';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { settings } from '@/lib/storage';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme/theme-context';

type Window = '7' | '30' | '90';

const DAY_MS = 86_400_000;

/**
 * Analytics — the body map plus the trends behind it.
 *
 * Every widget renders in all states: a fresh install shows the whole screen
 * with empty states naming what unlocks each number, rather than a blank page
 * that looks broken.
 */
const Analytics = () => {
  const t = useT();
  const theme = useTheme();
  const { user } = useAuth();
  const { date: formatDate } = useDateFormat();
  const now = useNow();
  const toast = useToast();

  const [view, setView] = useState<MapView>('balance');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [days, setDays] = useState<Window>('30');
  const [openHeads, setOpenHeads] = useState<MuscleHead[]>([]);
  const [weighIn, setWeighIn] = useState('');

  const userId = user?.id ?? '';
  const windowDays = Number(days);
  const since = useMemo(() => new Date(now - windowDays * DAY_MS), [now, windowDays]);

  const index: MuscleIndex = useMemo(() => muscleIndex(), []);
  const names = useMemo(() => exerciseNames(), []);
  const sets = useMemo(() => (userId ? loadedSets(userId, since) : []), [userId, since]);

  const weeks = windowDays / 7;
  const balance = useMemo(() => muscleBalance(sets, index, weeks), [sets, index, weeks]);
  const fatigue = useMemo(() => muscleFatigue(sets, index), [sets, index]);
  const strength = useMemo(() => muscleStrength(sets, index), [sets, index]);

  /** One fill per head for the current view, plus the weight used to resolve
   * heads that share a drawn region. */
  const fills = useMemo(() => {
    const out = new Map<MuscleHead, { color: string; weight: number }>();
    for (const b of balance) {
      const f = fatigue.find((x) => x.head === b.head)!;
      const s = strength.find((x) => x.head === b.head)!;
      if (view === 'balance') {
        out.set(b.head, { color: balanceFill(theme, b.status), weight: b.sets });
      } else if (view === 'fatigue') {
        out.set(b.head, { color: fatigueFill(theme, f.index), weight: f.index });
      } else {
        out.set(b.head, {
          color: recencyFill(theme, s.daysSince),
          weight: s.daysSince == null ? -1 : 1 / (s.daysSince + 1),
        });
      }
    }
    return out;
  }, [balance, fatigue, strength, view, theme]);

  /** Per-head drilldown, including which exercises produced the volume. */
  const details = useMemo(() => {
    const perHead = new Map<MuscleHead, Map<string, number>>();
    for (const set of sets) {
      // Same attribution the fills use — one rule, so the two cannot disagree.
      for (const [head] of headShares(index.get(set.exerciseId))) {
        const byExercise = perHead.get(head) ?? new Map<string, number>();
        byExercise.set(set.exerciseId, (byExercise.get(set.exerciseId) ?? 0) + 1);
        perHead.set(head, byExercise);
      }
    }

    const out = new Map<MuscleHead, MuscleDetail>();
    for (const b of balance) {
      out.set(b.head, {
        balance: b,
        fatigue: fatigue.find((x) => x.head === b.head)!,
        strength: strength.find((x) => x.head === b.head)!,
        exercises: [...(perHead.get(b.head) ?? new Map())]
          .map(([id, count]) => ({ id, name: names.get(id) ?? id, sets: count }))
          .sort((a, c) => c.sets - a.sets),
      });
    }
    return out;
  }, [sets, index, names, balance, fatigue, strength]);

  const totalFractional = useMemo(
    () => Object.values(fractionalSets(sets, index)).reduce((a, b) => a + b, 0),
    [sets, index],
  );
  const counts = useMemo(() => (userId ? workoutCounts(userId) : null), [userId]);
  const months = useMemo(() => (userId ? monthlyWorkouts(userId, 6) : []), [userId]);
  const recent = useMemo(() => (userId ? recentWorkouts(userId, 5) : []), [userId]);
  const effort = useMemo(() => (userId ? effortSets(userId, since) : []), [userId, since]);
  const adherence = useMemo(() => (userId ? effortSummary(userId, since) : null), [userId, since]);

  /** Held in state, not a memo: the chart has to refresh after a weigh-in is
   * written, which is an event rather than a change of inputs. */
  const [weights, setWeights] = useState<TrendPoint[]>([]);
  const refreshWeights = useCallback(() => {
    if (!userId) return setWeights([]);
    const sinceKey = localDateKey(new Date(new Date().getTime() - 180 * DAY_MS));
    setWeights(
      bodyMetricsQuery(userId, sinceKey)
        .all()
        .filter((r) => r.weightKg != null)
        .map((r) => ({ label: r.date.slice(5), value: r.weightKg as number })),
    );
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      // Progress photos carried an optional weight long before `body_metrics`
      // existed; seed the timeline from them once, so an upgrading install
      // opens this screen with history instead of an empty chart.
      if (userId && !settings.hasBackfilledBodyMetrics()) {
        backfillFromPhotos(userId);
        settings.markBodyMetricsBackfilled();
      }
      refreshWeights();
    }, [userId, refreshWeights]),
  );

  const onLogWeight = () => {
    const kg = Number(weighIn);
    if (!weighIn || !Number.isFinite(kg) || kg <= 0) return;
    saveBodyMetric(userId, localDateKey(new Date(now)), { weightKg: kg });
    setWeighIn('');
    refreshWeights();
    toast.success(t('stats.weightSaved'));
  };

  if (!user) return null;

  const hasSets = sets.length > 0;
  const rate = adherence ? adherenceRate(adherence) : null;

  const monthChart: Chart = {
    kind: 'bars',
    max: Math.max(1, ...months.map((m) => m.count)),
    bars: months.map((m, i) => ({
      label: m.label,
      value: m.count,
      display: String(m.count),
      color: theme.brand,
      highlight: i === months.length - 1,
    })),
  };

  const viewSegments: Segment<MapView>[] = [
    { value: 'balance', label: t('stats.balance') },
    { value: 'fatigue', label: t('stats.fatigue') },
    { value: 'strength', label: t('stats.strength') },
  ];
  const sideSegments: Segment<'front' | 'back'>[] = [
    { value: 'front', label: t('stats.front') },
    { value: 'back', label: t('stats.back') },
  ];
  const windowSegments: Segment<Window>[] = [
    { value: '7', label: t('stats.windowWeek') },
    { value: '30', label: t('stats.windowMonth') },
    { value: '90', label: t('stats.windowQuarter') },
  ];

  return (
    <Screen
      scroll
      contentClassName="px-5 pb-16"
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={t('stats.title')}
          subtitle={t('stats.subtitle')}
        />
      }
    >
      {/* ── Body map ─────────────────────────────────────────────────────── */}
      <FadeInUp>
        <SectionLabel label={t('stats.bodyMap')} className="mb-2 mt-2" />
        <Card>
          <SegmentedControl value={view} segments={viewSegments} onChange={setView} />
          <View className="mt-3">
            <SegmentedControl value={days} segments={windowSegments} onChange={setDays} />
          </View>

          <View className="mt-4">
            <BodyMap
              fills={fills}
              side={side}
              sex={user.sex ?? null}
              onPressRegion={setOpenHeads}
            />
          </View>

          <View className="mt-3">
            <SegmentedControl value={side} segments={sideSegments} onChange={setSide} />
          </View>

          <View className="mt-4">
            <MapLegend view={view} />
          </View>

          <Text className="mt-3 text-xs leading-5 text-ink-500">
            {view === 'balance'
              ? t('stats.balanceHint', {
                  min: WEEKLY_SET_TARGET.min,
                  max: WEEKLY_SET_TARGET.max,
                })
              : view === 'fatigue'
                ? t('stats.fatigueHint')
                : t('stats.strengthHint')}
          </Text>

          {hasSets ? null : (
            <View className="mt-3">
              <EmptyState hint={t('stats.emptyMap')} />
            </View>
          )}
        </Card>
      </FadeInUp>

      {/* ── Training counts ──────────────────────────────────────────────── */}
      <FadeInUp delay={60}>
        <SectionLabel label={t('stats.training')} />
        <Card className="flex-row">
          <Stat label={t('stats.workouts')} value={String(counts?.total ?? 0)} />
          <Stat label={t('stats.thisMonth')} value={String(counts?.thisMonth ?? 0)} />
          <Stat label={t('stats.weeklySets')} value={String(Math.round(totalFractional))} />
        </Card>

        <Card className="mt-3">
          <Text className="mb-3 text-xs text-ink-400">{t('stats.perMonth')}</Text>
          {counts?.total ? (
            <CalcChart chart={monthChart} />
          ) : (
            <EmptyState hint={t('stats.emptyMonths')} />
          )}
        </Card>
      </FadeInUp>

      {/* ── Effort: planned vs actual ────────────────────────────────────── */}
      <FadeInUp delay={90}>
        <SectionLabel label={t('stats.effort')} hint={t('stats.effortHint')} />
        <Card>
          <View className="flex-row">
            <Stat label={t('stats.hardSets')} value={String(hardSetCount(effort))} />
            <Stat label={t('stats.avgRir')} value={averageRir(effort)?.toFixed(1) ?? '—'} />
            <Stat label={t('stats.onTarget')} value={rate == null ? '—' : `${rate}%`} />
          </View>
          {rate == null ? (
            <View className="mt-3">
              <EmptyState hint={t('stats.emptyEffort')} />
            </View>
          ) : (
            <View className="mt-3 gap-1">
              <Text className="text-xs text-ink-400">
                {t('stats.effortEasy')}: {adherence?.easy ?? 0}
              </Text>
              <Text className="text-xs text-ink-400">
                {t('stats.effortHard')}: {adherence?.hard ?? 0}
              </Text>
            </View>
          )}
        </Card>
      </FadeInUp>

      {/* ── Body weight ──────────────────────────────────────────────────── */}
      <FadeInUp delay={120}>
        <SectionLabel label={t('stats.body')} />
        <Card>
          <Text className="mb-3 text-xs text-ink-400">{t('stats.weightTrend')}</Text>
          {weights.length > 1 ? (
            <TrendChart points={weights} unit=" kg" />
          ) : (
            <EmptyState hint={t('stats.emptyWeight')} />
          )}
          <View className="mt-4 flex-row items-center gap-2">
            <View className="flex-1">
              <Input
                value={weighIn}
                onChangeText={setWeighIn}
                keyboardType="decimal-pad"
                placeholder="kg"
                maxLength={6}
              />
            </View>
            <Button label={t('stats.logWeight')} variant="secondary" onPress={onLogWeight} />
          </View>
        </Card>
      </FadeInUp>

      {/* ── Recent sessions ──────────────────────────────────────────────── */}
      <FadeInUp delay={150}>
        <SectionLabel label={t('stats.recent')} />
        {recent.length ? (
          <Card className="gap-0 py-1">
            {recent.map((w, i) => (
              <View
                key={w.id}
                className={[
                  'flex-row items-center py-3',
                  i > 0 ? 'border-t border-ink-800' : '',
                ].join(' ')}
              >
                <Text className="flex-1 text-sm font-sans-medium text-ink-100">
                  {w.completedAt ? formatDate(w.completedAt) : '—'}
                </Text>
                <Text className="ml-3 text-xs text-ink-400">
                  {t('stats.setsCount', { n: w.setCount })}
                </Text>
                <Text className="ml-3 text-xs text-ink-500">{w.volumeKg} kg</Text>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState hint={t('stats.emptyRecent')} />
        )}
      </FadeInUp>

      <MuscleDetailSheet heads={openHeads} details={details} onClose={() => setOpenHeads([])} />
    </Screen>
  );
};

export default Analytics;
