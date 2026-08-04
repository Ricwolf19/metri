import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, Screen, ScreenTitle } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import { getExercise } from '@/features/training/exercises.repo';
import { fromKg } from '@/features/training/progression';
import { exerciseHistory, topSetByWeek } from '@/features/training/stats.repo';
import { useI18n, useT } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

/** "100×6,6,5" when the weight holds, "100×6 · 95×8" when it varies. */
const fmtSession = (sets: { weightKg: number; reps: number }[], unit: Units): string => {
  const first = sets[0]?.weightKg ?? 0;
  if (sets.every((s) => s.weightKg === first)) {
    return `${fromKg(first, unit)}${unit} × ${sets.map((s) => s.reps).join(',')}`;
  }
  return sets.map((s) => `${fromKg(s.weightKg, unit)}×${s.reps}`).join(' · ');
};

/**
 * Per-exercise history: the top-set trend per week plus every logged session.
 * Reached from the live session (tap the exercise name) and from Progress.
 */
const ExerciseHistory = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  const { brand } = useTheme();
  const unit = settings.getUnits();

  const exercise = id ? getExercise(id) : null;
  const sessions = useMemo(() => (user && id ? exerciseHistory(user.id, id) : []), [user, id]);
  const weekly = useMemo(() => topSetByWeek(sessions), [sessions]);

  const chart: Chart = {
    kind: 'bars',
    max: Math.max(1, ...weekly.map((w) => w.topKg)),
    bars: weekly.map((w, i) => ({
      label: w.label,
      value: w.topKg,
      display: `${fromKg(w.topKg, unit)}${unit}`,
      color: brand,
      highlight: i === weekly.length - 1,
    })),
  };

  const dateLabel = (d: Date) =>
    d.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });

  return (
    <Screen scroll contentClassName="px-5 pb-10" header={<TopBar showBack />}>
      <ScreenTitle
        title={exercise?.name ?? t('exHistory.title')}
        subtitle={t('exHistory.subtitle')}
      />

      {sessions.length === 0 ? (
        <Card>
          <Text className="text-sm text-ink-400">{t('exHistory.empty')}</Text>
        </Card>
      ) : (
        <>
          {weekly.length > 1 ? (
            <FadeInUp>
              <Card>
                <Text className="mb-3 text-xs text-ink-400">{t('exHistory.topSetWeek')}</Text>
                <CalcChart chart={chart} />
              </Card>
            </FadeInUp>
          ) : null}

          <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">
            {t('exHistory.sessions')}
          </Text>
          <View className="gap-2">
            {sessions.map((s, i) => (
              <FadeInUp key={s.logId} delay={Math.min(i, 6) * 40}>
                <Card className="flex-row items-center py-3">
                  <Text className="w-16 shrink-0 text-xs text-ink-400">
                    {dateLabel(s.completedAt)}
                  </Text>
                  <Text className="flex-1 font-mono text-sm text-ink-100" numberOfLines={2}>
                    {fmtSession(s.sets, unit)}
                  </Text>
                </Card>
              </FadeInUp>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

export default ExerciseHistory;
